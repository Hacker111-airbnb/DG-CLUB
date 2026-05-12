// ==================== PAYMENT HANDLER ====================
console.log("payment.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const planAmount = urlParams.get('amount');
const planType = urlParams.get('plan');

if (planAmount) {
    document.getElementById('amountDisplay').innerText = `₵${planAmount}`;
    document.getElementById('depositAmount').value = planAmount;
}

let selectedNetwork = null;
document.querySelectorAll('.network-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.network-btn').forEach(b => b.classList.remove('btn-dark', 'active'));
        btn.classList.add('btn-dark', 'active');
        selectedNetwork = btn.getAttribute('data-network');
        document.getElementById('paymentDetails').classList.remove('d-none');
        document.getElementById('selectedNetwork').innerText = selectedNetwork;
    });
});

document.getElementById('paymentProofForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const accountNumber = document.getElementById('accountNumber').value.trim();
    const accountName = document.getElementById('accountName').value.trim();
    const screenshotFile = document.getElementById('screenshot').files[0];
    
    if (!amount || amount <= 0) return alert("Valid amount required");
    if (!selectedNetwork) return alert("Select network");
    if (!accountNumber || !accountName) return alert("Fill account details");
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Session expired. Please login again.");
        window.location.href = "login.html";
        return;
    }
    
    const screenshotData = screenshotFile ? await readFileAsBase64(screenshotFile) : null;
    
    const deposit = {
        id: Date.now(),
        userId: currentUser.id,
        amount: amount,
        network: selectedNetwork,
        accountNumber: accountNumber,
        accountName: accountName,
        screenshot: screenshotData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        planType: planType || null
    };
    
    const deposits = getDeposits();
    deposits.push(deposit);
    saveDeposits(deposits);
    
    alert(`✅ Deposit request of ₵${amount} submitted!\nAwaiting admin approval.`);
    window.location.href = "dashboard.html";
});

function readFileAsBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}