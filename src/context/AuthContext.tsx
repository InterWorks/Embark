import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { StoredUser, AuthSession } from '../types';

const USERS_KEY = 'embark_users';
const SESSION_KEY = 'embark_session';

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: StoredUser | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => void;
  register: (data: RegisterData) => void;
  logout: () => void;
  updateUser: (updates: Partial<StoredUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession);

  const getCurrentUser = useCallback((): StoredUser | null => {
    if (!session) return null;
    const users = loadUsers();
    return users.find(u => u.id === session.userId) ?? null;
  }, [session]);

  const currentUser = getCurrentUser();

  const login = useCallback((usernameOrEmail: string, password: string) => {
    const users = loadUsers();
    const hash = btoa(password);
    const user = users.find(
      u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.passwordHash === hash
    );
    if (!user) throw new Error('Invalid credentials');
    const newSession: AuthSession = {
      userId: user.id,
      username: user.username,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const register = useCallback((data: RegisterData) => {
    const users = loadUsers();
    if (users.some(u => u.username === data.username)) throw new Error('Username taken');
    if (users.some(u => u.email === data.email)) throw new Error('Email taken');
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username: data.username,
      email: data.email,
      phone: data.phone,
      passwordHash: btoa(data.password),
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
    const newSession: AuthSession = {
      userId: newUser.id,
      username: newUser.username,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const updateUser = useCallback((updates: Partial<StoredUser>) => {
    if (!session) return;
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return;
    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    saveUsers(users);
    // Force re-render by toggling session (same value but new reference)
    setSession(s => s ? { ...s } : null);
  }, [session]);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
