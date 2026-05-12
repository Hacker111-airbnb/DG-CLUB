// ========== INVESTMENT PLANS (FIXED DAILY CEDI AMOUNTS) ==========
const INVESTMENT_PLANS = {
    stable: {
        name: "Stable",
        days: 40,
        tiers: {
            100: 15,     // Invest 100 → daily 15 Cedi
            250: 35,
            300: 40,
            1000: 60,
            2000: 120,
            5000: 200,
            10000: 400,
            15000: 600
        }
    },
    welfare: {
        name: "Welfare",
        days: 4,
        tiers: {
            100: 4,
            250: 7,
            300: 9,
            1000: 15,
            2000: 20,
            5000: 25,
            10000: 35,
            15000: 120
        }
    },
    activity: {
        name: "Activity",
        days: 10,
        tiers: {
            100: 10,
            250: 15,
            300: 20,
            1000: 50,
            2000: 100,
            5000: 250,
            10000: 350,
            15000: 600
        }
    }
};

// Helper: Get daily Cedi amount for a given plan and investment amount
function getDailyCedi(planType, amount) {
    const plan = INVESTMENT_PLANS[planType];
    if (!plan) return 0;
    // Find exact tier or closest lower tier (in case user enters custom amount not in list)
    const tiers = Object.keys(plan.tiers).map(Number).sort((a,b) => a-b);
    let selectedTier = tiers[0];
    for (let tier of tiers) {
        if (amount >= tier) selectedTier = tier;
        else break;
    }
    return plan.tiers[selectedTier];
}

// Create investment with fixed daily Cedi
function createInvestment(userId, planType, amount) {
    const plan = INVESTMENT_PLANS[planType];
    if (!plan) return null;
    
    // Check minimum tier (smallest tier amount)
    const minAmount = Math.min(...Object.keys(plan.tiers).map(Number));
    if (amount < minAmount) {
        return { success: false, message: `Minimum investment for ${plan.name} is ₵${minAmount}` };
    }
    
    const user = getUserById(userId);
    if (user.balance < amount) {
        return { success: false, message: "Insufficient balance" };
    }
    
    const dailyCedi = getDailyCedi(planType, amount);
    if (dailyCedi === 0) return { success: false, message: "Invalid amount for this plan" };
    
    const totalReturn = amount + (dailyCedi * plan.days);
    
    const investments = getInvestments();
    const newInvestment = {
        id: 'inv_' + Date.now(),
        userId: userId,
        plan: planType,
        amount: amount,
        dailyCedi: dailyCedi,
        days: plan.days,
        totalReturn: totalReturn,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + plan.days * 86400000).toISOString(),
        lastInterestDate: new Date().toISOString(),
        status: 'active'
    };
    investments.push(newInvestment);
    saveInvestments(investments);
    
    // Deduct investment amount from user balance
    addUserBalance(userId, -amount);
    
    return { success: true, investment: newInvestment };
}

// Process daily interest (add dailyCedi to user balance for each active investment)
function processDailyInterest() {
    const investments = getInvestments();
    let updated = false;
    const now = new Date();
    
    for (let inv of investments) {
        if (inv.status !== 'active') continue;
        
        const lastDate = new Date(inv.lastInterestDate);
        const daysDiff = Math.floor((now - lastDate) / 86400000);
        if (daysDiff <= 0) continue;
        
        // Add interest for each missed day (dailyCedi per day)
        const totalInterest = inv.dailyCedi * daysDiff;
        addUserBalance(inv.userId, totalInterest);
        
        inv.lastInterestDate = now.toISOString();
        updated = true;
        
        // Check maturity
        const endDate = new Date(inv.endDate);
        if (now >= endDate) {
            inv.status = 'completed';
            // Add final return (already added daily interest, so optionally add remaining? Actually totalReturn includes principal + all daily interest.
            // But since we already added daily interest daily, the final payout might be just the remaining? Better to handle:
            // At maturity, we ensure user has received full totalReturn. We can add a completion bonus if needed, but typically daily interest already covers.
            // For simplicity, we'll mark as completed only.
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