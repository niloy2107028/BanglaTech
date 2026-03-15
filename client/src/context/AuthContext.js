// AuthContext is used to manage and share authentication state (user login status) across the entire React application without passing props.

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log("i am inside auth context ");

  const [user, setUser] = useState(null);
  // null = not logged in
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  // true on first load while we check if user is already logged in

  useEffect(() => {
    // On app load, check if user has a valid cookie session
    checkAuth();
    // If you comment out checkAuth()
    // Refresh/login persistence breaks
    // After refresh, frontend won’t restore user from cookie. User state stays default (null) even if cookie is valid.
    // Protected routes may wrongly redirect
    // Your route guard sees user === null and sends user to login even though backend session is valid.
  }, []);

  // The empty dependency array [] tells React:

  // Run this effect only once after the component first appears on the screen. This moment is called initial mount.
  // useEffect(..., []) runs once after initial mount, not on each re-render.

  // Re-render vs Mount

  // These are different.
  // Mount (first time)
  // Component appears in UI
  // Re-render
  // Happens when state changes.

  const checkAuth = async () => {
    try {
      console.log("i am inside check auth ");
      const res = await axios.get("/api/auth/me", { withCredentials: true });
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      // finally  ALWAYS runs at the end
      console.log("finally");
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true },
      // withCredentials: true → send/receive cookies cross-origin
    );
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await axios.post(
      "/api/auth/register",
      { name, email, password },
      { withCredentials: true },
    );
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  };

  // !! means convert a value to boolean.
  const isAuthenticated = !!user;

  const p = () => {
    console.log("niloy");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        p,
        refreshAuth: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
    // Share these values with every component inside {children}
    // children will be app
    // check the app component
    //Check X in the app component
  );
};

// Custom hook so any component can use: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);

// we will wrap the app later
// Now all components inside <App /> can use:
// const { user, login, logout } = useAuth();
