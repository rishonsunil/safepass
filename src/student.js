function showNewRequestModal() {
    document.getElementById('newRequestModal').classList.add('show');
    

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateOut').value = today;
    document.getElementById('expectedDate').value = today;

    // Set min attributes to prevent past dates
    document.getElementById('dateOut').setAttribute('min', today);
    document.getElementById('expectedDate').setAttribute('min', today);

    // Set the minimum time to current time for both timeOut and expectedTime
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    document.getElementById('timeOut').value = currentTime;
    document.getElementById('expectedTime').value = currentTime;

    document.getElementById('timeOut').setAttribute('min', currentTime);
    document.getElementById('expectedTime').setAttribute('min', currentTime);

    // Add event listeners for date changes
    document.getElementById('dateOut').addEventListener('change', handleDateChange);
    document.getElementById('expectedDate').addEventListener('change', handleDateChange);
    
    document.getElementById('expectedDate').addEventListener('change', validateReturnDate);
    // Initial validation
    handleDateChange();
}

function handleDateChange() {
    const dateOut = document.getElementById('dateOut').value;
    const expectedDate = document.getElementById('expectedDate').value;

    if (dateOut === expectedDate) {
        // Same date - enforce time constraints
        document.getElementById('timeOut').addEventListener('change', validateSameDayTimes);
        document.getElementById('expectedTime').addEventListener('change', validateSameDayTimes);
        validateSameDayTimes(); // Validate immediately
    } else {
        // Different dates - remove time constraints
        document.getElementById('timeOut').removeEventListener('change', validateSameDayTimes);
        document.getElementById('expectedTime').removeEventListener('change', validateSameDayTimes);
        
        // Reset min time attributes
        document.getElementById('timeOut').removeAttribute('min');
        document.getElementById('expectedTime').removeAttribute('min');
    }
}

function validateSameDayTimes() {
    const timeOut = document.getElementById('timeOut').value;
    const expectedTime = document.getElementById('expectedTime').value;

    if (!timeOut || !expectedTime) return true;

    // Convert times to minutes since midnight for comparison
    const [outHours, outMins] = timeOut.split(':').map(Number);
    const [returnHours, returnMins] = expectedTime.split(':').map(Number);
    
    const outTotalMinutes = outHours * 60 + outMins;
    const returnTotalMinutes = returnHours * 60 + returnMins;

    if (outTotalMinutes >= returnTotalMinutes) {
        alert('For same-day passes, the departure time must be earlier than the return time');
        // Reset to current time
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        document.getElementById('timeOut').value = currentTime;
        document.getElementById('expectedTime').value = currentTime;
        return false;
    }

    return true;
}
function validateReturnDate() {
    const dateOut = document.getElementById('dateOut').value;
    const expectedDate = document.getElementById('expectedDate').value;
    
    if (dateOut && expectedDate) {
        const outDate = new Date(dateOut);
        const returnDate = new Date(expectedDate);
        
        if (returnDate < outDate) {
            alert('Return date must be on or after the departure date');
            // Reset to same as departure date
            document.getElementById('expectedDate').value = dateOut;
            return false;
        }
    }
    return true;
}

function closeModal() {
    // Remove all event listeners
    document.getElementById('dateOut').removeEventListener('change', handleDateChange);
    document.getElementById('expectedDate').removeEventListener('change', handleDateChange);
    document.getElementById('timeOut').removeEventListener('change', validateSameDayTimes);
    document.getElementById('expectedTime').removeEventListener('change', validateSameDayTimes);
    
    document.getElementById('newRequestModal').classList.remove('show');
}

function closeEPassModal() {
    document.getElementById('ePassModal').classList.remove('show');
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(timeString) {
    return timeString ? new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

function filterRequests(status) {
    const tableBody = document.querySelector('#recent-requests tbody');
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        row.style.display = '';
    });
    
    if (status) {
        rows.forEach(row => {
            const rowStatus = row.querySelector('.badge').textContent;
            if (rowStatus !== status) {
                row.style.display = 'none';
            }
        });
        
        document.querySelector('.card-title').textContent = 
            status === 'Approved' ? 'Approved Passes' : 'Rejected Requests';
    } else {
        document.querySelector('.card-title').textContent = 'Recent Movement Requests';
    }
    
    document.querySelectorAll('.sidebar-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    if (status === 'Approved') {
        document.querySelector('.sidebar-menu a[onclick*="Approved"]').classList.add('active');
    } else if (status === 'Rejected') {
        document.querySelector('.sidebar-menu a[onclick*="Rejected"]').classList.add('active');
    } else {
        document.querySelector('.sidebar-menu a[onclick*="Dashboard"]').classList.add('active');
    }
}

async function loadStudentRequests() {
    try {
        let requests = [];
        const username = localStorage.getItem('username');
        
        try {
            const response = await fetch('http://localhost:3000/api/student/requests', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'username': username
                }
            });
            
            const result = await response.json();
            if (result.success) {
                requests = result.requests;
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            requests = [];
        }

        const tbody = document.querySelector('#recent-requests tbody');
        tbody.innerHTML = '';

        document.getElementById('totalRequests').textContent = requests.length;
        document.getElementById('approvedRequests').textContent = requests.filter(r => r.status === 'Approved').length;
        document.getElementById('pendingRequests').textContent = requests.filter(r => r.status === 'Pending').length;
        document.getElementById('rejectedRequests').textContent = requests.filter(r => r.status === 'Rejected').length;

        if (requests.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 20px;">
                    <i class="fas fa-info-circle" style="font-size: 24px; color: var(--primary); margin-bottom: 10px;"></i>
                    <p>No movement requests found. Click "New Request" to create your first pass.</p>
                </td>
            `;
            tbody.appendChild(emptyRow);
        } else {
            requests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#SP${request._id.toString().substring(18, 24)}</td>
                    <td>${formatDate(request.dateOut)}</td>
                    <td>${request.purpose}</td>
                    <td>${request.destination}</td>
                    <td>${formatTime(request.timeOut)}</td>
                    <td>${formatDate(request.expectedReturnDate)} ${formatTime(request.expectedReturnTime)}</td>
                    <td><span class="badge badge-${request.status.toLowerCase()}" data-status="${request.status}">${request.status}</span></td>
                    <td>
                        ${request.status === 'Approved' ? 
                            `<button class="btn btn-sm btn-success" onclick="viewPass('${request._id}')">Show e-Pass</button>` : 
                            ''}
                    </td>
                `;
                row.dataset.request = JSON.stringify(request);
                tbody.appendChild(row);
            });
        }

        const activePassesBody = document.getElementById('active-passes-body');
        activePassesBody.innerHTML = '';

        const activePasses = requests.filter(r => r.status === 'Approved' && 
            new Date(r.expectedReturnDate) > new Date());
            
        if (activePasses.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" style="text-align: center; padding: 20px;">
                    <i class="fas fa-info-circle" style="font-size: 24px; color: var(--primary); margin-bottom: 10px;"></i>
                    <p>No active passes found. Submit a request to get started.</p>
                </td>
            `;
            activePassesBody.appendChild(emptyRow);
        } else {
            activePasses.forEach(pass => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#SP${pass._id.toString().substring(18, 24)}</td>
                    <td>${pass.destination}</td>
                    <td>${formatTime(pass.timeOut)}</td>
                    <td>${formatDate(pass.expectedReturnDate)} ${formatTime(pass.expectedReturnTime)}</td>
                    <td><span class="badge badge-active">Active</span></td>
                    <td><button class="btn btn-sm btn-success" onclick="viewPass('${pass._id}')">Show e-Pass</button></td>
                `;
                row.dataset.request = JSON.stringify(pass);
                activePassesBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        alert('Failed to load requests. Please try again.');
    }
}

