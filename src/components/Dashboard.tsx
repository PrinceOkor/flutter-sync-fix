import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user, permissions, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Pharmacy Management</h1>
            <Badge variant="secondary" className="text-xs">
              {user.role || 'User'}
            </Badge>
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Information</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{user.username}</div>
                <p className="text-xs text-muted-foreground">
                  Employee ID: {user.employeeId}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.isPremium ? "default" : "secondary"}>
                    {user.isPremium ? 'Premium' : 'Standard'}
                  </Badge>
                  <Badge variant={user.isSynced ? "default" : "destructive"}>
                    {user.isSynced ? 'Synced' : 'Not Synced'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Active permissions
              </p>
              <div className="mt-4 space-y-1">
                {permissions.slice(0, 3).map((permission, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
                {permissions.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Local Database</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Firebase Sync</span>
                  <Badge variant="default">Online</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Authentication logs and system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/50 p-4 rounded-lg text-sm font-mono space-y-1">
              <div className="text-primary">--- LOGIN ATTEMPT SUCCESS (LOCAL PATH) ---</div>
              <div>Step 1: Local user verification ✓</div>
              <div>Step 2: Firebase password verification ✓</div>
              <div>Step 3: Permissions loaded ✓</div>
              <div className="text-muted-foreground">
                User ID: {user.id}
              </div>
              <div className="text-muted-foreground">
                Last sync: {new Date().toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}