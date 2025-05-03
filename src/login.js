// Function to handle role selection
function selectRole(element) {
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('active');
    });

    element.classList.add('active');
    document.getElementById('roleInput').value = element.getAttribute('data-role');
    const usernameField = document.getElementById('username');

    switch(element.getAttribute('data-role')) {
        case 'student':
            usernameField.placeholder = 'Enter your Student ID';
            break;
        case 'faculty':
            usernameField.placeholder = 'Enter your Faculty ID';
            break;
        case 'warden':
            usernameField.placeholder = 'Enter your Warden ID';
            break;
        case 'security':
            usernameField.placeholder = 'Enter your Security Username';
            break;
        default:
            usernameField.placeholder = 'Enter your username or ID';
    }
}

// Set student as default selected role on page load
window.onload = function() {
    const studentRole = document.querySelector('.role-option[data-role="student"]');
    selectRole(studentRole);
};

document.addEventListener("DOMContentLoaded", function () {
    const registerLink = document.querySelector(".register-link a");

    registerLink.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "signup.html";
    });
});

// Modified login form submission with proper redirects
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const role = document.getElementById('roleInput').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!role) {
        alert('Please select a role');
        return;
    }

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, password })
    })
    .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
            // Store the username in localStorage
            localStorage.setItem('username', username);
            
            alert(data.message);
            // Define role to page mappings
            const rolePages = {
                'student': 'student.html',
                'faculty': 'faculty.html',
                'warden': 'warden.html',
                'security': 'security.html' // Make sure this matches your security dashboard filename
            };
            window.location.href = rolePages[role];
        } else {
            alert(data.message || 'Invalid credentials, please try again');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during login');
    });
});

// Forgot Password functionality
document.addEventListener("DOMContentLoaded", function () {
    // Forgot password modal handling
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const forgotPasswordModal = document.getElementById("forgotPasswordModal");
    const otpModal = document.getElementById("otpModal");
    const closeButtons = document.querySelectorAll(".close-modal");

    // Open forgot password modal only when the link is clicked
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", function (event) {
            event.preventDefault();
            forgotPasswordModal.style.display = "block";
        });
    }

    // Close modals when close button is clicked
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            forgotPasswordModal.style.display = "none";
            otpModal.style.display = "none";
        });
    });

    // Close modals when clicking outside the modal content
    window.addEventListener("click", function(event) {
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.style.display = "none";
        }
        if (event.target === otpModal) {
            otpModal.style.display = "none";
        }
    });

    // Forgot password form submission
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function(event) {
            event.preventDefault();
            
            const username = document.getElementById("forgotUsername").value;
            const role = document.getElementById("forgotRole").value;
            
            fetch('http://localhost:3000/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role })
            })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    // Show OTP modal
                    forgotPasswordModal.style.display = "none";
                    otpModal.style.display = "block";
                    
                    // Store the username and role for the OTP verification
                    document.getElementById('otpForm').dataset.username = username;
                    document.getElementById('otpForm').dataset.role = role;
                } else {
                    alert(data.message || 'Error sending OTP');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while sending OTP');
            });
        });
    }

    // OTP form submission
    const otpForm = document.getElementById("otpForm");
    if (otpForm) {
        otpForm.addEventListener("submit", function(event) {
            event.preventDefault();
            
            const otp = document.getElementById("otp").value;
            const newPassword = document.getElementById("newPassword").value;
            const username = this.dataset.username;
            const role = this.dataset.role;
            
            fetch('http://localhost:3000/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role, otp, newPassword })
            })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || 'Password reset successfully!');
                    otpModal.style.display = "none";
                } else {
                    alert(data.message || 'Error resetting password');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while resetting password');
            });
        });
    }
});