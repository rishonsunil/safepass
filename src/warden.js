// Toggle sidebar on mobile
document.getElementById('menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

// Responsive behavior
function adjustLayout() {
    const width = window.innerWidth;
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    if (width <= 768) {
        sidebar.classList.remove('active');
        mainContent.style.marginLeft = '0';
    } else {
        sidebar.classList.add('active');
        mainContent.style.marginLeft = '250px';
    }
}

// Initial call and resize listener
window.addEventListener('resize', adjustLayout);

// Calendar date selection
document.querySelectorAll('.date').forEach(date => {
    date.addEventListener('click', function() {
        document.querySelectorAll('.date').forEach(d => d.classList.remove('active'));
        this.classList.add('active');
    });
});

// Modal functionality
const modal = document.getElementById('detailsModal');
const span = document.getElementsByClassName("close")[0];

function showDetailsModal(request) {
    const content = document.getElementById('modalDetailsContent');
    content.innerHTML = `
        <p><strong>Student Name:</strong> ${request.studentName}</p>
        <p><strong>Purpose:</strong> ${request.purpose}</p>
        <p><strong>Destination:</strong> ${request.destination}</p>
        <p><strong>Departure Date:</strong> ${new Date(request.dateOut).toLocaleDateString()}</p>
        <p><strong>Departure Time:</strong> ${request.timeOut}</p>
        <p><strong>Expected Return Date:</strong> ${new Date(request.expectedReturnDate).toLocaleDateString()}</p>
        <p><strong>Expected Return Time:</strong> ${request.expectedReturnTime}</p>
        <p><strong>Status:</strong> <span class="badge ${request.status === 'Approved' ? 'badge-approved' : 
                                      request.status === 'Rejected' ? 'badge-rejected' : 
                                      'badge-pending'}">${request.status}</span></p>
    `;
    modal.style.display = "block";
}

// Close modal
span.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
}

