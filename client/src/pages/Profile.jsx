import React, { useState } from 'react';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import PinInput from '../components/common/PinInput.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useGlass } from '../context/GlassContext.jsx';
import { updateSettings } from '../api/accounts.js';
import { changePin } from '../api/auth.js';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { glassMode, setGlassMode } = useGlass();

  // Settings
  const [reducedMotion, setReducedMotion] = useState(
    () => user?.settings?.reducedMotion ?? false
  );
  const [cardAnimation, setCardAnimation] = useState(
    () => user?.settings?.cardAnimation ?? 'mid'
  );
  const [haptics, setHaptics] = useState(
    () => user?.settings?.haptics ?? true
  );

  // Change PIN modal state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState(1); // 1: current, 2: new, 3: confirm
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Persist settings to backend
  const handleSettingChange = async (updates) => {
    try {
      const merged = {
        theme: updates.theme ?? theme,
        glassEffect: updates.glassMode ?? glassMode,
        reducedMotion: updates.reducedMotion ?? reducedMotion,
        cardAnimation: updates.cardAnimation ?? cardAnimation,
        haptics: updates.haptics ?? haptics
      };
      await updateSettings(merged);
      updateUser({ settings: merged });
    } catch (e) {
      console.warn('Failed to save settings to server:', e);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleSettingChange({ theme: newTheme });
  };

  const handleGlassChange = (newGlass) => {
    setGlassMode(newGlass);
    handleSettingChange({ glassMode: newGlass });
  };

  const handleAnimationChange = (newTier) => {
    setCardAnimation(newTier);
    handleSettingChange({ cardAnimation: newTier });
  };

  const handleMotionToggle = (e) => {
    const val = e.target.checked;
    setReducedMotion(val);
    if (val) {
      setCardAnimation('off');
      handleSettingChange({ reducedMotion: val, cardAnimation: 'off' });
    } else {
      handleSettingChange({ reducedMotion: val });
    }
  };

  const handleHapticsToggle = (e) => {
    const val = e.target.checked;
    setHaptics(val);
    handleSettingChange({ haptics: val });
  };

  // Change PIN Submit
  const handleCurrentPinComplete = (pin) => {
    setCurrentPin(pin);
    setPinError('');
    setPinStep(2);
  };

  const handleNewPinComplete = (pin) => {
    setNewPin(pin);
    setPinError('');
    setPinStep(3);
  };

  const handleConfirmPinComplete = async (pin) => {
    setConfirmPin(pin);
    setPinError('');

    if (pin !== newPin) {
      setPinError('New PIN and Confirm PIN do not match');
      return;
    }

    setPinLoading(true);
    try {
      await changePin({
        currentPin,
        newPin,
        confirmPin: pin
      });
      setPinSuccess('PIN updated successfully!');
      setTimeout(() => {
        setPinModalOpen(false);
        setPinStep(1);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinSuccess('');
      }, 1500);
    } catch (err) {
      setPinError(err.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const openChangePin = () => {
    setPinStep(1);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setPinSuccess('');
    setPinModalOpen(true);
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pb-28 pt-2">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Account & Settings
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manage your personal details, security credentials, and app preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1b4f9c] text-white flex items-center justify-center font-bold text-xl shadow-sm">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-[var(--text-main)] truncate">
            {user?.name || 'Account Holder'}
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)]">
            {user?.phone}
          </div>
          <div className="text-xs font-mono font-semibold text-[#1b4f9c] mt-0.5">
            {user?.accountNumber}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="p-5 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs flex flex-col gap-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          App Preferences
        </h2>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Theme</div>
            <div className="text-xs text-[var(--text-muted)]">Light, Dark or System default</div>
          </div>
          <div className="flex rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)] text-xs">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleThemeChange(t)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  theme === t
                    ? 'bg-[#1b4f9c] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Glass Effect */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Glass Navigation</div>
            <div className="text-xs text-[var(--text-muted)]">Liquid glass blur level</div>
          </div>
          <div className="flex rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)] text-xs">
            {['auto', 'full', 'lite', 'off'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGlassChange(g)}
                className={`px-2 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  glassMode === g
                    ? 'bg-[#1b4f9c] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Card Animation Quality Tier */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Card Animation</div>
            <div className="text-xs text-[var(--text-muted)]">Video quality tiers (Off = poster)</div>
          </div>
          <div className="flex rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)] text-xs">
            {['off', 'low', 'mid', 'high', 'max'].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => handleAnimationChange(tier)}
                className={`px-2 py-1 rounded-lg uppercase text-[11px] font-bold transition-colors cursor-pointer ${
                  cardAnimation === tier
                    ? 'bg-[#1b4f9c] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Reduced Motion</div>
            <div className="text-xs text-[var(--text-muted)]">Disable springs and auto-play videos</div>
          </div>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={handleMotionToggle}
            className="w-5 h-5 rounded text-[#1b4f9c] cursor-pointer"
          />
        </div>

        {/* Haptics Toggle */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Haptic Feedback</div>
            <div className="text-xs text-[var(--text-muted)]">Vibration on navigation & gestures (Android)</div>
          </div>
          <input
            type="checkbox"
            checked={haptics}
            onChange={handleHapticsToggle}
            className="w-5 h-5 rounded text-[#1b4f9c] cursor-pointer"
          />
        </div>
      </div>

      {/* Security Section */}
      <div className="p-5 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Security & Credentials
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-main)]">Transaction PIN</div>
            <div className="text-xs text-[var(--text-muted)]">6-digit authorization code</div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={openChangePin}
          >
            Change PIN
          </Button>
        </div>
      </div>

      {/* Actions: Logout */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="danger"
          onClick={logout}
          className="w-full"
        >
          Sign Out of Account
        </Button>

        <div className="text-center pt-2">
          <SimulationNotice />
        </div>
      </div>

      {/* Change PIN Modal (Portal) */}
      <Modal
        isOpen={pinModalOpen}
        onClose={() => !pinLoading && setPinModalOpen(false)}
        title="Change Security PIN"
      >
        <div className="flex flex-col items-center gap-5">
          {pinSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 text-sm font-bold text-center">
              {pinSuccess}
            </div>
          ) : (
            <>
              <p className="text-xs text-center text-[var(--text-muted)]">
                {pinStep === 1 && 'Enter your current 6-digit PIN'}
                {pinStep === 2 && 'Enter your new 6-digit PIN'}
                {pinStep === 3 && 'Re-enter your new 6-digit PIN to confirm'}
              </p>

              {pinError && (
                <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium text-center">
                  {pinError}
                </div>
              )}

              {pinStep === 1 && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <PinInput
                    key="step-curr"
                    value={currentPin}
                    onChange={setCurrentPin}
                    onSubmit={() => currentPin.length === 6 && handleCurrentPinComplete(currentPin)}
                    autoFocus={true}
                    ariaLabel="Current PIN"
                  />
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => handleCurrentPinComplete(currentPin)}
                    disabled={currentPin.length !== 6}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {pinStep === 2 && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <PinInput
                    key="step-new"
                    value={newPin}
                    onChange={setNewPin}
                    onSubmit={() => newPin.length === 6 && handleNewPinComplete(newPin)}
                    autoFocus={true}
                    ariaLabel="New PIN"
                  />
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => handleNewPinComplete(newPin)}
                    disabled={newPin.length !== 6}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {pinStep === 3 && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <PinInput
                    key="step-conf"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    onSubmit={() => confirmPin.length === 6 && confirmPin === newPin && handleConfirmPinComplete(confirmPin)}
                    disabled={pinLoading}
                    autoFocus={true}
                    error={confirmPin.length === 6 && confirmPin !== newPin}
                    ariaLabel="Confirm New PIN"
                  />
                  {confirmPin.length > 0 && (
                    <div className="text-xs font-medium">
                      {confirmPin === newPin ? (
                        <span className="text-emerald-500">PINs match</span>
                      ) : (
                        <span className="text-amber-500">PINs do not match</span>
                      )}
                    </div>
                  )}
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => handleConfirmPinComplete(confirmPin)}
                    isLoading={pinLoading}
                    disabled={confirmPin.length !== 6 || confirmPin !== newPin || pinLoading}
                    className="w-full"
                  >
                    Update PIN
                  </Button>
                </div>
              )}

              {pinStep > 1 && (
                <button
                  type="button"
                  onClick={() => setPinStep(prev => prev - 1)}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  ← Go back
                </button>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
