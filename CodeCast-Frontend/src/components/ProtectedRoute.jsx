import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkAuth } from "../api/auth";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const user = await checkAuth();
      if (user) setIsAuth(true);
      setLoading(false);
    };
    verify();
  }, []);

  if (loading) return null; // or spinner

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