async function loadRequests() {
    try {
        const response = await fetch('http://localhost:3000/api/requests');
        const data = await response.json();

        if (data.success) {
            const requestTableBody = document.querySelector('.data-table tbody');
            requestTableBody.innerHTML = ''; // Clear existing data

            // Sort requests: Pending first (newest first), then others (newest first)
            const sortedRequests = data.requests.sort((a, b) => {
                // Pending requests come first
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                
                // For same status, sort by date (newest first)
                return new Date(b.dateOut) - new Date(a.dateOut);
            });

            sortedRequests.forEach(request => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', request._id);
                row.setAttribute('data-details', JSON.stringify(request));
                
                // Format dates for display
                const formattedDateOut = new Date(request.dateOut).toLocaleDateString();
                const formattedReturnDate = request.expectedReturnDate ? 
                    new Date(request.expectedReturnDate).toLocaleDateString() : 'N/A';

                // Determine action buttons based on status
                let actionButtons = '';
                if (request.status === 'Pending') {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <button class="action-btn btn-approve">Approve</button>
                            <button class="action-btn btn-reject">Reject</button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <span class="processed-status">${request.status}</span>
                        </div>
                    `;
                }

                row.innerHTML = `
                    <td>${request.studentName}</td>
                    <td>${request.purpose}</td>
                    <td>${request.destination}</td>
                    <td>${formattedDateOut}</td>
                    <td><span class="badge ${request.status === 'Approved' ? 'badge-approved' : 
                                          request.status === 'Rejected' ? 'badge-rejected' : 
                                          'badge-pending'}">${request.status}</span></td>
                    <td>${actionButtons}</td>
                `;
                requestTableBody.appendChild(row);
            });

            // Add event listeners after loading requests
            addTableEventListeners();
        } else {
            console.error("Failed to fetch requests.");
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
    }
}

function addTableEventListeners() {
    // View button functionality
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestData = JSON.parse(row.getAttribute('data-details'));
            showDetailsModal(requestData);
        });
    });

    // Approve button functionality
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Approved' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-approved';
                    statusCell.textContent = 'Approved';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Approved</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Approved'});
                    });
                } else {
                    console.error("Failed to approve request");
                }
            } catch (error) {
                console.error("Error approving request:", error);
            }
        });
    });

    // Reject button functionality
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Rejected' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-rejected';
                    statusCell.textContent = 'Rejected';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Rejected</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Rejected'});
                    });
                } else {
                    console.error("Failed to reject request");
                }
            } catch (error) {
                console.error("Error rejecting request:", error);
            }
        });
    });
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
            document.querySelector('.user-role').textContent = result.data.role;
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

// Logout functionality
document.getElementById('logoutButton')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    adjustLayout(); // Set initial layout
    loadRequests();
    fetchUserDetails();
});
// [Previous code remains the same until loadRequests function]

async function loadRequests() {
    try {
        const response = await fetch('http://localhost:3000/api/requests');
        const data = await response.json();

        if (data.success) {
            const requestTableBody = document.querySelector('.data-table tbody');
            requestTableBody.innerHTML = '';

            // Update stats counters
            updateRequestStats(data.requests);

            // Sort and display requests
            const sortedRequests = data.requests.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return new Date(b.dateOut) - new Date(a.dateOut);
            });

            sortedRequests.forEach(request => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', request._id);
                row.setAttribute('data-details', JSON.stringify(request));
                
                let actionButtons = '';
                if (request.status === 'Pending') {
                    actionButtons = `
                        <button class="action-btn btn-view">View</button>
                        <button class="action-btn btn-approve">Approve</button>
                        <button class="action-btn btn-reject">Reject</button>
                    `;
                } else {
                    actionButtons = `<span>Processed</span>`;
                }

                row.innerHTML = `
                    <td>${request.studentName}</td>
                    <td>${request.purpose}</td>
                    <td>${request.destination}</td>
                    <td>${new Date(request.dateOut).toLocaleDateString()}</td>
                    <td><span class="badge ${request.status === 'Approved' ? 'badge-approved' : 
                                          request.status === 'Rejected' ? 'badge-rejected' : 
                                          'badge-pending'}">${request.status}</span></td>
                    <td>${actionButtons}</td>
                `;
                requestTableBody.appendChild(row);
            });

            addTableEventListeners();
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
    }
}

function updateRequestStats(requests) {
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const rejected = requests.filter(r => r.status === 'Rejected').length;
    const pending = requests.filter(r => r.status === 'Pending').length;

    document.getElementById('totalRequests').textContent = total;
    document.getElementById('approvedRequests').textContent = approved;
    document.getElementById('rejectedRequests').textContent = rejected;
    document.getElementById('pendingRequests').textContent = pending;
}

// [Rest of the existing code remains the same]
// Add these new functions for calendar functionality
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;

function generateCalendar(month, year, requests) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('calendar-month').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let calendarHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-day"></div>`;
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasMovement = requests.some(req => 
            req.dateOut === dateStr || req.expectedReturnDate === dateStr
        );
        
        const isActive = selectedDate === dateStr;
        
        calendarHTML += `
            <div class="calendar-day ${hasMovement ? 'has-movement' : ''} ${isActive ? 'active' : ''}" 
                 data-date="${dateStr}">
                ${day}
            </div>
        `;
    }
    
    document.getElementById('calendar-days').innerHTML = calendarHTML;
    
    // Add event listeners to days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            if (date) {
                selectedDate = date;
                showMovementsForDate(date, requests);
                generateCalendar(month, year, requests); // Regenerate to update active state
            }
        });
    });
}

