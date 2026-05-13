// ========== LOCAL STORAGE UTILITIES ==========

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatMoney(amount) {
    return `₵${amount.toFixed(2)}`;
}

// ========== USER MANAGEMENT ==========

function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    const userId = sessionStorage.getItem('currentUserId');
    if (!userId) return null;
    
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

function getUserById(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

function addUserBalance(userId, amount) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.balance += amount;
        saveUsers(users);
    }
    return user;
}

function findUserByInviteCode(inviteCode) {
    const users = getUsers();
    return users.find(u => u.inviteCode === inviteCode) || null;
}

// ========== INVESTMENT MANAGEMENT ==========

function getInvestments() {
    const investments = localStorage.getItem('investments');
    return investments ? JSON.parse(investments) : [];
}

function saveInvestments(investments) {
    localStorage.setItem('investments', JSON.stringify(investments));
}

// ========== DEPOSIT MANAGEMENT ==========

function getDeposits() {
    const deposits = localStorage.getItem('deposits');
    return deposits ? JSON.parse(deposits) : [];
}

function saveDeposits(deposits) {
    localStorage.setItem('deposits', JSON.stringify(deposits));
}
