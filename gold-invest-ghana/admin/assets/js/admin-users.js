// ==================== ADMIN USERS MANAGEMENT ====================
console.log("admin-users.js loaded");

function loadUsers() {
    console.log("loadUsers() called");
    
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) {
        console.error("Table body not found! Check if usersTable exists.");
        return;
    }
    
    const users = getUsers();
    console.log("Retrieved users:", users);
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users registered yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        const phone = user.phone || 'N/A';
        const username = user.username || phone;
        const balance = typeof user.balance === 'number' ? user.balance : 0;
        
        row.innerHTML = `
            <td>${phone}</td>
            <td>${username}</td>
            <td class="fw-bold text-success">₵${balance.toFixed(2)}</td>
            <td>
                <button class="btn btn-success btn-sm add-funds me-1" data-id="${user.id}" data-phone="${phone}" data-balance="${balance}">
                    <i class="fas fa-plus-circle"></i> Add Funds
                </button>
                <button class="btn btn-warning btn-sm edit-balance me-1" data-id="${user.id}">
                    <i class="fas fa-edit"></i> Set Balance
                </button>
                <button class="btn btn-danger btn-sm delete-user" data-id="${user.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Attach event listeners
    attachEvents();
}

function attachEvents() {
    // Add Funds
    document.querySelectorAll('.add-funds').forEach(btn => {
        btn.removeEventListener('click', handleAddFunds);
        btn.addEventListener('click', handleAddFunds);
    });
    
    // Set Balance
    document.querySelectorAll('.edit-balance').forEach(btn => {
        btn.removeEventListener('click', handleSetBalance);
        btn.addEventListener('click', handleSetBalance);
    });
    
    // Delete User
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.removeEventListener('click', handleDeleteUser);
        btn.addEventListener('click', handleDeleteUser);
    });
}

function handleAddFunds(e) {
    const btn = e.currentTarget;
    const userId = btn.getAttribute('data-id');
    const phone = btn.getAttribute('data-phone');
    const currentBalance = parseFloat(btn.getAttribute('data-balance'));
    
    const amount = prompt(`Add funds to ${phone}\nCurrent balance: ₵${currentBalance.toFixed(2)}\n\nEnter amount to ADD (GHS):`);
    if (amount === null) return;
    
    const addAmount = parseFloat(amount);
    if (isNaN(addAmount) || addAmount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex === -1) {
        alert("User not found.");
        return;
    }
    
    const oldBalance = users[userIndex].balance;
    users[userIndex].balance = oldBalance + addAmount;
    saveUsers(users);
    
    // Log the transaction
    recordFundLog(userId, addAmount, oldBalance, users[userIndex].balance);
    
    alert(`✅ Added ₵${addAmount.toFixed(2)} to ${phone}\nNew balance: ₵${users[userIndex].balance.toFixed(2)}`);
    loadUsers(); // refresh table
}

function handleSetBalance(e) {
    const btn = e.currentTarget;
    const userId = btn.getAttribute('data-id');
    
    const newBalance = prompt("Enter NEW BALANCE (this will REPLACE current balance):");
    if (newBalance === null) return;
    
    const newValue = parseFloat(newBalance);
    if (isNaN(newValue) || newValue < 0) {
        alert("Please enter a valid non-negative amount.");
        return;
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex === -1) {
        alert("User not found.");
        return;
    }
    
    const oldBalance = users[userIndex].balance;
    users[userIndex].balance = newValue;
    saveUsers(users);
    
    recordFundLog(userId, newValue - oldBalance, oldBalance, newValue);
    alert(`Balance set to ₵${newValue.toFixed(2)}`);
    loadUsers();
}

function handleDeleteUser(e) {
    const btn = e.currentTarget;
    const userId = btn.getAttribute('data-id');
    
    if (confirm("⚠️ WARNING: This will permanently delete the user and all their data. Are you sure?")) {
        let users = getUsers();
        const filtered = users.filter(u => u.id != userId);
        if (filtered.length === users.length) {
            alert("User not found.");
            return;
        }
        saveUsers(filtered);
        alert("User deleted successfully.");
        loadUsers();
    }
}

function recordFundLog(userId, amountChanged, oldBalance, newBalance) {
    try {
        let logs = JSON.parse(localStorage.getItem('admin_funds_log') || '[]');
        logs.push({
            id: Date.now(),
            userId: userId,
            amountChanged: amountChanged,
            oldBalance: oldBalance,
            newBalance: newBalance,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 500) logs = logs.slice(-500);
        localStorage.setItem('admin_funds_log', JSON.stringify(logs));
    } catch(e) { console.warn("Log save failed", e); }
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUsers);
} else {
    loadUsers();
}