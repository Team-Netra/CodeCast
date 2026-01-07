import axios from "axios";

const axiosInstance = axios.create({
    // Replace with your backend URL
    baseURL: "http://localhost:5000", 
    withCredentials: true, // Crucial for sending cookies/refresh tokens
});

export default axiosInstance;