function viewPass(id) {
    const requestElement = document.querySelector(`#recent-requests tr[data-request*="${id}"]`);
    if (!requestElement) return;
    
    const request = JSON.parse(requestElement.dataset.request);
    
    const passId = `#SP${id.toString().substring(18, 24)}`;
    const ePassModal = document.getElementById('ePassModal');
    const ePassDetails = document.getElementById('ePassDetails');
    
    const contactNumber = request.contactNumber || 
                         document.getElementById('contactNumber')?.value || 
                         'Not provided';
    
    const emergencyContact = request.emergencyContactNumber || 
                           request.contactNumber || 
                           document.getElementById('emergencyContactNumber')?.value || 
                           document.getElementById('contactNumber')?.value || 
                           'Not provided';

    ePassModal.dataset.emergencyContact = emergencyContact;
    
    ePassDetails.innerHTML = `
    <div class="e-pass-container">
        <div class="e-pass-header">
            <h3>SafePass - Digital Movement Pass</h3>
            <h4>Pass ID: ${passId}</h4>
        </div>
        <div class="e-pass-body">
            <div class="e-pass-row">
                <strong>Student Name:</strong> ${request.studentName || document.querySelector('.user-name').textContent || 'Student'}
            </div>
            <div class="e-pass-row">
                <strong>Purpose:</strong> ${request.purpose}
            </div>
            <div class="e-pass-row">
                <strong>Destination:</strong> ${request.destination}
            </div>
            <div class="e-pass-row">
                <strong>Date Out:</strong> ${formatDate(request.dateOut)}
            </div>
            <div class="e-pass-row">
                <strong>Time Out:</strong> ${formatTime(request.timeOut)}
            </div>
            <div class="e-pass-row">
                <strong>Expected Return:</strong> ${formatDate(request.expectedReturnDate)} ${formatTime(request.expectedReturnTime)}
            </div>
            <div class="e-pass-row">
                <strong>Contact Number:</strong> ${contactNumber}
            </div>
            <div class="e-pass-row">
                <strong>Emergency Contact:</strong> ${emergencyContact}
            </div>
            <div class="e-pass-row">
                <strong>Status:</strong> <span class="badge badge-approved">Approved</span>
            </div>
        <!--<div class="e-pass-qr" id="ePassQRCode"></div>
            <div class="e-pass-instructions">
                <p>Scan QR code to verify pass validity.</p>
            </div>-->
        </div>
    </div>
    `;
    
    ePassModal.classList.add('show');
    
    setTimeout(() => {
        const qrContainer = document.getElementById('ePassQRCode');
        qrContainer.innerHTML = '';
        
        const smsBody = `ALERT: Student ${request.studentName} with Pass ${passId} has exited the campus for ${request.purpose} at ${request.destination}.`;
        const smsUri = `sms:${emergencyContact}?body=${encodeURIComponent(smsBody)}`;
        
        new QRCode(qrContainer, { 
            text: smsUri,
            width: 128, 
            height: 128 
        });
    }, 100);
}
// Modified submitRequest function to handle emergency requests
async function submitRequest() {
    const form = document.getElementById('requestForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const isEmergency = document.getElementById('newRequestModal').dataset.isEmergency === "true";
    const dateOut = document.getElementById('dateOut').value;
    const expectedDate = document.getElementById('expectedDate').value;
    const today = new Date().toISOString().split('T')[0];

    // Only apply same-day restriction for non-emergency requests
    if (!isEmergency && dateOut === today) {
        alert('Regular requests must be submitted at least one day in advance. Please use Emergency Request for same-day needs.');
        return;
    }
    
    if (!validateReturnDate()) {
        return;
    }

    // Existing same-day time validation still applies
    if (dateOut === expectedDate && !validateSameDayTimes()) {
        return;
    }

    // Rest of your existing submitRequest code...
    try {
        const contactNumber = document.getElementById('contactNumber').value;
        const emergencyContactNumber = document.getElementById('emergencyContactNumber').value;

        const newRequest = {
            studentName: document.querySelector('.user-name').textContent || "Student",
            purpose: document.getElementById('purpose').value,
            destination: document.getElementById('destination').value,
            dateOut: dateOut,
            timeOut: document.getElementById('timeOut').value,
            expectedReturnDate: expectedDate,
            expectedReturnTime: document.getElementById('expectedTime').value,
            details: document.getElementById('details').value,
            contactNumber: contactNumber,
            emergencyContactNumber: emergencyContactNumber || contactNumber
        };

        const response = await fetch('http://localhost:3000/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRequest)
        });

        const result = await response.json();
        if (result.success) {
            alert(isEmergency ? 'Emergency request submitted successfully!' : 'Request submitted successfully!');
            closeModal();
            form.reset();
            loadStudentRequests();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        alert('Failed to submit request. Please try again.');
    }
}

async function fetchUserDetails() {
    try {
        const username = localStorage.getItem('username');
        if (!username) return;

        const response = await fetch('http://localhost:3000/api/user/details', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'username': username
            }
        });

        const result = await response.json();
        if (result.success) {
            document.querySelector('.user-name').textContent = result.data.fullName;
            document.querySelector('.user-role').textContent = `(${result.data.role})`;
            localStorage.setItem('userFullName', result.data.fullName);
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        document.querySelector('.user-name').textContent = "Student";
        document.querySelector('.user-role').textContent = "(Student)";
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudentRequests();
    fetchUserDetails();
    
    // Set today's date as default in the form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateOut').value = today;
    document.getElementById('expectedDate').value = today;
});
// Show Emergency Request Modal (same as regular but allows today's date)
function showEmergencyRequestModal() {
    document.getElementById('newRequestModal').classList.add('show');
    document.getElementById('newRequestModal').dataset.isEmergency = "true";

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateOut').value = today;
    document.getElementById('expectedDate').value = today;

    // Set min date to today (allows same-day)
    document.getElementById('dateOut').setAttribute('min', today);
    document.getElementById('expectedDate').setAttribute('min', today);

    // Set current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    document.getElementById('timeOut').value = currentTime;
    document.getElementById('expectedTime').value = currentTime;
    document.getElementById('timeOut').setAttribute('min', currentTime);
    document.getElementById('expectedTime').setAttribute('min', currentTime);

    // Add "Emergency" prefix to purpose field
    document.getElementById('purpose').value = "Emergency: ";
    
    // Keep existing event listeners
    document.getElementById('dateOut').addEventListener('change', handleDateChange);
    document.getElementById('expectedDate').addEventListener('change', handleDateChange);
    handleDateChange();
}