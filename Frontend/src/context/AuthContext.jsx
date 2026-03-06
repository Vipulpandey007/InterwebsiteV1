import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     AUTH CONTEXT - INITIALIZING        ║");
    console.log("╚════════════════════════════════════════╝");

    // Load from localStorage
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    console.log("🔍 Checking localStorage...");
    console.log("📍 Token exists:", !!savedToken);
    console.log("📍 User exists:", !!savedUser);

    if (savedToken) {
      console.log(
        "🔑 Token (first 50 chars):",
        savedToken.substring(0, 50) + "...",
      );
    }

    if (savedUser) {
      console.log("👤 User data:", savedUser);
    }

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log("✅ User parsed successfully:", parsedUser);

        setToken(savedToken);
        setUser(parsedUser);

        console.log("✅ Auth state restored from localStorage");
      } catch (error) {
        console.error("❌ Error parsing saved user:", error);
        console.error("❌ Clearing invalid data from localStorage");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      console.log("ℹ️  No saved auth data found - user not logged in");
    }

    setLoading(false);
    console.log("✅ Auth initialization complete");
    console.log("╚════════════════════════════════════════╝\n");
  }, []);

  const login = (userData, authToken) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     AUTH CONTEXT - LOGIN               ║");
    console.log("╚════════════════════════════════════════╝");

    console.log("📥 Login function called");
    console.log("📥 User data received:", userData);
    console.log("📥 Token received:", authToken ? "YES" : "❌ NO");

    if (!authToken) {
      console.error("❌ CRITICAL ERROR: No token provided to login function!");
      console.error("❌ Login will fail! Check the API response.");
      return;
    }

    if (!userData) {
      console.error(
        "❌ CRITICAL ERROR: No user data provided to login function!",
      );
      console.error("❌ Login will fail! Check the API response.");
      return;
    }

    console.log(
      "🔑 Token (first 50 chars):",
      authToken.substring(0, 50) + "...",
    );
    console.log("👤 User ID:", userData.id);
    console.log("👤 User name:", userData.name);
    console.log("👤 User email:", userData.email);
    console.log("👤 User mobile:", userData.mobile);

    // Update state
    setUser(userData);
    setToken(authToken);
    console.log("✅ State updated");

    // Save to localStorage
    try {
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("✅ Saved to localStorage");

      // Verify save
      const verifyToken = localStorage.getItem("token");
      const verifyUser = localStorage.getItem("user");

      console.log("🔍 Verification:");
      console.log("   Token saved:", !!verifyToken);
      console.log("   User saved:", !!verifyUser);

      if (verifyToken && verifyUser) {
        console.log("✅ VERIFICATION SUCCESSFUL - Data persisted correctly");
      } else {
        console.error(
          "❌ VERIFICATION FAILED - Data not saved to localStorage!",
        );
      }
    } catch (error) {
      console.error("❌ Error saving to localStorage:", error);
    }

    console.log("╔════════════════════════════════════════╗");
    console.log("║     LOGIN COMPLETE                     ║");
    console.log("╚════════════════════════════════════════╝\n");
  };

  const logout = () => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     AUTH CONTEXT - LOGOUT              ║");
    console.log("╚════════════════════════════════════════╝");

    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.log("✅ User logged out");
    console.log("✅ LocalStorage cleared");
    console.log("╚════════════════════════════════════════╝\n");
  };

  const updateUser = (userData) => {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     AUTH CONTEXT - UPDATE USER         ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("📥 New user data:", userData);

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    console.log("✅ User updated");
    console.log("╚════════════════════════════════════════╝\n");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
