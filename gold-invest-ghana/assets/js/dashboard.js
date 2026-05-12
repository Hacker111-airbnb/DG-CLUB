// ==================== USER DASHBOARD ====================
console.log("dashboard.js loaded");

// Investment plans are now defined in db.js, but we also need them for UI
// We'll reference the same INVESTMENT_PLANS from db.js (global)

function loadUserDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Update balances
    document.getElementById("userBalanceDisplay").innerText = `₵${user.balance.toFixed(2)}`;
    document.getElementById("dashboardBalance").innerText = `₵${user.balance.toFixed(2)}`;
    document.getElementById("profileBalance").innerText = `₵${user.balance.toFixed(2)}`;
    document.getElementById("profileUsername").innerText = user.username || user.phone;
    document.getElementById("profilePhone").innerText = user.phone;
    document.getElementById("profileInviteCode").innerText = user.inviteCode;

    // Referral link
    const referralLink = `${window.location.origin}${window.location.pathname.replace("dashboard.html", "signup.html")}?ref=${user.inviteCode}`;
    document.getElementById("referralLink").value = referralLink;

    // Downlines
    const allUsers = getUsers();
    const downlines = allUsers.filter(u => u.referredBy === user.id);
    document.getElementById("refCount").innerText = downlines.length;
    const downlist = document.getElementById("downlineList");
    if (downlist) {
        downlist.innerHTML = downlines.map(d => `<li class="list-group-item">${d.username || d.phone}</li>`).join("") || '<li class="list-group-item text-muted">No referrals yet</li>';
    }

    // Investments stats
    const investments = getInvestments();
    const userInvestments = investments.filter(inv => inv.userId === user.id);
    const active = userInvestments.filter(inv => inv.status === "active");
    const completed = userInvestments.filter(inv => inv.status === "completed");

    const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalEarned = completed.reduce((sum, inv) => sum + (inv.totalReturn - inv.amount), 0);

    document.getElementById("totalInvestedAmount").innerText = `₵${totalInvested.toFixed(2)}`;
    document.getElementById("totalEarnedAmount").innerText = `₵${totalEarned.toFixed(2)}`;
    document.getElementById("activeCountDisplay").innerText = active.length;

    // Active investments list (Home tab)
    const activeContainer = document.getElementById("activeInvestmentsList");
    if (activeContainer) {
        if (active.length === 0) {
            activeContainer.innerHTML = '<div class="col-12 text-center text-muted">No active investments</div>';
        } else {
            activeContainer.innerHTML = active.map(inv => {
                const planName = INVESTMENT_PLANS[inv.plan]?.name || inv.plan;
                return `
                    <div class="col-md-4">
                        <div class="invest-card p-3">
                            <h5>${planName}</h5>
                            <p>Amount: ₵${inv.amount.toFixed(2)}</p>
                            <p>Daily: ₵${inv.dailyCedi}</p>
                            <p>Matures: ${new Date(inv.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Completed investments list (History tab)
    const completedContainer = document.getElementById("completedInvestmentsList");
    if (completedContainer) {
        completedContainer.innerHTML = completed.map(inv => `
            <div class="list-group-item">₵${inv.amount} - ${INVESTMENT_PLANS[inv.plan]?.name} - Completed</div>
        `).join('') || '<div class="text-muted">No completed investments</div>';
    }

    // Deposit history
    const deposits = getDeposits();
    const userDeposits = deposits.filter(d => d.userId === user.id && d.status === "approved");
    const depositHistory = document.getElementById("depositHistoryList");
    if (depositHistory) {
        depositHistory.innerHTML = userDeposits.map(d => `
            <div class="list-group-item">₵${d.amount} - ${new Date(d.createdAt).toLocaleDateString()}</div>
        `).join('') || '<div class="text-muted">No deposits yet</div>';
    }
}

// Load investment plan cards with amount tiers
function loadInvestGrid() {
    const gridContainer = document.getElementById("investGrid");
    if (!gridContainer) return;

    // For each plan, show tiers in a dropdown or directly as buttons
    // We'll create cards that ask user to select amount from the defined tiers.
    const planKeys = Object.keys(INVESTMENT_PLANS);
    
    gridContainer.innerHTML = planKeys.map(planKey => {
        const plan = INVESTMENT_PLANS[planKey];
        const tiers = Object.entries(plan.tiers);
        return `
            <div class="col-md-4">
                <div class="invest-card text-center p-3" data-plan="${planKey}">
                    <h4>${plan.name}</h4>
                    <p>Duration: ${plan.days} days</p>
                    <div class="mb-2">
                        <label class="fw-bold">Select amount:</label>
                        <select class="form-select form-select-sm mt-1 amount-select" data-plan="${planKey}">
                            <option value="">-- Choose amount --</option>
                            ${tiers.map(([amount, daily]) => `<option value="${amount}">₵${amount} (Daily ₵${daily})</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-gold-card invest-now-btn mt-2" data-plan="${planKey}" disabled>Invest Now</button>
                    <div class="mt-2 small text-muted">Total Return: <span class="total-return-preview">–</span></div>
                </div>
            </div>
        `;
    }).join('');

    // Enable/disable invest button based on selection, and calculate total return
    document.querySelectorAll('.amount-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const planKey = select.getAttribute('data-plan');
            const amount = parseFloat(select.value);
            const btn = select.closest('.invest-card').querySelector('.invest-now-btn');
            const previewSpan = select.closest('.invest-card').querySelector('.total-return-preview');
            
            if (amount && INVESTMENT_PLANS[planKey]) {
                const plan = INVESTMENT_PLANS[planKey];
                const daily = plan.tiers[amount];
                if (daily) {
                    const totalReturn = amount + (daily * plan.days);
                    previewSpan.innerText = `₵${totalReturn}`;
                    btn.disabled = false;
                    btn.setAttribute('data-amount', amount);
                    btn.setAttribute('data-daily', daily);
                } else {
                    previewSpan.innerText = '–';
                    btn.disabled = true;
                }
            } else {
                previewSpan.innerText = '–';
                btn.disabled = true;
            }
        });
    });

    // Attach invest button events
    document.querySelectorAll('.invest-now-btn').forEach(btn => {
        btn.removeEventListener('click', handleInvestClick);
        btn.addEventListener('click', handleInvestClick);
    });
}

