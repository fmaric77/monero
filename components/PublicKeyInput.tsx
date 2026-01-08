'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface PublicKeyInputProps {
  onSubmit: (publicKey: string, password: string, testnet: boolean) => void;
  loading?: boolean;
  error?: string;
}

export function PublicKeyInput({ onSubmit, loading, error }: PublicKeyInputProps) {
  const [publicKey, setPublicKey] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!publicKey.trim()) {
      setLocalError('Public key is required');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    // Always use mainnet for public UI (testnet is admin-only)
    onSubmit(publicKey.trim(), password, false);
  };

  const displayError = error || localError;

  return (
    <Card className="border-gray-800">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Monero Payment Processor
        </CardTitle>
        <CardDescription className="text-gray-400">
          Enter your Monero public address and password to get started
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
            <Label htmlFor="publicKey">Public Address</Label>
            <Input
              id="publicKey"
              type="text"
              placeholder="Enter your Monero public address"
              value={publicKey}
              onChange={(e) => {
                setPublicKey(e.target.value);
                setLocalError('');
              }}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
              }}
              disabled={loading}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500">
              If an account exists, you&apos;ll be logged in automatically. Otherwise, a new account will be created.
            </p>
          </div>
          <div className="p-3 bg-gray-900/30 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-400">🌐</span>
              <div>
                <div className="text-sm font-medium text-green-400">Mainnet</div>
                <div className="text-xs text-gray-500">Using real Monero</div>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={loading || !publicKey.trim() || !password} className="w-full">
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

