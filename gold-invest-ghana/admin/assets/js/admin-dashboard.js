const users = getUsers();
const deposits = getDeposits();
const withdrawals = getWithdrawals();

document.getElementById('totalUsers').innerText = users.length;
const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
document.getElementById('pendingCount').innerText = pendingDeposits;
const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
document.getElementById('pendingWithdrawalsCount').innerText = pendingWithdrawals;
const totalBal = users.reduce((sum, u) => sum + u.balance, 0);
document.getElementById('totalInvested').innerText = `₵${totalBal.toFixed(2)}`;