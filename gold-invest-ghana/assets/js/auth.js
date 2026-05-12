// assets/js/auth.js
console.log("auth.js loaded");

function generateId() {
    return Date.now().toString();
}

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function registerUser(phone, username, password, inviteCode) {
    const users = getUsers();
    if (users.find(u => u.phone === phone)) {
        return { success: false, message: "Phone already registered" };
    }

    let referredBy = null;
    if (inviteCode) {
        const referrer = findUserByInviteCode(inviteCode);
        if (referrer) referredBy = referrer.id;
    }

    const newUser = {
        id: generateId(),
        phone: phone,
        username: username,
        password: password,
        balance: 0,
        referredBy: referredBy,
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);

    return { success: true, user: newUser };
}

function loginUser(phone, password) {
    const users = getUsers();
    const user = users.find(u => u.phone === phone && u.password === password);
    if (!user) return { success: false, message: "Invalid credentials" };

    sessionStorage.setItem('currentUserId', user.id);
    // Process interest on login
    processDailyInterest();
    return { success: true, user: user };
}

function logoutUser() {
    sessionStorage.removeItem('currentUserId');
    window.location.href = "login.html";
}

// Signup form handler
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('phone').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const inviteCode = document.getElementById('inviteCode').value.trim();

        if (!phone || !username || !password) {
            alert('Please fill in all required fields.');
            return;
        }

        const result = registerUser(phone, username, password, inviteCode);
        if (result.success) {
            // Auto-login after signup and redirect to dashboard
            sessionStorage.setItem('currentUserId', result.user.id);
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message);
        }
    });
}

// Login form handler
if (document.getElementById('animatedLoginForm')) {
    document.getElementById('animatedLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!phone || !password) {
            alert('Please enter phone and password.');
            return;
        }

        const result = loginUser(phone, password);
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert(result.message);
        }
    });
}

document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);