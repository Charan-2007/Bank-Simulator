import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import DateOfBirthInput from '../components/common/DateOfBirthInput.jsx';
import PhoneInput from '../components/common/PhoneInput.jsx';
import { registerUser } from '../api/auth.js';
import { validateIndianPhone } from '@shared/phoneUtils.js';
import { formatApiError } from '../utils/errorUtils.js';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    nationality: 'Indian'
  });
  const [dobError, setDobError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
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
  }, [countdown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Normalize whitespace in name: collapse multiple spaces and trim
    const normalizedName = formData.name.replace(/\s+/g, ' ').trim();

    if (!normalizedName) {
      setError('Please enter your full name');
      return;
    }

    if (!/^[A-Za-z\s]{2,100}$/.test(normalizedName)) {
      setError('Name must be 2-100 characters containing letters and spaces only');
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }

    if (dobError) {
      setError(dobError);
      return;
    }

    const phoneValidation = validateIndianPhone(formData.phone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Enter a valid Indian mobile number');
      setError(phoneValidation.error || 'Enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: normalizedName,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone,
        nationality: formData.nationality.trim() || 'Indian'
      });

      navigate('/otp-verify', {
        state: {
          phone: formData.phone,
          devOtp: res.devOtp,
          userId: res.user?._id || res.user?.id
        }
      });
    } catch (err) {
      if (err.status === 429) {
        const retry = err.retryAfter || 60;
        setCountdown(retry);
        setError(`Too many attempts. Try again in ${retry} seconds.`);
      } else {
        setError(formatApiError(err, 'Registration failed. Please check your details.'));
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
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">
            Create your account
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Get instant ₹10,000 demo credits to simulate transfers.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Date of Birth (Min. 16 years)
            </label>
            <DateOfBirthInput
              value={formData.dateOfBirth}
              onChange={(iso, isValid, err) => {
                setFormData(prev => ({ ...prev, dateOfBirth: iso }));
                setDobError(isValid ? '' : (err || 'Invalid date'));
              }}
              error={dobError}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(canonical, isValid, digits) => {
                setFormData(prev => ({ ...prev, phone: canonical }));
                if (digits.length === 10 && !isValid) {
                  setPhoneError('Indian mobile number must start with 6, 7, 8, or 9');
                } else {
                  setPhoneError('');
                }
              }}
              error={phoneError}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Nationality (Optional)
            </label>
            <input
              type="text"
              placeholder="Indian"
              value={formData.nationality}
              onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20 text-sm"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={loading}
            className="w-full mt-4"
          >
            Continue
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md pb-6 text-center text-xs text-[var(--text-muted)]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-bold text-[#1b4f9c] dark:text-blue-400 hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