function showMovementsForDate(date, requests) {
    const formattedDate = new Date(date).toLocaleDateString();
    document.getElementById('selected-date').textContent = formattedDate;
    
    const eventsContainer = document.getElementById('events-container');
    
    const movements = requests.filter(req => 
        req.dateOut === date || req.expectedReturnDate === date
    );
    
    if (movements.length === 0) {
        eventsContainer.innerHTML = '<p>No movements for selected date</p>';
        return;
    }
    
    let eventsHTML = '';
    
    movements.forEach(movement => {
        const isDeparture = movement.dateOut === date;
        const isReturn = movement.expectedReturnDate === date;
        
        eventsHTML += `
            <div class="event-item">
                <p><strong>Student:</strong> ${movement.studentName}</p>
                <p><strong>${isDeparture ? 'Departing' : 'Returning'}:</strong> 
                   ${isDeparture ? movement.timeOut : movement.expectedReturnTime}</p>
                <p><strong>Destination:</strong> ${movement.destination}</p>
                <p><strong>Purpose:</strong> ${movement.purpose}</p>
                <p><strong>Status:</strong> <span class="badge ${movement.status === 'Approved' ? 'badge-approved' : 
                                          movement.status === 'Rejected' ? 'badge-rejected' : 
                                          'badge-pending'}">${movement.status}</span></p>
            </div>
        `;
    });
    
    eventsContainer.innerHTML = eventsHTML;
}

// Update loadRequests to include calendar generation
async function loadRequests() {
    try {
        const response = await fetch('http://localhost:3000/api/requests');
        const data = await response.json();

        if (data.success) {
            // Update stats and table as before
            updateRequestStats(data.requests);
            
            // Generate calendar with the requests data
            generateCalendar(currentMonth, currentYear, data.requests);
            
            // Rest of your existing table generation code...
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
    }
}

// Add month navigation functionality
document.querySelector('.btn-prev')?.addEventListener('click', async () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    const response = await fetch('http://localhost:3000/api/requests');
    const data = await response.json();
    generateCalendar(currentMonth, currentYear, data.requests);
});

document.querySelector('.btn-next')?.addEventListener('click', async () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    const response = await fetch('http://localhost:3000/api/requests');
    const data = await response.json();
    generateCalendar(currentMonth, currentYear, data.requests);
});

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    adjustLayout();
    loadRequests();
    fetchUserDetails();
});
// [Previous code remains the same until the loadRequests function]

