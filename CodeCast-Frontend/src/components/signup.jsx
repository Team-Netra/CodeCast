import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useApi from "../hooks/useApi.js";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const SignupPage = () => {
  const api = useApi();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate(); // Hook for navigation

  const [errors, setErrors] = useState({}); //inline error messages

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "", form: "" }));
  };

  const togglePasswordVisibility = (field) => {
  if (field === "password") setShowPassword((prev) => !prev);
  else if (field === "confirmPassword") setShowConfirmPassword((prev) => !prev);
  };

  const handleSignup = (e) => {
    e.preventDefault();

    const newErrors = {};

    //Name validation
    if (!formData.fullName.trim()) {
    newErrors.fullName = "Full name is required";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Password validation (emptiness)
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    // Confirm password validation (emptiness)
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    }

    // Password match validation (only if both exist)
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms & conditions validation
    if (!agreeToTerms) {
    newErrors.terms = "You must agree to the terms and conditions";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    signup();
  };

  const signup = () => {
    const signup_data = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    api.post('/users/register', signup_data)
      .then((res) => {
        console.log(res.data);
        console.log(res.status);
        if (res.status === 200 || res.status === 201) {
          console.log("Successsss !!!")
          navigate("/home"); // Navigate to HomePage after signup
        }
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          setErrors({ email: "This email is already registered" });
        } else {
          console.error("Signup failed:", error);
          setErrors({ form: "Signup failed. Please try again later." });
        }
      })

    // axios
    //   .post("http://localhost:5000/users/register", signup_data ,{ withCredentials: true })
    //   .then((res) => {
    //     console.log(res.data);
    //     console.log(res.status);
    //     if (res.status === 200 || res.status === 201) {
    //       console.log("Successsss !!!")
    //       navigate("/home"); // Navigate to HomePage after signup
    //     }
    //   })
    //   .catch((error) => {
    //     if (error.response && error.response.status === 409) {
    //       alert("This email is already registered. Please log in or use a different email.");
    //     } else {
    //       console.error("Signup failed:", error);
    //       alert("Signup failed. Please try again later.");
    //     }
    //   });      
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(18, 18, 18, 1)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: 350,
          p: 3,
          bgcolor: "rgba(33, 33, 33, 1)",
          color: "white",
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <Typography variant="h4" align="center" fontWeight="bold" mb={3}>
          Sign Up
        </Typography>

        <form onSubmit={handleSignup}>
          <TextField
            name="fullName"
            label="Full Name"
            fullWidth
            sx={{
              input: { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(86, 86, 86, 1)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(86, 86, 86, 1)" },
                "&:hover fieldset": { borderColor: "white" },
              },
              "& .MuiOutlinedInput-root.Mui-error fieldset": {
                borderColor: "rgba(86, 86, 86, 1)",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "rgba(86, 86, 86, 1)",
              },
            }}
            margin="normal"
            variant="outlined"
            value={formData.fullName}
            onChange={handleChange}
            error={!!errors.fullName}          
            helperText={errors.fullName}
            slotProps={{
              formHelperText: {
                sx: {
                  "&.Mui-error": {
                    color: "#FF9800",
                  },
                },
              },
            }}
          />
          <TextField
            name="email"
            label="Email"
            fullWidth
            sx={{
              input: { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(86, 86, 86, 1)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(86, 86, 86, 1)" },
                "&:hover fieldset": { borderColor: "white" },
              },
              "& .MuiOutlinedInput-root.Mui-error fieldset": {
                borderColor: "rgba(86, 86, 86, 1)",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "rgba(86, 86, 86, 1)",
              },
            }}
            margin="normal"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            slotProps={{
              formHelperText: {
                sx: {
                  "&.Mui-error": {
                    color: "#FF9800",
                  },
                },
              },
            }}
          />
          <TextField
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            sx={{
              input: { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(86, 86, 86, 1)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(86, 86, 86, 1)" },
                "&:hover fieldset": { borderColor: "white" },
              },
              "& .MuiOutlinedInput-root.Mui-error fieldset": {
                borderColor: "rgba(86, 86, 86, 1)",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "rgba(86, 86, 86, 1)",
              },
            }}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    sx={{
                      minWidth: 0,
                      p: 0,
                      color: "rgba(86, 86, 86, 1)",
                      background: "transparent",
                      "&:hover": { background: "transparent" },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                </InputAdornment>
              ),
            }}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            slotProps={{
              formHelperText: {
                sx: {
                  "&.Mui-error": {
                    color: "#FF9800",
                  },
                },
              },
            }}
          />
          <TextField
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            sx={{
              input: { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(86, 86, 86, 1)" },
              "& .MuiInputLabel-root.Mui-focused": { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "rgba(86, 86, 86, 1)" },
                "&:hover fieldset": { borderColor: "white" },
              },
              "& .MuiOutlinedInput-root.Mui-error fieldset": {
                borderColor: "rgba(86, 86, 86, 1)",
              },
              "& .MuiInputLabel-root.Mui-error": {
                color: "rgba(86, 86, 86, 1)",
              },
            }}
            margin="normal"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    sx={{
                      minWidth: 0,
                      p: 0,
                      color: "rgba(86, 86, 86, 1)",
                      background: "transparent",
                      "&:hover": { background: "transparent" },
                    }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                </InputAdornment>
              ),
            }}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword} 
            helperText={errors.confirmPassword}
            slotProps={{
              formHelperText: {
                sx: {
                  "&.Mui-error": {
                    color: "#FF9800",
                  },
                },
              },
            }}
          />

          <FormControlLabel
            control={<Checkbox 
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              sx={{ color: "rgba(165, 14, 178, 1)" }} />}
            label={
              <>
                I Agree with{" "}
                <Link href="#" underline="hover" color="rgba(165, 14, 178, 1)">
                  privacy
                </Link>{" "}
                and{" "}
                <Link href="#" underline="hover" color="rgba(165, 14, 178, 1)">
                  policy
                </Link>
              </>
            }
            sx={{ mt: 2 }}
          />

          {errors.terms && (
            <Typography variant="body2" sx={{ color: "#FF9800", mt: 2 }}>
              {errors.terms}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="secondary"
            sx={{
              bgcolor: "purple",
              mt: 2,
              mb: 2,
              ":hover": { bgcolor: "darkorchid" },
            }}
          >
            Sign Up
          </Button>
        </form>

        <Typography align="center">
          Already have an account?{" "}
          <Link href="/login" underline="hover" color="secondary">
            Log in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignupPage;