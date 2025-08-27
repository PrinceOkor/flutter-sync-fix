export interface User {
  id: string;
  username: string;
  employeeId: string;
  passwordHash: string;
  isSynced: boolean;
  isPremium: boolean;
  role?: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface FirestoreUserData {
  id: string;
  username: string;
  passwordHash: string;
  employeeId: string;
  isPremium: boolean;
  role?: string;
}