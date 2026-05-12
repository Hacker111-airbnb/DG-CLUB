// ==================== ADMIN DEPOSITS ====================
console.log("admin-deposits.js loaded");

function loadPending() {
    const deposits = getDeposits();
    const pending = deposits.filter(d => d.status === 'pending');
    const tbody = document.querySelector('#pendingTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No pending deposits</td></tr>';
        return;
    }
    
    pending.forEach(dep => {
        const user = getUserById(dep.userId);
        const userName = user?.username || user?.phone || 'Unknown';
        const screenshotHtml = dep.screenshot ? 
            `<a href="${dep.screenshot}" target="_blank" class="btn btn-sm btn-info">View</a>` : 'No image';
        
        const row = `<tr>
            <td>${userName}</td>
            <td>₵${dep.amount}</td>
            <td>${dep.accountName || 'N/A'}</td>
            <td>${screenshotHtml}</td>
            <td><button class="btn btn-success btn-sm approve" data-id="${dep.id}">Approve</button>
                  <button class="btn btn-danger btn-sm reject" data-id="${dep.id}">Reject</button></td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    
    document.querySelectorAll('.approve').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Approve deposit?')) {
                approveDeposit(id);
                loadPending();
                if (typeof updateDashboardStats === 'function') updateDashboardStats();
            }
        });
    });
    
    document.querySelectorAll('.reject').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            if (confirm('Reject deposit?')) {
                rejectDeposit(id);
                loadPending();
            }
        });
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadPending);
else loadPending();