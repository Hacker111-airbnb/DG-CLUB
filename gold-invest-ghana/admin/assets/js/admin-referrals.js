function loadReferrals() {
    const users = getUsers();
    const referrerStats = users.map(u => ({
        ...u,
        downlines: users.filter(d => d.referredBy === u.id).length
    })).sort((a, b) => b.downlines - a.downlines);
    const tbody = document.querySelector('#referralsTable tbody');
    tbody.innerHTML = '';
    referrerStats.forEach(user => {
        const row = `<tr>
            <td>${user.username}</td>
            <td>${user.phone}</td>
            <td>${user.downlines}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}
loadReferrals();