import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Student } from '../types';

export interface RegisteredAccount extends Student {
  password?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  signup: (userData: Omit<Student, 'profile_image'>, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (updatedData: Partial<Student>) => void;
  registeredUsersCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const STORAGE_KEY = 'portal_engine_user';
export const USERS_STORAGE_KEY = 'portal_engine_all_users';

export const DEFAULT_USERS: RegisteredAccount[] = [
  {
    student_id: "STU-2026-001",
    name: "Aarav Patel",
    email: "aarav@example.edu",
    password: "demoPass123",
    department: "Data Science",
    semester: 5,
    createdAt: "2026-08-15T09:00:00.000Z"
  },
  {
    student_id: "STU-2026-042",
    name: "Elena Rostova",
    email: "elena.rostova@example.edu",
    password: "elenaPass123",
    department: "Artificial Intelligence & ML",
    semester: 5,
    createdAt: "2026-08-15T09:00:00.000Z"
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure default users are seeded into localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } catch (e) {
      console.error('Error seeding initial demo users', e);
    }
  }, []);

  const [user, setUser] = useState<Student | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved user session', e);
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const getStoredUsers = (): RegisteredAccount[] => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading stored users', e);
    }
    return DEFAULT_USERS;
  };

  const login = (email: string, password?: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your registered university email.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const users = getStoredUsers();
      const matched = users.find(u => u.email.toLowerCase() === trimmedEmail);

      if (!matched) {
        return { 
          success: false, 
          error: 'No student account matches this email. Please check your spelling or register a new profile below.' 
        };
      }

      if (matched.password && matched.password !== password) {
        return { 
          success: false, 
          error: 'Incorrect password. Please verify your credentials or click 1-Click Demo Login.' 
        };
      }

      const { password: _, ...studentData } = matched;
      setUser(studentData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studentData));
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'An unexpected authentication error occurred.' };
    }
  };

  const signup = (userData: Omit<Student, 'profile_image'>, password?: string): { success: boolean; error?: string } => {
    const trimmedEmail = (userData.email || '').trim().toLowerCase();
    const trimmedName = (userData.name || '').trim();

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Please enter your full legal name (at least 2 characters).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Please provide a valid university email address (e.g. name@university.edu).' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const users = getStoredUsers();

      if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
        return { 
          success: false, 
          error: 'An account with this email address already exists. Please sign in instead.' 
        };
      }

      const newAccount: RegisteredAccount = {
        student_id: userData.student_id?.trim() || `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: trimmedName,
        email: trimmedEmail,
        department: userData.department || 'Computer Science & Engineering',
        semester: userData.semester || 1,
        password: password,
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, newAccount];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

      const { password: _, ...studentData } = newAccount;
      setUser(studentData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studentData));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Failed to create student account due to storage limits.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (updatedData: Partial<Student>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      const users = getStoredUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (index !== -1) {
        users[index] = { ...users[index], ...updatedData };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Error updating user in stored list', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      signup, 
      logout, 
      updateUser,
      registeredUsersCount: getStoredUsers().length
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
