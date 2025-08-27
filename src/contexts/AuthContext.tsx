import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { LocalDatabase } from '@/lib/localDb';
import { AuthState, AuthContextType, User, FirestoreUserData } from '@/types/auth';

// Auth reducer
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; permissions: string[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  permissions: [],
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      console.log("--- LOGIN ATTEMPT START (HYBRID MODEL) ---");

      // --- WORKFLOW STEP 1: ATTEMPT FAST, OFFLINE LOGIN ---
      console.log(`Step 1: Checking for local user: '${username}'`);
      const localUser = await LocalDatabase.getUser(username);

      if (localUser) {
        console.log("Step 1 Success: Found local user. Now verifying password with Firebase.");
        
        // Get email from Firestore username collection
        const usernameDocRef = doc(firestore, 'usernames', username);
        const usernameDoc = await getDoc(usernameDocRef);
        
        if (!usernameDoc.exists()) {
          console.log("Error: Local user exists, but no corresponding username document in Firestore.");
          throw new Error('User authentication data is inconsistent. Please contact support.');
        }
        
        const email = usernameDoc.data().email;
        console.log(`Found email for password verification: ${email}`);

        // Verify password with Firebase
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Password verification with Firebase successful.");
        
        console.log("Loading local permissions...");
        const permissions = await LocalDatabase.getUserPermissions(localUser.id);
        console.log("Permissions loaded. Login successful.");
        
        dispatch({ 
          type: 'SET_USER', 
          payload: { user: localUser, permissions } 
        });
        
        console.log("--- LOGIN ATTEMPT SUCCESS (LOCAL PATH) ---");
        return;
      }

      // --- WORKFLOW STEP 2: IF LOCAL LOGIN FAILS, ATTEMPT REMOTE LOGIN ---
      console.log("Step 1 Failed: No local user found. Proceeding to remote login.");
      console.log(`Step 2: Fetching email for username: '${username}' from Firestore.`);
      
      const usernameDocRef = doc(firestore, 'usernames', username);
      const usernameDoc = await getDoc(usernameDocRef);
      
      if (!usernameDoc.exists()) {
        console.log("Error: Username document not found in Firestore for remote login.");
        throw new Error('Invalid username or password.');
      }
      
      const email = usernameDoc.data().email;
      console.log(`Step 2 Success: Found email: ${email}`);

      console.log("Authenticating with Firebase Auth...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        console.log(`Firebase Auth successful. UID: ${firebaseUser.uid}`);
        console.log("Step 3: Hydrating local database from Firestore...");
        
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userFirestoreDoc = await getDoc(userDocRef);
        
        if (!userFirestoreDoc.exists()) {
          console.log(`Error: User document not found in 'users' collection with UID: ${firebaseUser.uid}`);
          throw new Error('Your user account data is missing from the database. Please contact support.');
        }
        
        const firestoreData = userFirestoreDoc.data() as FirestoreUserData;
        console.log("Firestore Data Found for hydration:", firestoreData);
        
        console.log("Creating User object...");
        const userToSync: User = {
          id: firestoreData.id,
          username: firestoreData.username,
          passwordHash: firestoreData.passwordHash,
          employeeId: firestoreData.employeeId,
          isSynced: true,
          isPremium: firestoreData.isPremium || false,
          role: firestoreData.role,
        };
        console.log("User object created successfully.");

        console.log("Syncing user to local database...");
        await LocalDatabase.upsertUser(userToSync);
        console.log("Step 3 Success: User synced to local DB.");
        
        console.log("Step 4: Loading permissions for newly synced user...");
        const permissions = await LocalDatabase.getUserPermissions(userToSync.id);
        console.log("Step 4 Success: Permissions loaded.");
        
        dispatch({ 
          type: 'SET_USER', 
          payload: { user: userToSync, permissions } 
        });
        
        console.log("--- LOGIN ATTEMPT SUCCESS (REMOTE PATH) ---");
      } else {
        console.log("Error: Firebase user is null after sign-in during remote path.");
        throw new Error('Firebase authentication failed unexpectedly.');
      }
    } catch (error: any) {
      console.log("--- LOGIN ATTEMPT FAILED ---");
      console.log(`Caught Exception Type: ${error.constructor.name}`);
      console.log("Error Details:", error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error?.code) {
        if (['invalid-credential', 'user-not-found', 'wrong-password'].includes(error.code)) {
          errorMessage = 'Invalid username or password.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}