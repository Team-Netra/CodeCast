import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // VERY IMPORTANT (cookies)
});

export const checkAuth = async () => {
  try {
    const res = await API.get("/auth/me"); 
    return res.data; // user data
  } catch (err) {
    return null;
  }
};
