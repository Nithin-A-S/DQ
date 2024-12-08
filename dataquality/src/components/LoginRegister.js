import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Snackbar,
  Tab,
  Tabs,
} from "@mui/material";
import { Visibility, VisibilityOff, Person } from "@mui/icons-material";
// import CsvFileUpload from "./CsvFileUpload.js";
import './style/LoginRegister.css';
import { useNavigate } from "react-router-dom";

const LoginRegister = () => {
  const [tab, setTab] = useState(0); 
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [userCredentials, setUserCredentials] = useState({}); 
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // const [loggedIn,setLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Fetch user credentials on component mount
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
          console.log(credentials);
        })
        .catch(() => {
          setSnackbarMessage("Error fetching user data.");
          setSnackbarOpen(true);
        });
    };

    fetchUsers();
  }, []);

  const handleTabChange = (_, newValue) => {
    setTab(newValue);
    setFormData({ email: "", password: "" }); // Reset form fields
  };

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

  const handleMouseDownPassword = (event) => event.preventDefault();

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
        setTimeout(() => {
          navigate("/fileupload", { state: { email: email } });
        }, 2000);
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
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        <Box sx={{ mt: 3 }}>
          <FormControl sx={{ my: 2 }} fullWidth variant="outlined">
            <InputLabel size="small" htmlFor="outlined-adornment-email">
              Email
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-email"
              type="email"
              name="email"
              size="small"
              value={formData.email}
              onChange={handleInputChange}
              startAdornment={
                <InputAdornment position="start">
                  <Person fontSize="small" />
                </InputAdornment>
              }
              label="Email"
            />
          </FormControl>

          <FormControl sx={{ my: 2 }} fullWidth variant="outlined">
            <InputLabel size="small" htmlFor="outlined-adornment-password">
              Password
            </InputLabel>
            <OutlinedInput
              id="outlined-adornment-password"
              type={showPassword ? "text" : "password"}
              name="password"
              size="small"
              value={formData.password}
              onChange={handleInputChange}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="inherit" />
                    ) : (
                      <Visibility fontSize="inherit" />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            {tab === 0 ? "Sign In" : "Register"}
          </Button>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
      </div>
    </div>
  );
};

export default LoginRegister;
