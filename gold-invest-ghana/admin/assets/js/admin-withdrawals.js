// admin-withdrawals.js (enhanced)
function loadWithdrawals() {
    const withdrawals = getWithdrawals();
    const pending = withdrawals.filter(w => w.status === 'pending');
    const approved = withdrawals.filter(w => w.status === 'approved');
    
    // Display limits info (optional)
    const limitsDiv = document.getElementById('limitsInfo');
    if (limitsDiv) {
        limitsDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>Withdrawal Limits:</strong><br>
                Min: ₵${WITHDRAWAL_CONFIG.minAmount} | Max per request: ₵${WITHDRAWAL_CONFIG.maxAmount}<br>
                Daily limit: ₵${WITHDRAWAL_CONFIG.dailyLimit} | Minimum balance after: ₵${WITHDRAWAL_CONFIG.minBalanceAfter}
            </div>
        `;
    }
    
    // Rest of your existing loadWithdrawals code...
    // (keep the table population as before)
}