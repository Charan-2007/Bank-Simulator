import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-gradient-to-b from-[var(--bg)] via-[var(--surface-subtle)] to-[var(--bg)] text-[var(--text-main)]">
      {/* Top Brand & Notice */}
      <div className="w-full max-w-md pt-8 flex flex-col items-center gap-4 text-center">
        <SimulationNotice />
      </div>

      {/* Hero Visual & Copy */}
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6 my-auto">
        {/* NovaBank Logo Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1b4f9c] to-[#3a7bd5] flex items-center justify-center shadow-xl shadow-[#1b4f9c]/25 border border-white/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
            NovaBank
          </h1>
          <p className="mt-2 text-base text-[var(--text-muted)] max-w-xs mx-auto">
            Experience next-generation digital banking with animated cards and fluid glass navigation.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 w-full text-left pt-2">
          <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-[#1b4f9c]/10 text-[#1b4f9c] flex items-center justify-center font-bold text-xs mb-1.5">
              ₹
            </div>
            <div className="font-bold text-sm text-[var(--text-main)]">₹10,000 Demo</div>
            <div className="text-[11px] text-[var(--text-muted)]">Instant starting balance</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-[#1b4f9c]/10 text-[#1b4f9c] flex items-center justify-center font-bold text-xs mb-1.5">
              ✦
            </div>
            <div className="font-bold text-sm text-[var(--text-main)]">29 Art Cards</div>
            <div className="text-[11px] text-[var(--text-muted)]">Live video backgrounds</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md pb-8 flex flex-col gap-3">
        <Button
          size="lg"
          variant="primary"
          onClick={() => navigate('/register')}
          className="w-full text-base"
        >
          Create Free Account
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => navigate('/login')}
          className="w-full text-base"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
