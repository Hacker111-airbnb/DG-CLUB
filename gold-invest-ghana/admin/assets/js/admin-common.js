// Check admin session
if (!localStorage.getItem('admin_session') && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
}
document.getElementById('adminLogout')?.addEventListener('click', () => {
    localStorage.removeItem('admin_session');
    window.location.href = 'login.html';
});