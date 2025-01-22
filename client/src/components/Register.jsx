import { useState } from "react"; // Removed unused useEffect
import { useNavigate } from "react-router-dom";
import { createUser } from "../API/Index";

function Register() {
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  const [formData, setFormData] = useState({
    username: "", 
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  
  
  const navigate = useNavigate();

  // Enhanced password validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Enhanced email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(), // Trim whitespace
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
  
    try {
      // Validate all fields are filled
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error("All fields are required");
      }
  
      // Validate email format
      if (!validateEmail(formData.email)) {
        throw new Error("Please enter a valid email address");
      }
  
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }
  
      // Validate password strength
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        throw new Error(passwordError);
      }
  
      // Create new user
      const response = await createUser({
        username: formData.username.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });
      
      
  
      if (!response) {
        throw new Error("Registration failed");
      }
  
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <div className="register-container">
      <h1>Create an Account</h1>
      <form onSubmit={handleSubmit} className="register-form">
      <div className="form-group">
  <label htmlFor="username">Username:</label>
  <input
    type="text"
    id="username"
    name="username"  
    value={formData.username}  
    onChange={handleChange}
    required
    minLength={2}
    maxLength={50}
    disabled={isSubmitting}
  />
</div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-describedby="password-requirements"
          />
          <small id="password-requirements">
            Password must be at least 8 characters long and contain uppercase, lowercase, 
            numbers, and special characters.
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>
      {error && <div className="error-message" role="alert">{error}</div>}
    </div>
  );
}

export default Register;
