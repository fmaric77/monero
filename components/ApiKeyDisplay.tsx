'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface ApiKeyDisplayProps {
  apiKey: string;
  publicKey: string;
  accountIndex: number | null;
  testnet?: boolean;
}

export function ApiKeyDisplay({ apiKey, publicKey, accountIndex, testnet = false }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-gray-800">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Account Created Successfully
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your API key is displayed below. Keep it secure and never share it publicly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border backdrop-blur-sm" style={{ borderColor: testnet ? 'rgba(249, 115, 22, 0.5)' : 'rgba(34, 197, 94, 0.5)' }}>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${testnet ? 'text-orange-400' : 'text-green-400'}`}>
              {testnet ? '🧪' : '🌐'}
            </span>
            <div>
              <div className={`text-sm font-semibold ${testnet ? 'text-orange-400' : 'text-green-400'}`}>
                {testnet ? 'Testnet Account' : 'Mainnet Account'}
              </div>
              <div className="text-xs text-gray-500">
                {testnet ? 'Using test Monero tokens' : 'Using real Monero'}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${testnet ? 'bg-orange-900/30 text-orange-300 border border-orange-800/50' : 'bg-green-900/30 text-green-300 border border-green-800/50'}`}>
            {testnet ? 'TESTNET' : 'MAINNET'}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Your Public Address</label>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg font-mono text-sm break-all text-gray-300 backdrop-blur-sm">
            {publicKey}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Account Status</label>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg backdrop-blur-sm">
            {accountIndex !== null && accountIndex !== undefined ? (
              <div>
                <div className="text-sm text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Account Assigned
                </div>
                <div className="font-mono text-sm text-gray-300">Account Index: <span className="text-green-400">{accountIndex}</span></div>
                <div className="text-xs text-gray-500 mt-1">Your account in the master custodial wallet ({testnet ? 'testnet' : 'mainnet'})</div>
              </div>
            ) : (
              <div className="text-sm text-yellow-400 flex items-center gap-2">
                <span>⏳</span> Pending assignment (will be assigned shortly)
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">API Key</label>
          <div className="flex gap-3">
            <div className="flex-1 p-4 bg-gray-900/50 border border-gray-800 rounded-lg font-mono text-sm break-all text-gray-300 backdrop-blur-sm">
              {apiKey}
            </div>
            <Button onClick={copyToClipboard} variant="outline" size="sm" className="shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-yellow-400/80 flex items-center gap-1 mt-2">
            <span>⚠️</span> This is the only time you&apos;ll see your API key. Save it securely!
          </p>
        </div>
        <div className="pt-2">
          <a href="/docs" className="text-sm text-white hover:text-gray-300 transition-colors inline-flex items-center gap-1 font-medium">
            View API Documentation <span>→</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

