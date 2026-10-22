import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { formatINR } from '../utils/formatCurrency.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountCreated() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-[var(--bg)] text-[var(--text-main)]">
      <div className="w-full max-w-md pt-6 flex flex-col items-center">
        <SimulationNotice />
      </div>

      <div className="w-full max-w-md my-auto py-6 text-center">
        {/* Success checkmark */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
          Account Created!
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Welcome to NovaBank, <span className="font-semibold text-[var(--text-main)]">{user?.name}</span>. Your virtual account is ready to use.
        </p>

        {/* Account Details Card */}
        <div className="mt-8 p-6 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--border-subtle)]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Account Number
            </span>
            <span className="font-mono font-bold text-base text-[var(--text-main)] tracking-wider">
              {user?.accountNumber || 'NB0000000000'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Opening Balance
            </span>
            <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
              {formatINR(user?.balancePaise ?? 1000000)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md pb-6 flex flex-col gap-3">
        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate('/')}
          className="w-full"
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}
