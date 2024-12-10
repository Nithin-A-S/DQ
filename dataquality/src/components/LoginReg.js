import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../context/UserContext'; // Import the context
import "./style/LoginReg.css"

const LoginRegister = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [userCredentials, setUserCredentials] = useState({});
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  const { login } = useUser(); // Access the login function from context

  useEffect(() => {
    const fetchUsers = () => {
      fetch("http://127.0.0.1:5000/read-users")
        .then((response) => response.json())
        .then((data) => {
          const credentials = {};
          data.data.forEach((user) => {
            credentials[user.email] = user.pass;
          });
          setUserCredentials(credentials);
        })
        .catch(() => {
          setSnackbarMessage("Error fetching user data.");
          setSnackbarOpen(true);
        });
    };

    fetchUsers();
  }, []);

  const handleTabChange = (newValue) => {
    setTab(newValue);
    setFormData({ email: "", password: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const { email, password } = formData;
    if (email === "" || password === "") {
      setSnackbarMessage("Please fill in all fields");
      setSnackbarOpen(true);
      return;
    }
  
    if (tab === 0) {
      if (!userCredentials[email]) {
        setSnackbarMessage("User doesn't exist, please register.");
      } else if (userCredentials[email] !== password) {
        setSnackbarMessage("Password doesn't match.");
      } else {
        setSnackbarMessage("Login successful! Redirecting...");
        fetch("http://127.0.0.1:5000/userID-fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })
        setTimeout(() => {
          // Call the onLoginSuccess callback from App.js
          onLoginSuccess(email);
          navigate("/home", { state: { email: email } });
        });
      }
    } else {
      if (userCredentials[email]) {
        setSnackbarMessage("USER ALREADY EXISTS");
      } else {
        fetch("http://127.0.0.1:5000/register-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Registration failed");
            }
            return response.json();
          })
          .then(() => {
            setSnackbarMessage("Registration successful! Please login.");
            setUserCredentials((prev) => ({ ...prev, [email]: password }));
            setTab(0);
            setFormData({ email: "", password: "" });
          })
          .catch(() => {
            setSnackbarMessage("Error during registration. Please try again.");
          });
      }
    }
    setSnackbarOpen(true);
  };
  

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  return (
    <div className="log-container">
      <div className="box">
        <div className="tabs">
          <button
            className={tab === 0 ? "active" : ""}
            onClick={() => handleTabChange(0)}
          >
            Login
          </button>
          <button
            className={tab === 1 ? "active" : ""}
            onClick={() => handleTabChange(1)}
          >
            Register
          </button>
        </div>
        <div style={{ marginTop: "20px" }}>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </label>
          <br />
          <label>
            Password:
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </label>
          <br />
          <button onClick={handleSubmit}>
            {tab === 0 ? "Sign In" : "Register"}
          </button>
        </div>
        {snackbarOpen && (
          <div className="snackbar">{snackbarMessage}</div>
        )}
      </div>

    </div>
  );
};

export default LoginRegister;
