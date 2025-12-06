import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Logged-in user object
  const [loading, setLoading] = useState(true); // Used until we check auth status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus(); // auto-check auth status on page load
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Local storage = a small storage space inside the browser (It keeps data even after a refresh, tab close, or restart).
      const token = localStorage.getItem("token"); // If the values does NOT exist it will return null
      const userStr = localStorage.getItem("user"); // localStorage values are ALWAYS strings

      // Check if both token and user data exist in localStorage
      if (token && userStr) {
        // Parse the user string from localStorage back into a JavaScript object
        const userData = JSON.parse(userStr);
        // Update the user state with the parsed user data
        setUser(userData);
        // Mark the user as authenticated
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Remove the authentication token from browser storage
    localStorage.removeItem("token");
    // Remove the user data from browser storage
    localStorage.removeItem("user");
    // Clear the user state by setting it to null
    setUser(null);
    // Mark the user as unauthenticated
    setIsAuthenticated(false);
    // Redirect to the home page
    window.location.href = "/";
  };

  const updateUser = (updateUserData) => {
    const newUserData = { ...user, ...updateUserData };
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // This is the data you are giving to all components.
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
