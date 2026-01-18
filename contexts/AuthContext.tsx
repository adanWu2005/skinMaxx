import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import createContextHook from "@nkzw/create-context-hook";

import { setAuthToken, setOnUnauthorized, trpc } from "@/lib/trpc";

interface User {
  id: string;
  email: string;
  name: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      console.log('[Auth] Unauthorized - logging out');
      logout();
    });
  }, [logout]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      router.replace('/login');
    }
  }, [user, segments, isLoading, router]);

  const login = async (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setAuthToken(authToken);
    await AsyncStorage.setItem("auth_token", authToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    router.replace("/scan");
  };

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  const deleteAccount = useCallback(async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      await logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  }, [deleteAccountMutation, logout]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    deleteAccount,
  };
});
