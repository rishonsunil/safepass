import { useState } from "react";
import "./Signup.css";

const SignupForm = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    number: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    department: "",
    passoutYear: ""
  });

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!selectedRole) {
      alert("Please select a role.");
      return false;
    }
  
    // Validate phone number (10-digit number)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.number)) {
      alert("Invalid phone number! It must be a 10-digit number.");
      return false;
    }
  
    // **Corrected Password Strength Validation**
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert("Invalid password! Must be at least 8 characters long, with uppercase, lowercase, a number, and a special character.");
      return false;
    }
  
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return false;
    }
  
    return true;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return; // Stop execution if validation fails
    }
  
    const userData = { ...formData, role: selectedRole };
  
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
  
      const data = await response.json();
  
      if (data.message === "User registered successfully!") {
        alert("Registration successful!");
        window.location.href = "login.html";
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    }
  };
  

  return (
    <div className="container">
      <div className="header">
        <h1>SafePass</h1>
        <p>College Movement Management System</p>
      </div>
      <div className="content">
        <h2>Create New Account</h2>
        <div className="role-section">
          <p>Select Your Role</p>
          <div className="role-options">
            {["student", "faculty", "warden", "security"].map((role) => (
              <div
                key={role}
                className={`role-option ${selectedRole === role ? "selected" : ""}`}
                onClick={() => handleRoleSelection(role)}
              >
                <div className="role-icon">{role.charAt(0).toUpperCase()}</div>
                <span className="role-name">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" name="number" onChange={handleChange} required placeholder="Enter 10-digit phone number" />
          </div>
          <div className="form-group">
            <label>Student/Employee ID</label>
            <input type="text" name="studentId" onChange={handleChange} required />
          </div>
            <div className="form-group">
  <label>Department</label>
  <select name="department" onChange={handleChange} required>
    <option value="" disabled selected>Select your department</option>
    <option value="Computer Science">Computer Science</option>
    <option value="Mechanical">Mechanical</option>
    <option value="Electrical">Electrical</option>
    <option value="Civil">Civil</option>
    <option value="Electronics">Electronics</option>
    <option value="Chemical">Chemical</option>
    <option value="Biotechnology">Biotechnology</option>
  </select>
</div>

<div className="form-group">
  <label>Passout Year</label>
  <input 
    type="number" 
    name="passoutYear" 
    onChange={handleChange} 
    placeholder="Enter your expected passout year"
    min="2023" 
    max="2030" 
    required 
  />
</div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" onChange={handleChange} required />
          </div>
          <button type="submit" className="btn">Register</button>
        </form>
      </div>
    </div>
  );
};


export default SignupForm;