const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/safepass', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

/* =================== USER AUTHENTICATION =================== */

// Define User Schema
const userSchema = new mongoose.Schema({
  role: String,        // "student", "faculty", or "warden"
  fullName: String,
  number: String,
  studentId: String,
  password: String,
  department: String,  
  passoutYear: String
});

const User = mongoose.model('User', userSchema);

// 🔹 Signup API
app.post('/signup', async (req, res) => {
  const { role, fullName, number, studentId, password, department, passoutYear } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      role, 
      fullName, 
      number, 
      studentId, 
      password: hashedPassword,
      department, 
      passoutYear 
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// 🔹 Login API
app.post('/login', async (req, res) => {
  const { role, username, password } = req.body;

  try {
    const user = await User.findOne({ role, studentId: username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', role });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

/* =================== MOVEMENT REQUEST HANDLING =================== */

// Define Movement Request Schema
const requestSchema = new mongoose.Schema({
  studentName: String,
  purpose: String,
  destination: String,
  dateOut: String,
  timeOut: String,
  expectedReturnDate: String,
  expectedReturnTime: String,
  details: String, 
  contactNumber: String,          // added field
  emergencyContactNumber: String, // added field
  status: { type: String, default: "Pending" }
});

const Request = mongoose.model('Request', requestSchema);

// 🔹 API: Submit Movement Request (Student)
// 🔹 API: Submit Movement Request (Student) - KEEP THIS EXISTING CODE UNCHANGED
app.post('/api/requests', async (req, res) => {
  try {
    const { studentName, purpose, destination, dateOut, timeOut, expectedReturnDate, expectedReturnTime, details, contactNumber, emergencyContactNumber } = req.body;

    const newRequest = new Request({
      studentName,
      purpose,
      destination,
      dateOut,
      timeOut,
      expectedReturnDate,
      expectedReturnTime,
      details,
      contactNumber,
      emergencyContactNumber
    });
    await newRequest.save();

    // KEEP THIS EXISTING SMS TO EMERGENCY CONTACT
    const message = `New Request from your ward ${studentName}: Purpose - ${purpose}, Destination - ${destination}. Expected Return: ${expectedReturnDate} at ${expectedReturnTime}.`;
    client.messages.create({
      body: message,
      from: '+13023068465',
      to: emergencyContactNumber
    })
    .then(message => console.log('Submission SMS sent:', message.sid))
    .catch(error => console.error('Error sending submission SMS:', error));

    res.status(201).json({ success: true, message: "Request submitted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving request", error });
  }
});

// 🔹 API: Approve/Reject Request (For Warden & Faculty) - UPDATED VERSION
app.put('/api/requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    // Get the current request first
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Update the status
    const updatedRequest = await Request.findByIdAndUpdate(
      requestId, 
      { status }, 
      { new: true }
    );

    // NEW: Only send approval SMS (not for rejections or duplicate approvals)
    if (status === 'Approved' && request.status !== 'Approved') {
      // Student approval message
      const studentMessage = `SafePass APPROVED: ${request.purpose} to ${request.destination}\n` +
                           `Depart: ${request.dateOut} at ${request.timeOut}\n` +
                           `Return by: ${request.expectedReturnDate} ${request.expectedReturnTime}`;

      // Emergency contact message (different wording)
      const emergencyMessage = `APPROVED: ${request.studentName}'s visit to ${request.destination}\n` +
                             `Purpose: ${request.purpose}\n` +
                             `Returning: ${request.expectedReturnDate} ${request.expectedReturnTime}`;

      // Send to student (if contact number exists)
      if (request.contactNumber) {
        client.messages.create({
          body: studentMessage,
          from: '+13023068465',
          to: request.contactNumber
        })
        .then(msg => console.log(`Approval SMS to student sent: ${msg.sid}`))
        .catch(err => console.error('Student SMS error:', err));
      }

      // Send to emergency contact (if number exists)
      if (request.emergencyContactNumber) {
        client.messages.create({
          body: emergencyMessage,
          from: '+13023068465',
          to: request.emergencyContactNumber
        })
        .then(msg => console.log(`Approval SMS to emergency contact sent: ${msg.sid}`))
        .catch(err => console.error('Emergency contact SMS error:', err));
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Request updated successfully!", 
      updatedRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating request", 
      error 
    });
  }
});


// 🔹 API: Get All Requests (For Warden & Faculty)
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find();
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching requests", error });
  }
});

// 🔹 API: Approve/Reject Request (For Warden & Faculty)
app.put('/api/requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRequest = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!updatedRequest) return res.status(404).json({ success: false, message: "Request not found" });

    res.status(200).json({ success: true, message: "Request updated successfully!", updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating request", error });
  }
});

// Start the Server
app.listen(3000, () => console.log('Server running on port 3000'));

// In server.js, update the /api/user/details endpoint:
app.get('/api/user/details', async (req, res) => {
  try {
      // In a real app, you would verify the JWT token here
      // For this example, we'll just get the user from the request headers
      const username = req.headers['username'];
      if (!username) {
          return res.status(400).json({ success: false, message: 'Username not provided' });
      }

      const user = await User.findOne({ studentId: username });
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({ 
          success: true, 
          data: {
              fullName: user.fullName,
              role: user.role
          }
      });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching user details', error });
  }
});

const twilio = require('twilio');

// Your Twilio credentials
const accountSid = ''; // Replace with your Twilio SID
const authToken = ''; // Replace with your Twilio Auth Token
const client = twilio(accountSid, authToken);



// OTP storage (in production, use a database)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔹 Forgot Password API
app.post('/forgot-password', async (req, res) => {
    const { username, role } = req.body;

    try {
        const user = await User.findOne({ role, studentId: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.number) {
            return res.status(400).json({ message: 'No phone number registered for this user' });
        }

        // Generate OTP
        const otp = generateOTP();
        otpStore.set(username, { otp, expiresAt: Date.now() + 600000 }); // 10 minutes expiry

        // Send OTP via Twilio
        const message = `Your SafePass OTP for password reset is: ${otp}. This OTP is valid for 10 minutes.`;
        
        client.messages.create({
            body: message,
            from: '+13023068465', // Your Twilio number
            to: user.number
        })
        .then(() => {
            res.status(200).json({ message: 'OTP sent to your registered mobile number' });
        })
        .catch(err => {
            console.error('Error sending OTP:', err);
            res.status(500).json({ message: 'Error sending OTP' });
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error processing forgot password request' });
    }
});

// 🔹 Reset Password API
app.post('/reset-password', async (req, res) => {
    const { username, role, otp, newPassword } = req.body;

    try {
        // Verify OTP
        const storedOtp = otpStore.get(username);
        if (!storedOtp || storedOtp.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > storedOtp.expiresAt) {
            otpStore.delete(username);
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Find user and update password
        const user = await User.findOne({ role, studentId: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Clear OTP
        otpStore.delete(username);

        res.status(200).json({ message: 'Password reset successfully!' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});
// 🔹 API: Get Requests for Current Student
app.get('/api/student/requests', async (req, res) => {
  try {
      const username = req.headers['username'];
      if (!username) {
          return res.status(400).json({ success: false, message: "Username not provided" });
      }

      // Find the student's name from the User collection
      const user = await User.findOne({ studentId: username });
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      // Find requests for this student only
      const requests = await Request.find({ studentName: user.fullName });
      res.status(200).json({ success: true, requests });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching requests", error });
  }
});
// Add this new endpoint for student-specific requests
app.get('/api/student/requests', async (req, res) => {
  try {
      const username = req.headers['username'];
      if (!username) {
          return res.status(400).json({ success: false, message: "Username not provided" });
      }

      // Find the student's name from the User collection
      const user = await User.findOne({ studentId: username });
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      // Find requests for this student only
      const requests = await Request.find({ studentName: user.fullName });
      res.status(200).json({ success: true, requests });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching requests", error });
  }
});