import React, { useState, useEffect } from 'react';
import AmountInput from '../components/common/AmountInput.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import PinInput from '../components/common/PinInput.jsx';
import { formatINR } from '../utils/formatCurrency.js';
import { generateIdempotencyKey } from '../utils/idempotency.js';
import { lookupRecipient } from '../api/accounts.js';
import { sendTransfer } from '../api/transfers.js';
import { useAuth } from '../context/AuthContext.jsx';
import { normalizeIndianPhone } from '@shared/phoneUtils.js';
import { formatApiError } from '../utils/errorUtils.js';

export default function Send({ initialRecipient = null, onComplete }) {
  const { user, refreshUser } = useAuth();

  // Step 1: Input details, Step 2: Review & PIN, Step 3: Receipt
  const [step, setStep] = useState(1);

  // Form State
  const [recipientInput, setRecipientInput] = useState(initialRecipient?.account || initialRecipient?.phone || '');
  const [resolvedRecipient, setResolvedRecipient] = useState(initialRecipient || null);
  const [amountStr, setAmountStr] = useState('');
  const [amountPaise, setAmountPaise] = useState(null);
  const [note, setNote] = useState('');

  // Flow State
  const [pin, setPin] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');

  // Idempotency: single key per attempt, reused on retry
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  // Receipt details
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (initialRecipient) {
      setRecipientInput(initialRecipient.account || initialRecipient.phone || '');
      setResolvedRecipient(initialRecipient);
    }
  }, [initialRecipient]);

  // Proceed from input to Review
  const handleProceedToReview = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmed = recipientInput.trim();
    if (!trimmed) {
      setError('Please enter a recipient account number or phone number');
      return;
    }

    const inputNormalizedPhone = normalizeIndianPhone(trimmed);
    const senderAcc = user?.accountNumber;
    const senderPhone = user?.phone ? normalizeIndianPhone(user.phone) : null;

    // Block client-side self-transfer only if genuine self match
    if (
      (senderAcc && trimmed.toUpperCase() === senderAcc.toUpperCase()) ||
      (senderPhone && inputNormalizedPhone && senderPhone === inputNormalizedPhone)
    ) {
      setError('Self-transfers are not permitted. You cannot transfer money to yourself.');
      return;
    }

    if (!amountPaise || amountPaise <= 0) {
      setError('Please enter a valid transfer amount');
      return;
    }

    if (user?.balancePaise && amountPaise > user.balancePaise) {
      setError(`Insufficient balance. Your balance is ${formatINR(user.balancePaise)}`);
      return;
    }

    // Lookup recipient name from server
    setLookupLoading(true);
    try {
      const isAccount = trimmed.toUpperCase().startsWith('NB');
      const lookupParams = isAccount
        ? { account: trimmed.toUpperCase() }
        : { phone: inputNormalizedPhone || trimmed };

      const res = await lookupRecipient(lookupParams);
      if (!res.recipient) {
        throw new Error('Recipient account not found');
      }

      // Check self-transfer strictly using non-empty stable IDs or account numbers
      const senderId = String(user?._id || user?.id || '');
      const recipientId = String(res.recipient?.id || res.recipient?._id || '');
      const recipientAcc = String(res.recipient?.accountNumber || '');
      const userAcc = String(user?.accountNumber || '');
      const recipientPhone = res.recipient?.phone ? normalizeIndianPhone(res.recipient.phone) : '';
      const userPhone = user?.phone ? normalizeIndianPhone(user.phone) : '';

      if (
        (senderId && recipientId && senderId === recipientId) ||
        (userAcc && recipientAcc && userAcc.toUpperCase() === recipientAcc.toUpperCase()) ||
        (userPhone && recipientPhone && userPhone === recipientPhone)
      ) {
        throw new Error('Self-transfers are not permitted. You cannot transfer money to yourself.');
      }

      setResolvedRecipient(res.recipient);
      setStep(2); // move to review
    } catch (err) {
      setError(formatApiError(err, 'Recipient not found. Please verify the account number or phone.'));
    } finally {
      setLookupLoading(false);
    }
  };

  // Confirm transfer with PIN
  const handleConfirmTransfer = async (enteredPin) => {
    if (!enteredPin || enteredPin.length !== 6) return;

    setTransferLoading(true);
    setPinError('');

    try {
      const isAccount = Boolean(resolvedRecipient.accountNumber);
      const res = await sendTransfer({
        recipientAccount: isAccount ? resolvedRecipient.accountNumber : undefined,
        recipientPhone: !isAccount ? resolvedRecipient.phone : undefined,
        amountPaise,
        note: note.trim(),
        pin: enteredPin,
        idempotencyKey // Reuses same key on retry
      });

      // Refetch balance from server immediately
      await refreshUser();

      setReceipt({
        referenceId: res.referenceId,
        transferId: res.transferId,
        amountPaise,
        recipientName: resolvedRecipient.name,
        recipientAccount: resolvedRecipient.accountNumber || resolvedRecipient.phone,
        note: note.trim(),
        date: new Date().toISOString()
      });

      setPinModalOpen(false);
      setStep(3); // Receipt screen
      if (onComplete) onComplete();
    } catch (err) {
      setPinError(formatApiError(err, 'Transfer failed'));
    } finally {
      setTransferLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRecipientInput('');
    setResolvedRecipient(null);
    setAmountStr('');
    setAmountPaise(null);
    setNote('');
    setPin('');
    setError('');
    setPinError('');
    setReceipt(null);
    setIdempotencyKey(generateIdempotencyKey()); // New key for new attempt
  };

  // STEP 3: Receipt Screen
  if (step === 3 && receipt) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center p-6 bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-lg my-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-xl font-extrabold text-[var(--text-main)]">Transfer Successful</h2>
        <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2">
          {formatINR(receipt.amountPaise)}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">Paid to {receipt.recipientName}</p>

        <div className="w-full mt-6 p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Reference ID</span>
            <span className="font-mono font-bold text-[var(--text-main)]">{receipt.referenceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Recipient Account</span>
            <span className="font-mono font-medium text-[var(--text-main)]">{receipt.recipientAccount}</span>
          </div>
          {receipt.note && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Note</span>
              <span className="text-[var(--text-main)]">{receipt.note}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Date & Time</span>
            <span className="text-[var(--text-main)]">
              {new Date(receipt.date).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={handleReset}
          className="w-full mt-6"
        >
          Make Another Transfer
        </Button>
      </div>
    );
  }

  // STEP 2: Review Screen
  if (step === 2 && resolvedRecipient) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Edit details
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs flex flex-col gap-5">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Review Transfer</h2>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
            <div className="w-12 h-12 rounded-xl bg-[#1b4f9c]/10 text-[#1b4f9c] flex items-center justify-center font-bold text-lg">
              {resolvedRecipient.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <span>{resolvedRecipient.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                  Verified
                </span>
              </div>
              <div className="text-xs font-mono text-[var(--text-muted)]">
                {resolvedRecipient.accountNumber || resolvedRecipient.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 py-2 border-y border-[var(--border-subtle)]">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-[var(--text-muted)]">Transfer Amount</span>
              <span className="text-2xl font-extrabold text-[#1b4f9c] font-mono">
                {formatINR(amountPaise)}
              </span>
            </div>
            {note && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Note</span>
                <span className="text-[var(--text-main)]">{note}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Fee</span>
              <span className="text-emerald-600 font-semibold">Free (Demo)</span>
            </div>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={() => {
              setPin('');
              setPinError('');
              setPinModalOpen(true);
            }}
            className="w-full"
          >
            Authorize with PIN
          </Button>
        </div>

        {/* PIN Authorization Modal (Portal) */}
        <Modal
          isOpen={pinModalOpen}
          onClose={() => !transferLoading && setPinModalOpen(false)}
          title="Enter 6-Digit Security PIN"
        >
          <div className="flex flex-col items-center gap-5">
            <p className="text-xs text-center text-[var(--text-muted)]">
              Enter your secret PIN to authorize transfer of <br />
              <span className="font-bold text-[#1b4f9c] text-sm font-mono">{formatINR(amountPaise)}</span> to{' '}
              <span className="font-semibold text-[var(--text-main)]">{resolvedRecipient.name}</span>
            </p>

            {pinError && (
              <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
                {pinError}
              </div>
            )}

            <PinInput
              id="transfer-pin-input"
              value={pin}
              onChange={setPin}
              onSubmit={() => handleConfirmTransfer(pin)}
              disabled={transferLoading}
              error={Boolean(pinError)}
              autoFocus={true}
              ariaLabel="Transfer Security PIN"
            />

            <Button
              size="md"
              variant="primary"
              onClick={() => handleConfirmTransfer(pin)}
              isLoading={transferLoading}
              disabled={pin.length !== 6 || transferLoading}
              className="w-full mt-2"
            >
              Confirm Transfer
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // STEP 1: Input details
  return (
    <form onSubmit={handleProceedToReview} className="w-full max-w-md mx-auto flex flex-col gap-5">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Recipient Account Number or Phone
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="NB1234567890 or +919876543210"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20 text-sm font-mono"
          />
        </div>
      </div>

      <AmountInput
        value={amountStr}
        onChange={setAmountStr}
        onPaiseChange={setAmountPaise}
        maxPaise={user?.balancePaise || 5000000}
        quickAmounts={[200, 500, 1000, 2000]}
      />

      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Add a Note (Optional)
        </label>
        <input
          type="text"
          maxLength={200}
          placeholder="e.g. Dinner, rent, project gift"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 focus:outline-none focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20 text-sm"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        variant="primary"
        isLoading={lookupLoading}
        disabled={!recipientInput.trim() || !amountPaise || amountPaise <= 0}
        className="w-full mt-2"
      >
        Continue to Review
      </Button>
    </form>
  );
}