// Handle invest button click
async function handleInvestClick(e) {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    
    const planKey = btn.getAttribute('data-plan');
    const amount = parseFloat(btn.getAttribute('data-amount'));
    if (!planKey || isNaN(amount)) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert("Please login again.");
        window.location.href = "login.html";
        return;
    }
    
    if (amount > user.balance) {
        alert(`Insufficient balance! Your balance is ₵${user.balance.toFixed(2)}.`);
        return;
    }
    
    const result = createInvestment(user.id, planKey, amount);
    if (result.success) {
        alert(`✅ Investment of ₵${amount} in ${INVESTMENT_PLANS[planKey].name} plan successful!\nDaily interest of ₵${result.investment.dailyCedi} will be added each day.`);
        location.reload();
    } else {
        alert(result.message);
    }
}

// Action card handlers (same as before)
function setupActionCards() {
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const action = card.getAttribute('data-action');
            switch(action) {
                case 'recharge': window.location.href = 'payment.html'; break;
                case 'withdraw': window.location.href = 'withdrawal.html'; break;
                case 'vip': alert("VIP Club – Coming soon."); break;
                case 'blog': alert("Blog – Coming soon."); break;
                case 'services': alert("Gold Vault services – Contact support."); break;
                case 'telegram': window.open("https://t.me/goldinvestghana", "_blank"); break;
                default: break;
            }
        });
    });
}

function setupPlanSelector() {
    // Just visual toggling, no need to filter tiers
    const btns = document.querySelectorAll('.plan-selector .btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setupCopyLink() {
    const copyBtn = document.getElementById('copyLinkBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('referralLink');
            linkInput.select();
            document.execCommand('copy');
            alert("Referral link copied!");
        });
    }
}

function initDashboard() {
    console.log("Initializing dashboard with new investment tiers...");
    processDailyInterest();
    loadUserDashboard();
    loadInvestGrid();   // This shows the invest cards with dropdowns
    setupActionCards();
    setupPlanSelector();
    setupCopyLink();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}