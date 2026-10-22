import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CardFace from '../components/cards/CardFace.jsx';
import BottomSheet from '../components/common/BottomSheet.jsx';
import AmountInput from '../components/common/AmountInput.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { formatINR } from '../utils/formatCurrency.js';
import { generateIdempotencyKey } from '../utils/idempotency.js';
import { depositMoney, withdrawMoney } from '../api/transfers.js';
import { listTransactions } from '../api/transactions.js';
import { getCards } from '../api/cards.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home({ onNavigateTab }) {
  const { user, refreshUser } = useAuth();

  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  // Deposit Sheet state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmountStr, setDepositAmountStr] = useState('');
  const [depositPaise, setDepositPaise] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositIdempKey, setDepositIdempKey] = useState('');

  // Withdraw Sheet state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [withdrawPaise, setWithdrawPaise] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawIdempKey, setWithdrawIdempKey] = useState('');

  // Load cards manifest
  useEffect(() => {
    getCards().then(data => setCards(data.cards || [])).catch(() => {});
  }, []);

  // Load latest 5 transactions
  const fetchRecentTransactions = useCallback(async () => {
    try {
      setLoadingTxns(true);
      const res = await listTransactions({ limit: 5 });
      setTransactions(res.transactions || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentTransactions();
  }, [fetchRecentTransactions]);

  const activeCard = useMemo(() => {
    if (!cards.length) return null;
    return cards.find(c => c.id === user?.selectedCardId) || cards[0];
  }, [cards, user?.selectedCardId]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Deposit actions
  const openDeposit = () => {
    setDepositAmountStr('');
    setDepositPaise(null);
    setDepositError('');
    setDepositIdempKey(generateIdempotencyKey());
    setDepositOpen(true);
  };

  const handleDepositConfirm = async () => {
    if (!depositPaise || depositPaise <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }
    setDepositLoading(true);
    setDepositError('');
    try {
      await depositMoney({
        amountPaise: depositPaise,
        idempotencyKey: depositIdempKey
      });
      await refreshUser();
      await fetchRecentTransactions();
      setDepositOpen(false);
    } catch (err) {
      setDepositError(err.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  // Withdraw actions
  const openWithdraw = () => {
    setWithdrawAmountStr('');
    setWithdrawPaise(null);
    setWithdrawError('');
    setWithdrawIdempKey(generateIdempotencyKey());
    setWithdrawOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawPaise || withdrawPaise <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }
    if (user?.balancePaise && withdrawPaise > user.balancePaise) {
      setWithdrawError('Amount exceeds available balance');
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError('');
    try {
      await withdrawMoney({
        amountPaise: withdrawPaise,
        idempotencyKey: withdrawIdempKey
      });
      await refreshUser();
      await fetchRecentTransactions();
      setWithdrawOpen(false);
    } catch (err) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 pb-28 pt-2">
      {/* Top Bar / Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {greeting}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
            {user?.name || 'Account Holder'}
          </h1>
        </div>
        <SimulationNotice className="hidden sm:inline-flex" />
      </div>

      {/* Hero Card Preview */}
      {activeCard && (
        <div
          onClick={() => onNavigateTab && onNavigateTab('cards')}
          className="cursor-pointer transition-transform active:scale-[0.99]"
        >
          <CardFace
            card={activeCard}
            cardNumber={user?.demoCardNumber}
            isFocused={true}
            animationSetting={user?.settings?.cardAnimation || 'mid'}
          />
        </div>
      )}

      {/* Available Balance Box */}
      <div className="p-5 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Available Balance
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-main)] font-mono tracking-tight">
            {formatINR(user?.balancePaise ?? 0)}
          </span>
          <span className="text-xs font-mono font-medium text-[var(--text-muted)]">
            {user?.accountNumber || ''}
          </span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('pay')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border)] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1b4f9c] text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[var(--text-main)]">Send</span>
        </button>

        <button
          type="button"
          onClick={openDeposit}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border)] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[var(--text-main)]">Deposit</span>
        </button>

        <button
          type="button"
          onClick={openWithdraw}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border)] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20 12H4" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[var(--text-main)]">Withdraw</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('passbook')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border)] transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[var(--text-main)]">Passbook</span>
        </button>
      </div>

      {/* Recent Transactions Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-main)]">
            Recent Transactions
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('passbook')}
            className="text-xs font-semibold text-[#1b4f9c] dark:text-blue-400 hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>

        {loadingTxns ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            No transactions yet. Try depositing demo money or sending a transfer!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const isIn = tx.type === 'deposit' || tx.type === 'transfer_in';
              return (
                <div
                  key={tx._id}
                  className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isIn ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {isIn ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-main)] capitalize">
                        {tx.type === 'transfer_out' ? `To ${tx.counterpartyName || 'User'}` :
                         tx.type === 'transfer_in' ? `From ${tx.counterpartyName || 'User'}` :
                         tx.type}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${
                      isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isIn ? '+' : '-'}{formatINR(tx.amountPaise)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      Bal: {formatINR(tx.balanceAfterPaise)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit Bottom Sheet (Portal) */}
      <BottomSheet
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="Add Demo Funds"
      >
        <div className="flex flex-col gap-5">
          <p className="text-xs text-[var(--text-muted)]">
            Instant deposit to test banking transfers and balance updates. No real credit card required.
          </p>

          <AmountInput
            value={depositAmountStr}
            onChange={setDepositAmountStr}
            onPaiseChange={setDepositPaise}
            error={depositError}
            disabled={depositLoading}
            maxPaise={5000000} // ₹50,000 max deposit
            quickAmounts={[500, 1000, 5000, 10000]}
          />

          <Button
            size="lg"
            variant="primary"
            onClick={handleDepositConfirm}
            isLoading={depositLoading}
            disabled={!depositPaise || depositPaise <= 0}
            className="w-full"
          >
            Confirm Deposit
          </Button>
        </div>
      </BottomSheet>

      {/* Withdraw Bottom Sheet (Portal) */}
      <BottomSheet
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Withdraw Demo Funds"
      >
        <div className="flex flex-col gap-5">
          <p className="text-xs text-[var(--text-muted)]">
            Simulate a cash withdrawal. This will immediately debit your demo balance.
          </p>

          <AmountInput
            value={withdrawAmountStr}
            onChange={setWithdrawAmountStr}
            onPaiseChange={setWithdrawPaise}
            error={withdrawError}
            disabled={withdrawLoading}
            maxPaise={user?.balancePaise || 0}
            quickAmounts={[500, 1000, 2000, 5000]}
          />

          <Button
            size="lg"
            variant="danger"
            onClick={handleWithdrawConfirm}
            isLoading={withdrawLoading}
            disabled={!withdrawPaise || withdrawPaise <= 0}
            className="w-full"
          >
            Confirm Withdrawal
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