async function loadRequests() {
    try {
        const response = await fetch('http://localhost:3000/api/requests');
        const data = await response.json();

        if (data.success) {
            const requestTableBody = document.querySelector('.data-table tbody');
            requestTableBody.innerHTML = '';

            // Update stats counters
            updateRequestStats(data.requests);
            
            // Generate calendar with the requests data
            generateCalendar(currentMonth, currentYear, data.requests);

            // Sort requests: Pending first (newest first), then others (newest first)
            const sortedRequests = data.requests.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return new Date(b.dateOut) - new Date(a.dateOut);
            });

            sortedRequests.forEach(request => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', request._id);
                row.setAttribute('data-details', JSON.stringify(request));
                
                // Determine action buttons based on status
                let actionButtons = '';
                if (request.status === 'Pending') {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <button class="action-btn btn-approve">Approve</button>
                            <button class="action-btn btn-reject">Reject</button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <span class="processed-status">${request.status}</span>
                        </div>
                    `;
                }

                row.innerHTML = `
                    <td>${request.studentName}</td>
                    <td>${request.purpose}</td>
                    <td>${request.destination}</td>
                    <td>${new Date(request.dateOut).toLocaleDateString()}</td>
                    <td><span class="badge ${request.status === 'Approved' ? 'badge-approved' : 
                                          request.status === 'Rejected' ? 'badge-rejected' : 
                                          'badge-pending'}">${request.status}</span></td>
                    <td>${actionButtons}</td>
                `;
                requestTableBody.appendChild(row);
            });

            // Add event listeners after loading requests
            addTableEventListeners();
        } else {
            console.error("Failed to fetch requests.");
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
    }
}

function addTableEventListeners() {
    // View button functionality
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestData = JSON.parse(row.getAttribute('data-details'));
            showDetailsModal(requestData);
        });
    });

    // Approve button functionality
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Approved' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-approved';
                    statusCell.textContent = 'Approved';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Approved</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Approved'});
                    });
                    
                    // Reload requests to update stats and calendar
                    loadRequests();
                } else {
                    console.error("Failed to approve request");
                }
            } catch (error) {
                console.error("Error approving request:", error);
            }
        });
    });

    // Reject button functionality
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Rejected' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-rejected';
                    statusCell.textContent = 'Rejected';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Rejected</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Rejected'});
                    });
                    
                    // Reload requests to update stats and calendar
                    loadRequests();
                } else {
                    console.error("Failed to reject request");
                }
            } catch (error) {
                console.error("Error rejecting request:", error);
            }
        });
    });
}

// [Previous code remains the same until the loadRequests function]

async function loadRequests() {
    try {
        const response = await fetch('http://localhost:3000/api/requests');
        const data = await response.json();

        if (data.success) {
            const requestTableBody = document.querySelector('.data-table tbody');
            requestTableBody.innerHTML = '';

            // Update stats counters
            updateRequestStats(data.requests);
            
            // Generate calendar with the requests data
            generateCalendar(currentMonth, currentYear, data.requests);

            // Sort requests: Pending first (newest first), then others (newest first)
            const sortedRequests = data.requests.sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return new Date(b.dateOut) - new Date(a.dateOut);
            });

            sortedRequests.forEach(request => {
                const row = document.createElement('tr');
                row.setAttribute('data-id', request._id);
                row.setAttribute('data-details', JSON.stringify(request));
                
                // Determine action buttons based on status
                let actionButtons = '';
                if (request.status === 'Pending') {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <button class="action-btn btn-approve">Approve</button>
                            <button class="action-btn btn-reject">Reject</button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="action-btn btn-view">View</button>
                            <span class="processed-status">${request.status}</span>
                        </div>
                    `;
                }

                row.innerHTML = `
                    <td>${request.studentName}</td>
                    <td>${request.purpose}</td>
                    <td>${request.destination}</td>
                    <td>${new Date(request.dateOut).toLocaleDateString()}</td>
                    <td><span class="badge ${request.status === 'Approved' ? 'badge-approved' : 
                                          request.status === 'Rejected' ? 'badge-rejected' : 
                                          'badge-pending'}">${request.status}</span></td>
                    <td>${actionButtons}</td>
                `;
                requestTableBody.appendChild(row);
            });

            // Add event listeners after loading requests
            addTableEventListeners();
        } else {
            console.error("Failed to fetch requests.");
        }
    } catch (error) {
        console.error("Error fetching requests:", error);
    }
}

function addTableEventListeners() {
    // View button functionality
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestData = JSON.parse(row.getAttribute('data-details'));
            showDetailsModal(requestData);
        });
    });

    // Approve button functionality
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Approved' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-approved';
                    statusCell.textContent = 'Approved';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Approved</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Approved'});
                    });
                    
                    // Reload requests to update stats and calendar
                    loadRequests();
                } else {
                    console.error("Failed to approve request");
                }
            } catch (error) {
                console.error("Error approving request:", error);
            }
        });
    });

    // Reject button functionality
    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', async function() {
            const row = this.closest('tr');
            const requestId = row.getAttribute('data-id');
            const statusCell = row.querySelector('.badge');
            const actionsCell = row.querySelector('.action-buttons');

            try {
                const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Rejected' })
                });

                if (response.ok) {
                    statusCell.className = 'badge badge-rejected';
                    statusCell.textContent = 'Rejected';
                    actionsCell.innerHTML = `
                        <button class="action-btn btn-view">View</button>
                        <span class="processed-status">Rejected</span>
                    `;
                    // Reattach view button listener
                    actionsCell.querySelector('.btn-view').addEventListener('click', function() {
                        const requestData = JSON.parse(row.getAttribute('data-details'));
                        showDetailsModal({...requestData, status: 'Rejected'});
                    });
                    
                    // Reload requests to update stats and calendar
                    loadRequests();
                } else {
                    console.error("Failed to reject request");
                }
            } catch (error) {
                console.error("Error rejecting request:", error);
            }
        });
    });
}

// [Rest of the code remains the same - calendar functions, stats functions, etc.]

// [Rest of the code remains the same - calendar functions, stats functions, etc.]