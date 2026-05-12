document.addEventListener('DOMContentLoaded', () => {
     const userId = sessionStorage.getItem('currentUserId');
     if (!userId) {
         window.location.href = 'login.html';
         return;
     }
     const user = getUserById(userId);
     if (!user) {
         sessionStorage.removeItem('currentUserId');
         window.location.href = 'login.html';
         return;
     }

    // Display available balance
    document.getElementById('availableBalance').innerText = `₵${user.balance.toFixed(2)}`;

    const form = document.getElementById('withdrawalForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const accountName = document.getElementById('accountName').value.trim();
        const accountNumber = document.getElementById('accountNumber').value.trim();
        const network = document.getElementById('network').value;

        if (isNaN(amount) || amount < 10) {
            alert('Please enter a valid amount (minimum ₵10).');
            return;
        }
        if (amount > user.balance) {
            alert(`Insufficient balance! Your balance is ₵${user.balance.toFixed(2)}.`);
            return;
        }
        if (!accountName || !accountNumber || !network) {
            alert('Please fill all fields.');
            return;
        }

        createWithdrawal(userId, amount, accountName, accountNumber, network);
        alert(`✅ Withdrawal request of ₵${amount} submitted for admin approval.`);
        window.location.href = 'dashboard.html';
    });
});