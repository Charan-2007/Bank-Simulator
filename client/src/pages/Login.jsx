import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PinInput from '../components/common/PinInput.jsx';
import PhoneInput from '../components/common/PhoneInput.jsx';
import Button from '../components/common/Button.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateIndianPhone } from '@shared/phoneUtils.js';
import { formatApiError } from '../utils/errorUtils.js';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [countdown429, setCountdown429] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown429 <= 0) return;
    const interval = setInterval(() => {
      setCountdown429(prev => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        const next = prev - 1;
        setError(`Too many attempts. Try again in ${next} seconds.`);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown429]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setError('');
    setIsLocked(false);

    const validation = validateIndianPhone(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || 'Enter a valid mobile number');
      setError(validation.error || 'Enter a valid mobile number');
      return;
    }

    if (pin.length !== 6) {
      setError('Please enter your 6-digit PIN');
      return;
    }

    setLoading(true);
    try {
      await login(phone, pin);
      navigate('/');
    } catch (err) {
      if (err.status === 423) {
        setIsLocked(true);
        setError(err.message || 'Account is temporarily locked due to failed PIN attempts.');
      } else if (err.status === 429) {
        const retry = err.retryAfter || 60;
        setCountdown429(retry);
        setError(`Too many attempts. Try again in ${retry} seconds.`);
      } else {
        setError(formatApiError(err, 'Invalid phone number or PIN'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-6 bg-[var(--bg)] text-[var(--text-main)]">
      <div className="w-full max-w-md pt-6 flex flex-col items-center">
        <SimulationNotice />
      </div>

      <div className="w-full max-w-md my-auto py-6">
        <div className="mb-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] mb-6 cursor-pointer mx-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Welcome
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Welcome back
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Sign in to access your NovaBank account.
          </p>
        </div>

        {error && (
          <div className={`p-3.5 mb-6 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
            isLocked
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Registered Phone Number
            </label>
            <PhoneInput
              value={phone}
              onChange={(canonical, isValid, digits) => {
                setPhone(canonical);
                if (digits.length === 10 && !isValid) {
                  setPhoneError('Indian mobile number must start with 6, 7, 8, or 9');
                } else {
                  setPhoneError('');
                }
              }}
              error={phoneError}
              autoFocus={true}
              disabled={loading || isLocked}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">
              Security PIN
            </label>
            <PinInput
              id="login-pin-input"
              value={pin}
              onChange={setPin}
              onSubmit={handleLogin}
              autoFocus={false}
              disabled={loading || isLocked}
              ariaLabel="Login Security PIN"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={loading}
            disabled={isLocked || pin.length !== 6 || !phone || loading}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md pb-6 text-center text-xs text-[var(--text-muted)]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="font-bold text-[#1b4f9c] dark:text-blue-400 hover:underline cursor-pointer"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
