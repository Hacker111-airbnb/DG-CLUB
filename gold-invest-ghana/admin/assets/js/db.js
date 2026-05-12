// ==================== MAIN DATABASE (localStorage) ====================
// All data persistence – users, deposits, withdrawals, investments, interest

console.log("db.js loaded");

// ---------- INITIALIZATION ----------
function initData() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('deposits')) {
        localStorage.setItem('deposits', JSON.stringify([]));
    }
    if (!localStorage.getItem('withdrawals')) {
        localStorage.setItem('withdrawals', JSON.stringify([]));
    }
    if (!localStorage.getItem('investments')) {
        localStorage.setItem('investments', JSON.stringify([]));
    }
    
    // Add test user if none exists
    const users = getUsers();
    if (users.length === 0) {
        const testUser = {
            id: generateId(),
            phone: "0240000000",
            username: "testuser",
            password: "123456",
            balance: 1000,
            referredBy: null,
            inviteCode: generateInviteCode(),
            createdAt: new Date().toISOString()
        };
        users.push(testUser);
        saveUsers(users);
        console.log("Test user created. Phone: 0240000000, Password: 123456");
    }
}

function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateInviteCode() {
    return 'GOLD' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ========== USERS ==========
function getUsers() {
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getUserById(id) {
    const users = getUsers();
    return users.find(u => u.id == id);
}

function getUserByPhone(phone) {
    const users = getUsers();
    return users.find(u => u.phone === phone);
}

function getUserByInviteCode(code) {
    const users = getUsers();
    return users.find(u => u.inviteCode === code);
}

function updateUserBalance(userId, newBalance) {
    const users = getUsers();
    const user = users.find(u => u.id == userId);
    if (user) {
        user.balance = newBalance;
        saveUsers(users);
        return true;
    }
    return false;
}

function addUserBalance(userId, amount) {
    const users = getUsers();
    const user = users.find(u => u.id == userId);
    if (user) {
        user.balance += amount;
        saveUsers(users);
        return true;
    }
    return false;
}

function getCurrentUser() {
    const userId = sessionStorage.getItem('currentUserId');
    if (userId) return getUserById(userId);
    return null;
}

// ========== DEPOSITS ==========
function getDeposits() {
    const data = localStorage.getItem('deposits');
    return data ? JSON.parse(data) : [];
}

function saveDeposits(deposits) {
    localStorage.setItem('deposits', JSON.stringify(deposits));
}

function addDeposit(deposit) {
    const deposits = getDeposits();
    deposits.push(deposit);
    saveDeposits(deposits);
}

function approveDeposit(depositId) {
    const deposits = getDeposits();
    const deposit = deposits.find(d => d.id == depositId);
    if (deposit && deposit.status === 'pending') {
        deposit.status = 'approved';
        saveDeposits(deposits);
        // Add to user balance
        addUserBalance(deposit.userId, deposit.amount);
        return true;
    }
    return false;
}

function rejectDeposit(depositId) {
    const deposits = getDeposits();
    const deposit = deposits.find(d => d.id == depositId);
    if (deposit && deposit.status === 'pending') {
        deposit.status = 'rejected';
        saveDeposits(deposits);
        return true;
    }
    return false;
}

// ========== WITHDRAWALS & LIMITS ==========
const WITHDRAWAL_CONFIG = {
    minAmount: 50,
    maxAmount: 5000,
    dailyLimit: 10000,
    minBalanceAfter: 100
};

function getWithdrawals() {
    const data = localStorage.getItem('withdrawals');
    return data ? JSON.parse(data) : [];
}

function saveWithdrawals(withdrawals) {
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
}

function addWithdrawal(withdrawal) {
    const withdrawals = getWithdrawals();
    withdrawals.push(withdrawal);
    saveWithdrawals(withdrawals);
}

function canWithdraw(userId, amount) {
    const user = getUserById(userId);
    if (!user) return { allowed: false, reason: "User not found" };
    
    if (amount < WITHDRAWAL_CONFIG.minAmount) {
        return { allowed: false, reason: `Minimum withdrawal is ₵${WITHDRAWAL_CONFIG.minAmount}` };
    }
    if (amount > WITHDRAWAL_CONFIG.maxAmount) {
        return { allowed: false, reason: `Maximum per request is ₵${WITHDRAWAL_CONFIG.maxAmount}` };
    }
    if (user.balance < amount) {
        return { allowed: false, reason: "Insufficient balance" };
    }
    if (user.balance - amount < WITHDRAWAL_CONFIG.minBalanceAfter) {
        return { allowed: false, reason: `You must keep at least ₵${WITHDRAWAL_CONFIG.minBalanceAfter} after withdrawal` };
    }
    
    const withdrawals = getWithdrawals();
    const today = new Date().toDateString();
    const todayTotal = withdrawals
        .filter(w => w.userId == userId && new Date(w.createdAt).toDateString() === today && w.status !== 'rejected')
        .reduce((sum, w) => sum + w.amount, 0);
    
    if (todayTotal + amount > WITHDRAWAL_CONFIG.dailyLimit) {
        return { allowed: false, reason: `Daily limit ₵${WITHDRAWAL_CONFIG.dailyLimit}. Used ₵${todayTotal} today.` };
    }
    
    return { allowed: true };
}

function requestWithdrawal(userId, amount, accountDetails) {
    const check = canWithdraw(userId, amount);
    if (!check.allowed) return { success: false, message: check.reason };
    
    const withdrawal = {
        id: Date.now(),
        userId: userId,
        amount: amount,
        accountName: accountDetails.accountName,
        accountNumber: accountDetails.accountNumber,
        network: accountDetails.network,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    addWithdrawal(withdrawal);
    return { success: true, message: "Withdrawal request submitted." };
}

function approveWithdrawal(withdrawalId) {
    const withdrawals = getWithdrawals();
    const withdrawal = withdrawals.find(w => w.id == withdrawalId);
    if (withdrawal && withdrawal.status === 'pending') {
        withdrawal.status = 'approved';
        saveWithdrawals(withdrawals);
        addUserBalance(withdrawal.userId, -withdrawal.amount);
        return true;
    }
    return false;
}

function rejectWithdrawal(withdrawalId) {
    const withdrawals = getWithdrawals();
    const withdrawal = withdrawals.find(w => w.id == withdrawalId);
    if (withdrawal && withdrawal.status === 'pending') {
        withdrawal.status = 'rejected';
        saveWithdrawals(withdrawals);
        return true;
    }
    return false;
}

// ========== INVESTMENTS & AUTOMATED INTEREST ==========
const INVESTMENT_PLANS = {
    stable:   { name: "Stable", days: 40, dailyReturn: 0.0125, minAmount: 500 },
    welfare:  { name: "Welfare", days: 4, dailyReturn: 0.05, minAmount: 200 },
    activity: { name: "Activity", days: 10, dailyReturn: 0.03, minAmount: 300 }
};

function getInvestments() {
    const data = localStorage.getItem('investments');
    return data ? JSON.parse(data) : [];
}

function saveInvestments(investments) {
    localStorage.setItem('investments', JSON.stringify(investments));
}

function createInvestment(userId, amount, planType) {
    const plan = INVESTMENT_PLANS[planType];
    if (!plan) return null;
    if (amount < plan.minAmount) return { success: false, message: `Minimum investment for ${plan.name} is ₵${plan.minAmount}` };
    
    const user = getUserById(userId);
    if (user.balance < amount) return { success: false, message: "Insufficient balance" };
    
    const investments = getInvestments();
    const newInvestment = {
        id: Date.now(),
        userId: userId,
        amount: amount,
        planType: planType,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + plan.days * 86400000).toISOString(),
        dailyReturn: plan.dailyReturn,
        totalReturn: amount * (1 + plan.dailyReturn * plan.days),
        status: 'active',
        lastInterestDate: new Date().toISOString()
    };
    investments.push(newInvestment);
    saveInvestments(investments);
    
    // Deduct amount from user balance
    addUserBalance(userId, -amount);
    return { success: true, investment: newInvestment };
}

function processDailyInterest() {
    const investments = getInvestments();
    let updated = false;
    const now = new Date();
    
    for (let inv of investments) {
        if (inv.status !== 'active') continue;
        
        const lastDate = new Date(inv.lastInterestDate);
        const daysDiff = Math.floor((now - lastDate) / 86400000);
        if (daysDiff <= 0) continue;
        
        const dailyInterest = inv.amount * inv.dailyReturn;
        const totalInterest = dailyInterest * daysDiff;
        addUserBalance(inv.userId, totalInterest);
        
        inv.lastInterestDate = now.toISOString();
        updated = true;
        
        // Check maturity
        const endDate = new Date(inv.endDate);
        if (now >= endDate) {
            inv.status = 'completed';
            addUserBalance(inv.userId, inv.amount * 0.05); // 5% completion bonus
        }
    }
    
    if (updated) saveInvestments(investments);
    return updated;
}

function getUserActiveInvestments(userId) {
    const invs = getInvestments();
    return invs.filter(inv => inv.userId == userId && inv.status === 'active');
}

function getUserCompletedInvestments(userId) {
    const invs = getInvestments();
    return invs.filter(inv => inv.userId == userId && inv.status === 'completed');
}

function getUserTotalEarned(userId) {
    const invs = getInvestments();
    return invs
        .filter(inv => inv.userId == userId && inv.status === 'completed')
        .reduce((sum, inv) => sum + (inv.totalReturn - inv.amount), 0);
}

// Run init
initData();