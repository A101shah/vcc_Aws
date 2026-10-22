
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
} from 'aws-amplify/auth';

import type { Student } from '../types';

type AuthResult = {
  success: boolean;
  error?: string;
  requiresConfirmation?: boolean;
};

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password?: string
  ) => Promise<AuthResult>;


  signup: (
    userData: Omit<Student, 'profile_image'>,
    password?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresConfirmation?: boolean;
  }>;


  confirmEmail: (
    email: string,
    code: string
  ) => Promise<AuthResult>;

  resendCode: (email: string) => Promise<AuthResult>;

  logout: () => Promise<void>;

  updateUser: (
    updatedData: Partial<Student>
  ) => Promise<void>;

  registeredUsersCount: number;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected authentication error occurred.';
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    const student: Student = {
      student_id: currentUser.userId,
      name:
        attributes.name ||
        attributes.email ||
        'Student',
      email: attributes.email || '',
      department:
        attributes['custom:department'] ||
        'Computer Science & Engineering',
      semester: Number(
        attributes['custom:semester'] || 1
      ),
    };

    setUser(student);
    return student;
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();

        if (!active) return;

        setUser({
          student_id: currentUser.userId,
          name: attributes.name || 'Student',
          email: attributes.email || '',
          department:
            attributes['custom:department'] ||
            'Computer Science & Engineering',
          semester: Number(
            attributes['custom:semester'] || 1
          ),
        });
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    password?: string
  ): Promise<AuthResult> => {
    if (!email.trim() || !password) {
      return {
        success: false,
        error: 'Email and password are required.',
      };
    }

    try {
      const result = await signIn({
        username: email.trim().toLowerCase(),
        password,
      });

      if (result.isSignedIn) {
        await loadUser();
        return { success: true };
      }

      if (
        result.nextStep.signInStep ===
        'CONFIRM_SIGN_UP'
      ) {
        return {
          success: false,
          requiresConfirmation: true,
          error: 'Please verify your email first.',
        };
      }

      return {
        success: false,
        error:
          `Additional authentication required: ${result.nextStep.signInStep
          }`,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  };

  const signup = async (
    userData: Omit<Student, 'profile_image'>,
    password?: string
  ): Promise<AuthResult> => {
    const email = userData.email.trim().toLowerCase();

    if (!userData.name.trim() || !email || !password) {
      return {
        success: false,
        error: 'Name, email and password are required.',
      };
    }

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: userData.name.trim(),
          },
        },
      });

      return {
        success: result.isSignUpComplete,
        requiresConfirmation:
          !result.isSignUpComplete,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  };

  const confirmEmail = async (
    email: string,
    code: string
  ): Promise<AuthResult> => {
    try {
      const result = await confirmSignUp({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
      });

      return {
        success: result.isSignUpComplete,
        requiresConfirmation:
          !result.isSignUpComplete,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  };

  const resendCode = async (
    email: string
  ): Promise<AuthResult> => {
    try {
      await resendSignUpCode({
        username: email.trim().toLowerCase(),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (
    updatedData: Partial<Student>
  ) => {
    if (!user) return;

    const attributes: Record<string, string> = {};

    if (updatedData.name !== undefined) {
      attributes.name = updatedData.name;
    }

    if (Object.keys(attributes).length > 0) {
      await updateUserAttributes({
        userAttributes: attributes,
      });
    }

    setUser(previous =>
      previous
        ? { ...previous, ...updatedData }
        : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        confirmEmail,
        resendCode,
        logout,
        updateUser,
        registeredUsersCount: 0,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};
