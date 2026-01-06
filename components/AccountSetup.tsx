'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface AccountSetupProps {
  isNewAccount: boolean;
  onSubmit: (password: string) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
}

export function AccountSetup({ isNewAccount, onSubmit, onBack, loading, error }: AccountSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (isNewAccount && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    onSubmit(password);
  };

  const displayError = error || localError;

  return (
    <Card className="border-gray-800">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold">
          {isNewAccount ? 'Create Account' : 'Account Found - Login Required'}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {isNewAccount
            ? 'Set a password to secure your account'
            : 'An account with this public key already exists. Please enter your password to access your API key.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div className="p-3 rounded-md bg-red-900/20 border border-red-800 text-red-300 text-sm">
              {displayError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={isNewAccount ? "Enter password" : "Enter your password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              disabled={loading}
              required
              minLength={8}
            />
          </div>
          {isNewAccount && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={8}
              />
            </div>
          )}
          <div className="flex gap-3">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button type="submit" disabled={loading || !password} className={onBack ? "flex-1" : "w-full"}>
              {loading ? 'Processing...' : isNewAccount ? 'Create Account' : 'Login'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

