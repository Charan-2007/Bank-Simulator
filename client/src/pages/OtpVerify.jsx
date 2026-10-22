import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import OtpVerifyAnimation from '../components/common/OtpVerifyAnimation.jsx';
import Button from '../components/common/Button.jsx';
import { verifyOtp, requestOtp } from '../api/auth.js';
import { formatApiError } from '../utils/errorUtils.js';

export default function OtpVerify() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve initial state from navigation or sessionStorage fallback
  const phone = location.state?.phone || sessionStorage.getItem('novabank_otp_phone') || '';
  const initialDevOtp = location.state?.devOtp || sessionStorage.getItem('novabank_otp_dev') || null;
  const initialUserId = location.state?.userId || sessionStorage.getItem('novabank_otp_uid') || null;

  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [error, setError] = useState('');
  const [countdown429, setCountdown429] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animStatus, setAnimStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'failure'
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [cooldown, setCooldown] = useState(0);

  const autoRequestedRef = useRef(false);

  // Sync state to sessionStorage for mobile refresh retention
  useEffect(() => {
    if (phone) sessionStorage.setItem('novabank_otp_phone', phone);
    if (devOtp) sessionStorage.setItem('novabank_otp_dev', devOtp);
    if (initialUserId) sessionStorage.setItem('novabank_otp_uid', initialUserId);
  }, [phone, devOtp, initialUserId]);

  // Overall OTP expiration timer (5 mins)
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Resend cooldown timer (30s)
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

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

  // Automatically request OTP once ONLY if not provided by registration response
  useEffect(() => {
    if (devOtp) return; // Already have an OTP from registration
    if (!phone) return;
    if (autoRequestedRef.current) return;
    autoRequestedRef.current = true;

    requestOtp(phone)
      .then((res) => {
        if (res.devOtp) {
          setDevOtp(res.devOtp);
          sessionStorage.setItem('novabank_otp_dev', res.devOtp);
        }
      })
      .catch((err) => {
        if (err.status === 429) {
          const retry = err.retryAfter || 60;
          setCountdown429(retry);
          setError(`Too many attempts. Try again in ${retry} seconds.`);
        } else {
          setError(formatApiError(err, 'Failed to request OTP'));
        }
      });
  }, [phone, devOtp]);

  const handleVerify = async () => {
    if (code.length !== 6 || loading) return;
    setError('');
    setLoading(true);
    setAnimStatus('verifying');

    try {
      const res = await verifyOtp(phone, code);
      setAnimStatus('success');

      // Persist temporary token & user id
      if (res.tempToken) sessionStorage.setItem('novabank_otp_token', res.tempToken);
      if (res.userId || initialUserId) sessionStorage.setItem('novabank_otp_uid', res.userId || initialUserId);

      setTimeout(() => {
        navigate('/set-pin', {
          state: {
            phone,
            userId: res.userId || initialUserId,
            tempToken: res.tempToken
          }
        });
      }, 600);
    } catch (err) {
      setAnimStatus('failure');
      if (err.status === 429) {
        const retry = err.retryAfter || 60;
        setCountdown429(retry);
        setError(`Too many attempts. Try again in ${retry} seconds.`);
      } else {
        setError(formatApiError(err, 'Verification failed. Please check the OTP.'));
      }
      setTimeout(() => {
        setAnimStatus('idle');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      const res = await requestOtp(phone);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        sessionStorage.setItem('novabank_otp_dev', res.devOtp);
      }
      setSecondsLeft(300);
      setCooldown(30);
      setCode('');
      setAnimStatus('idle');
    } catch (err) {
      if (err.status === 429) {
        const retry = err.retryAfter || 60;
        setCountdown429(retry);
        setError(`Too many attempts. Try again in ${retry} seconds.`);
      } else {
        setError(formatApiError(err, 'Failed to resend OTP.'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleFillDemo = () => {
    if (devOtp) {
      setCode(devOtp);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
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
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] mb-6 cursor-pointer mx-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Change Phone
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Verify Phone Number
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Enter the 6-digit verification code sent to <br />
            <span className="font-semibold text-[var(--text-main)]">{phone || 'your phone'}</span>
          </p>
        </div>

        {/* Demo OTP Banner */}
        {devOtp && (
          <div
            id="demo-otp-banner"
            onClick={handleFillDemo}
            className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all"
            title="Click to auto-fill demo OTP"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                OTP
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-300 uppercase">
                  Demo SMS Gateway
                </div>
                <div className="text-xs font-mono font-bold text-[var(--text-main)] tracking-widest">
                  {devOtp}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#1b4f9c] dark:text-blue-400 underline">
              Tap to fill
            </span>
          </div>
        )}

        {error && (
          <div
            id="otp-error-message"
            className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="flex flex-col items-center gap-4">
          <OtpVerifyAnimation
            value={code}
            onChange={(val) => {
              setCode(val);
              setError('');
            }}
            onVerify={handleVerify}
            status={animStatus}
            disabled={loading}
            autoFocus={true}
          />

          {/* Timers & Resend */}
          <div className="flex items-center justify-between w-full max-w-xs text-xs px-1">
            <span className="text-[var(--text-muted)]">
              {secondsLeft > 0 ? (
                <>Expires in <span className="font-mono font-semibold text-[var(--text-main)]">{formatTime(secondsLeft)}</span></>
              ) : (
                <span className="text-red-500 font-semibold">Code expired</span>
              )}
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending || loading}
              className="font-semibold text-[#1b4f9c] dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={loading}
            disabled={code.length !== 6 || loading || animStatus === 'verifying'}
            className="w-full max-w-xs mt-3"
          >
            Verify OTP
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md pb-6 text-center text-xs text-[var(--text-muted)]">
        Simulated SMS gateway for testing
      </div>
    </div>
  );
}
