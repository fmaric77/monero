'use client';

import { useState } from 'react';
import { PublicKeyInput } from '@/components/PublicKeyInput';
import { ApiKeyDisplay } from '@/components/ApiKeyDisplay';

type ViewState = 'input' | 'success';

export default function Home() {
  const [view, setView] = useState<ViewState>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accountData, setAccountData] = useState<{
    apiKey: string;
    publicKey: string;
    custodialAddress: string | null;
  } | null>(null);

  const handleSubmit = async (publicKey: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccountData({
          apiKey: data.apiKey,
          publicKey: data.publicKey,
          custodialAddress: data.custodialAddress,
        });
        setError('');
        setView('success');
      } else {
        const errorData = await response.json();
        if (errorData.code === 'INVALID_PASSWORD') {
          setError('Invalid password. Please try again.');
        } else {
          setError(errorData.error || 'Failed to create/access account');
        }
      }
    } catch (error) {
      console.error('Error creating/accessing account:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {view === 'input' && (
          <PublicKeyInput onSubmit={handleSubmit} loading={loading} error={error} />
        )}
        {view === 'success' && accountData && (
          <ApiKeyDisplay
            apiKey={accountData.apiKey}
            publicKey={accountData.publicKey}
            custodialAddress={accountData.custodialAddress}
          />
        )}
      </div>
    </main>
  );
}

