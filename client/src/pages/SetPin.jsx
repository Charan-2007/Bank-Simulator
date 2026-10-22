import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PinInput from '../components/common/PinInput.jsx';
import Button from '../components/common/Button.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { setPin } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatApiError } from '../utils/errorUtils.js';

export default function SetPin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const userId = location.state?.userId || sessionStorage.getItem('novabank_otp_uid');
  const tempToken = location.state?.tempToken || sessionStorage.getItem('novabank_otp_token');

  const [pin, setPinState] = useState('');
  const [confirmPin, setConfirmPinState] = useState('');
  const [error, setError] = useState('');
  const [countdown429, setCountdown429] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.userId) {
      sessionStorage.setItem('novabank_otp_uid', location.state.userId);
    }
    if (location.state?.tempToken) {
      sessionStorage.setItem('novabank_otp_token', location.state.tempToken);
    }
  }, [location.state]);

  // 429 countdown timer
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
    return () => clearInterval(interval);
  }, [countdown429]);

  const isComplete = pin.length === 6 && confirmPin.length === 6;
  const isMatch = isComplete && pin === confirmPin;
  const hasMismatch = confirmPin.length === 6 && pin !== confirmPin;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return; // Prevent double submission

    setError('');

    if (pin.length !== 6) {
      setError('Please enter a 6-digit Security PIN.');
      return;
    }

    if (confirmPin.length !== 6) {
      setError('Please confirm your 6-digit Security PIN.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await setPin({
        pin,
        confirmPin,
        userId,
        tempToken
      });

      // Clear pending auth storage
      sessionStorage.removeItem('novabank_otp_uid');
      sessionStorage.removeItem('novabank_otp_token');
      sessionStorage.removeItem('novabank_otp_phone');
      sessionStorage.removeItem('novabank_otp_dev');

      if (res.user && res.accessToken) {
        setAuthData(res.user, res.accessToken, res.refreshToken);
      }

      navigate('/choose-card', {
        state: { isNewUser: true }
      });
    } catch (err) {
      if (err.status === 429) {
        const retry = err.retryAfter || 60;
        setCountdown429(retry);
        setError(`Too many attempts. Try again in ${retry} seconds.`);
      } else if (err.status === 409 || err.message?.includes('already set')) {
        setError('PIN already set, log in instead');
      } else if (err.status === 401) {
        setError('OTP not verified or expired, verify again');
      } else {
        setError(formatApiError(err, 'Failed to set PIN. Please try again.'));
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
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1b4f9c]/10 text-[#1b4f9c] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Set Security PIN
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Create a 6-digit PIN used to authorize money transfers.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          {/* New PIN */}
          <div className="w-full flex flex-col items-center">
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              New Security PIN
            </label>
            <PinInput
              id="new-pin-input"
              value={pin}
              onChange={(val) => {
                setPinState(val);
                setError('');
              }}
              onSubmit={handleSubmit}
              autoFocus={true}
              disabled={loading}
              ariaLabel="New Security PIN"
            />
          </div>

          {/* Confirm PIN */}
          <div className="w-full flex flex-col items-center">
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Confirm Security PIN
            </label>
            <PinInput
              id="confirm-pin-input"
              value={confirmPin}
              onChange={(val) => {
                setConfirmPinState(val);
                setError('');
              }}
              onSubmit={handleSubmit}
              disabled={loading}
              error={hasMismatch}
              ariaLabel="Confirm Security PIN"
            />

            {/* Live PIN Match Indicator */}
            {confirmPin.length > 0 && (
              <div className="mt-2 text-xs font-medium flex items-center gap-1.5">
                {isMatch ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    PINs match
                  </span>
                ) : (
                  <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    PINs do not match
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Explicit Submit Button */}
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={loading}
            disabled={!isMatch || loading}
            className="w-full max-w-xs mt-3"
          >
            Set Security PIN
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md pb-6 text-center text-xs text-[var(--text-muted)]">
        Keep your PIN confidential. Never share it with anyone.
      </div>
    </div>
  );
}
