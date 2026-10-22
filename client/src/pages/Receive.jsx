import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Receive() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const qrData = JSON.stringify({
    type: 'novabank',
    accountNumber: user?.accountNumber || '',
    name: user?.name || ''
  });

  const handleCopy = () => {
    if (user?.accountNumber) {
      navigator.clipboard.writeText(user.accountNumber).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-[var(--surface-subtle)] rounded-3xl border border-[var(--border)] shadow-xs">
      <div className="text-center">
        <h2 className="text-lg font-bold text-[var(--text-main)]">Receive Money</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Scan this QR or share your account number to receive instant transfers.
        </p>
      </div>

      {/* QR Code container */}
      <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-md">
        <QRCodeSVG
          value={qrData}
          size={200}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Account Info */}
      <div className="w-full text-center flex flex-col items-center gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Account Holder
        </span>
        <span className="text-base font-bold text-[var(--text-main)]">
          {user?.name || 'Account Holder'}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono font-bold text-lg text-[#1b4f9c] tracking-wider">
            {user?.accountNumber || 'NB0000000000'}
          </span>
        </div>
      </div>

      {/* Copy button */}
      <Button
        variant="secondary"
        size="md"
        onClick={handleCopy}
        className="w-full"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied to Clipboard!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copy Account Number</span>
          </>
        )}
      </Button>
    </div>
  );
}
