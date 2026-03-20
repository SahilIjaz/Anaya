import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("[AUTH-CTX] Init | token exists:", !!token);
    if (token) {
      console.log("[AUTH-CTX] Fetching /auth/me...");
      api
        .get("/auth/me")
        .then((res) => {
          console.log("[AUTH-CTX] /auth/me success | user:", res.data?.name);
          setUser(res.data);
        })
        .catch((err) => {
          console.error("[AUTH-CTX] /auth/me failed:", err.response?.status, err.message);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      console.log("[AUTH-CTX] No token, skipping auth check");
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log("[AUTH-CTX] login() called for:", email);
    const res = await api.post("/auth/login", { email, password });
    console.log("[AUTH-CTX] login() success | userId:", res.data.user?._id);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    console.log("[AUTH-CTX] register() called for:", data.email);
    console.log("[AUTH-CTX] register data keys:", Object.keys(data));
    const res = await api.post("/auth/register", data);
    console.log("[AUTH-CTX] register() success | userId:", res.data.user?._id);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    console.log("[AUTH-CTX] logout()");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (userData) => {
    console.log("[AUTH-CTX] updateUser()");
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
