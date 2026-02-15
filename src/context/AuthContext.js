"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "trusthive_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);
  }, []);

  const setToken = useCallback((token) => {
    if (typeof window !== "undefined" && token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, []);

  const fetchUser = useCallback(async (token) => {
    if (!token) return null;
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    fetchUser(token).then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, [fetchUser]);

  const login = useCallback(
    async (token, userData) => {
      setToken(token);
      setUser(userData ?? (await fetchUser(token)));
    },
    [setToken, fetchUser]
  );

  const getToken = useCallback(() => {
    return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        getToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
