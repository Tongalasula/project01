const API_URL = 'http://localhost:3000/api';

// --- Form Submissions ---

document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('instName').value,
        category: document.getElementById('instCat').value,
        contact_person: document.getElementById('contactPerson').value,
        contact_phone: document.getElementById('contactPhone').value
    };

    try {
        const response = await fetch(`${API_URL}/institutions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('Institution Registered Successfully!');
            e.target.reset();
            loadInstitutions(); // Refresh dropdowns
        } else {
            const errData = await response.json();
            alert(`Error: ${errData.error || 'Failed to register institution'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Network error or server is down');
    }
});

document.getElementById('subForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        institution_id: document.getElementById('subInst').value,
        bandwidth: document.getElementById('subBandwidth').value,
        lan_nodes: parseInt(document.getElementById('lanNodes').value),
        pc_count: parseInt(document.getElementById('pcCount').value),
        is_upgrade: parseInt(document.getElementById('isUpgrade').value)
    };

    try {
        const response = await fetch(`${API_URL}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const resData = await response.json();
            alert(`Subscription Setup! Total Installation Cost: KSh ${resData.installation_cost.toLocaleString()}`);
            e.target.reset();
            loadInstitutions(); // Refresh subscription dropdown in payments
        } else {
            const errData = await response.json();
            alert(`Error: ${errData.error || 'Failed to setup subscription'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Network error or server is down');
    }
});

document.getElementById('payForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const subId = document.getElementById('payInst').value;
    if (!subId) {
        alert('Please select a subscription');
        return;
    }

    const data = {
        subscription_id: subId,
        type: document.getElementById('payType').value,
        period: document.getElementById('payPeriod').value,
        amount_paid: parseFloat(document.getElementById('payAmount').value) || 0,
        payment_date: new Date().toISOString().split('T')[0]
    };

    try {
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('Payment Recorded!');
            e.target.reset();
        } else {
            const errData = await response.json();
            alert(`Error: ${errData.error || 'Failed to record payment'}`);
        }
    } catch (err) {
        console.error(err);
        alert('Network error or server is down');
    }
});

// --- Data Loading ---

async function loadInstitutions() {
    try {
        // Load institutions for subscription form
        const instResponse = await fetch(`${API_URL}/institutions`);
        const institutions = await instResponse.json();
        const subSelect = document.getElementById('subInst');
        subSelect.innerHTML = '<option value="">-- Select Institution --</option>';
        institutions.forEach(inst => {
            subSelect.innerHTML += `<option value="${inst.id}">${inst.name}</option>`;
        });

        // Load subscriptions for payment form
        const subResponse = await fetch(`${API_URL}/subscriptions`);
        const subscriptions = await subResponse.json();
        const paySelect = document.getElementById('payInst');
        paySelect.innerHTML = '<option value="">-- Select Active Subscription --</option>';
        subscriptions.forEach(sub => {
            paySelect.innerHTML += `<option value="${sub.id}">${sub.institution_name} (${sub.status})</option>`;
        });
    } catch (err) {
        console.error('Failed to load data:', err);
    }
}

// --- Reports ---

async function loadReport(type) {
    const container = document.getElementById('reportContainer');
    container.innerHTML = '<p style="text-align: center;">Loading...</p>';

    try {
        const response = await fetch(`${API_URL}/reports/${type}`);
        const data = await response.json();

        if (data.length === 0) {
            container.innerHTML = '<p style="text-align: center;">No data found</p>';
            return;
        }

        let html = '<table><thead><tr>';

        // Dynamic Headers
        const headers = Object.keys(data[0]);
        headers.forEach(h => html += `<th>${h.replace('_', ' ').toUpperCase()}</th>`);
        html += '</tr></thead><tbody>';

        // Dynamic Rows
        data.forEach(row => {
            html += '<tr>';
            headers.forEach(h => {
                let val = row[h];
                if (typeof val === 'number') val = val.toLocaleString();
                html += `<td>${val || '-'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

// Initial Load
loadInstitutions();
