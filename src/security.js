function closeEPassModal() {
    document.getElementById('ePassModal').classList.remove('show');
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format time for display
function formatTime(timeString) {
    return timeString ? new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}

// Filter requests by status
function filterRequests(status) {
    const tableBody = document.querySelector('#recent-requests tbody');
    const rows = tableBody.querySelectorAll('tr');
    
    // Show all rows first
    rows.forEach(row => {
        row.style.display = '';
    });
    
    // If filtering for a specific status, hide non-matching rows
    if (status) {
        rows.forEach(row => {
            const rowStatus = row.querySelector('.badge').textContent;
            if (rowStatus !== status) {
                row.style.display = 'none';
            }
        });
        
        // Update the card title to reflect the filter
        document.querySelector('.card-title').textContent = 
            status === 'Approved' ? 'Approved Passes' : 'Rejected Requests';
    } else {
        // If no status provided, show all (Dashboard view)
        document.querySelector('.card-title').textContent = 'Recent Movement Requests';
    }
    
    // Update active menu item
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
        
        try {
            const response = await fetch('http://localhost:3000/api/requests');
            const result = await response.json();
            if (result.success) {
                requests = result.requests;
            }
        } catch (error) {
            console.warn('Using mock data due to API error:', error);
            requests = [
                {
                    _id: "6457f3a1bcdef01234567890",
                    studentName: document.querySelector('.user-name').textContent || "Student",
                    dateOut: "2025-03-31",
                    timeOut: "14:30",
                    expectedReturnDate: "2025-03-31",
                    expectedReturnTime: "17:00",
                    status: "Approved",
                    createdAt: "2025-03-30T12:00:00.000Z"
                },
                {
                    _id: "6457f3a1bcdef01234567891",
                    studentName: document.querySelector('.user-name').textContent || "Student",
                    dateOut: "2025-04-01",
                    timeOut: "10:00",
                    expectedReturnDate: "2025-04-01",
                    expectedReturnTime: "15:00",
                    status: "Pending",
                    createdAt: "2025-03-30T14:00:00.000Z"
                }
            ];
        }

        const tbody = document.querySelector('#recent-requests tbody');
        tbody.innerHTML = '';

        // Update stats counters
        document.getElementById('totalRequests').textContent = requests.length;
        document.getElementById('approvedRequests').textContent = requests.filter(r => r.status === 'Approved').length;
        document.getElementById('pendingRequests').textContent = requests.filter(r => r.status === 'Pending').length;
        document.getElementById('rejectedRequests').textContent = requests.filter(r => r.status === 'Rejected').length;

        // Populate table
        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#SP${request._id.toString().substring(18, 24)}</td>
                <td>${formatDate(request.dateOut)}</td>
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

        // Update active passes
        const activePasses = requests.filter(r => r.status === 'Approved' && 
            new Date(r.expectedReturnDate) > new Date());
        const activePassesBody = document.getElementById('active-passes-body');
        activePassesBody.innerHTML = '';

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
    } catch (error) {
        console.error('Error loading requests:', error);
        alert('Failed to load requests. Please try again.');
    }
}

// View Pass Function
// ... (keep all previous functions until viewPass)

// View Pass Function
function viewPass(id) {
    const requestElement = document.querySelector(`#recent-requests tr[data-request*="${id}"]`);
    if (!requestElement) return;
    
    const request = JSON.parse(requestElement.dataset.request);
    
    const passId = `#SP${id.toString().substring(18, 24)}`;
    const ePassModal = document.getElementById('ePassModal');
    const ePassDetails = document.getElementById('ePassDetails');
    
    // Calculate if the pass is expired (2 hours after Time Out)
    const timeOutDateTime = new Date(`${request.dateOut}T${request.timeOut}`);
    const expiryDateTime = new Date(timeOutDateTime.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
    const now = new Date();
    const isExpired = now > expiryDateTime;
    
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
                <strong>Date Out:</strong> ${formatDate(request.dateOut)}
            </div>
            <div class="e-pass-row">
                <strong>Time Out:</strong> ${formatTime(request.timeOut)}
            </div>
            <div class="e-pass-row">
                <strong>QR Code Expires At:</strong> ${formatTime(expiryDateTime.toTimeString().split(' ')[0])} (2 hours after Time Out)
            </div>
            <div class="e-pass-row">
                <strong>Expected Return:</strong> ${formatDate(request.expectedReturnDate)} ${formatTime(request.expectedReturnTime)}
            </div>
            <div class="e-pass-row">
                <strong>Status:</strong> <span class="badge badge-approved">Approved</span>
            </div>
            <div class="e-pass-qr" id="ePassQRCode">
                ${isExpired ? '<div class="qr-expired">QR Code Expired</div>' : ''}
            </div>
            <div class="e-pass-instructions">
                ${isExpired ? 
                    '<p class="text-danger">This pass QR code has expired (valid for 2 hours after Time Out)</p>' : 
                    '<p>Scan QR code to verify pass validity.</p>'}
            </div>
        </div>
    </div>
    `;
    
    ePassModal.classList.add('show');
    
    // Only generate QR code if not expired
    if (!isExpired) {
        setTimeout(() => {
            const qrContainer = document.getElementById('ePassQRCode');
            qrContainer.innerHTML = '';
            
            const smsBody = `ALERT: Student ${request.studentName} with Pass ${passId} has exited the campus for ${request.purpose} at ${request.destination}.`;
            const smsUri = `sms:${request.emergencyContactNumber || request.contactNumber || ''}?body=${encodeURIComponent(smsBody)}`;
            
            new QRCode(qrContainer, { 
                text: smsUri,
                width: 128, 
                height: 128 
            });
        }, 100);
    }
}

// ... (keep all remaining functions)

// Fetch user details
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

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStudentRequests();
    fetchUserDetails();
});