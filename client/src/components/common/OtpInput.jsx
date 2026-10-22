import React, { useState, useEffect } from 'react';
import PinInput from './PinInput.jsx';

export default function OtpInput({
  devOtp,
  onComplete,
  onResend,
  isResending = false,
  error = false,
  initialSeconds = 300
}) {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [cooldown, setCooldown] = useState(0);

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

  const handleFillDemo = () => {
    if (devOtp) {
      setOtp(devOtp);
      if (onComplete) onComplete(devOtp);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || isResending) return;
    setSecondsLeft(initialSeconds);
    setCooldown(30);
    setOtp('');
    if (onResend) onResend();
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      {/* Demo OTP Banner */}
      {devOtp && (
        <div
          id="demo-otp-banner"
          className="w-full p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-100 flex items-center justify-between gap-3 text-sm shadow-xs"
        >
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600 text-white tracking-wider">
              Demo OTP
            </span>
            <span id="demo-otp-code" className="font-mono font-bold tracking-widest text-base">{devOtp}</span>
          </div>
          <button
            type="button"
            id="fill-otp-button"
            onClick={handleFillDemo}
            className="text-xs font-semibold text-[#1b4f9c] dark:text-blue-400 hover:underline cursor-pointer"
          >
            Fill OTP
          </button>
        </div>
      )}

      {/* 6-box input */}
      <PinInput
        value={otp}
        onChange={setOtp}
        onComplete={onComplete}
        error={error}
        mask={false}
        autoFocus={true}
      />

      {/* Timer & Resend Button with 30s Cooldown Countdown */}
      <div className="flex items-center justify-between w-full text-xs text-[var(--text-muted)] px-1">
        <div>
          {secondsLeft > 0 ? (
            <span>Code expires in <span className="font-semibold text-[var(--text-main)] font-mono">{formatTime(secondsLeft)}</span></span>
          ) : (
            <span className="text-red-500 font-medium">Code expired</span>
          )}
        </div>
        <button
          type="button"
          id="resend-otp-button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="font-medium text-[#1b4f9c] dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
        >
          {isResending ? (
            'Sending...'
          ) : cooldown > 0 ? (
            `Resend Code (${cooldown}s)`
          ) : (
            'Resend Code'
          )}
        </button>
      </div>
    </div>
  );
}
