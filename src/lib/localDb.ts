import { User } from '@/types/auth';

// Local storage keys
const USERS_KEY = 'pharmacy_users';
const PERMISSIONS_KEY = 'user_permissions';

export class LocalDatabase {
  // User operations
  static async getUser(username: string): Promise<User | null> {
    try {
      const users = this.getUsers();
      return users.find(user => user.username === username) || null;
    } catch (error) {
      console.error('Error getting user from local storage:', error);
      return null;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const users = this.getUsers();
      return users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('Error getting user by ID from local storage:', error);
      return null;
    }
  }

  static async upsertUser(user: User): Promise<void> {
    try {
      const users = this.getUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user };
      } else {
        users.push(user);
      }
      
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error upserting user to local storage:', error);
      throw error;
    }
  }

  private static getUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing users from local storage:', error);
      return [];
    }
  }

  // Permission operations
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const stored = localStorage.getItem(PERMISSIONS_KEY);
      const allPermissions = stored ? JSON.parse(stored) : {};
      return allPermissions[userId] || [];
    } catch (error) {
      console.error('Error getting permissions from local storage:', error);
      return [];
    }
  }

  static async setUserPermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      const stored = localStorage.getItem(PERMISSIONS_KEY);
      const allPermissions = stored ? JSON.parse(stored) : {};
      allPermissions[userId] = permissions;
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(allPermissions));
    } catch (error) {
      console.error('Error setting permissions in local storage:', error);
      throw error;
    }
  }

  // Clear all data
  static clear(): void {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  }
}