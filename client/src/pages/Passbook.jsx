import React, { useState, useEffect, useCallback } from 'react';
import BottomSheet from '../components/common/BottomSheet.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Button from '../components/common/Button.jsx';
import { formatINR } from '../utils/formatCurrency.js';
import { listTransactions } from '../api/transactions.js';

export default function Passbook() {
  const [filter, setFilter] = useState('all'); // 'all', 'money_in', 'money_out'
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTxns = useCallback(async (selectedFilter, pageNum, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await listTransactions({
        filter: selectedFilter,
        page: pageNum,
        limit: 15
      });

      const items = res.transactions || [];
      if (append) {
        setTransactions(prev => [...prev, ...items]);
      } else {
        setTransactions(items);
      }

      setHasMore(items.length === 15);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTxns(filter, 1, false);
  }, [filter, fetchTxns]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTxns(filter, nextPage, true);
  };

  const filterButtons = [
    { id: 'all', label: 'All Transactions' },
    { id: 'money_in', label: 'Money In' },
    { id: 'money_out', label: 'Money Out' }
  ];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-5 pb-28 pt-2">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Account Passbook
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Complete ledger of credits, debits and running balances.
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setFilter(btn.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === btn.id
                ? 'bg-[#1b4f9c] text-white shadow-xs'
                : 'bg-[var(--surface-subtle)] text-[var(--text-main)] hover:bg-[var(--border-subtle)] border border-[var(--border)]'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-[var(--text-muted)]">Loading passbook entries...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] p-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[var(--text-main)]">No Transactions Found</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            No entries matching the current filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {transactions.map((tx) => {
            const isIn = tx.type === 'deposit' || tx.type === 'transfer_in';
            return (
              <div
                key={tx._id}
                onClick={() => setSelectedTx(tx)}
                className="p-4 rounded-2xl bg-[var(--surface-subtle)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[#1b4f9c]/40 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                      {tx.type === 'transfer_out' ? `Paid to ${tx.counterpartyName || 'User'}` :
                       tx.type === 'transfer_in' ? `Received from ${tx.counterpartyName || 'User'}` :
                       tx.type === 'deposit' ? 'Added Demo Money' :
                       'Withdrawn Demo Money'}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono">
                      Ref: {tx.referenceId}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-base font-bold font-mono ${
                    isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isIn ? '+' : '-'}{formatINR(tx.amountPaise)}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Bal: {formatINR(tx.balanceAfterPaise)}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <Button
                variant="secondary"
                size="md"
                onClick={handleLoadMore}
                isLoading={loadingMore}
                className="w-full"
              >
                Load More Entries
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Bottom Sheet (Portal) */}
      <BottomSheet
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
      >
        {selectedTx && (
          <div className="flex flex-col gap-5">
            <div className="text-center py-2">
              <div className={`text-3xl font-extrabold font-mono ${
                selectedTx.type === 'deposit' || selectedTx.type === 'transfer_in'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {selectedTx.type === 'deposit' || selectedTx.type === 'transfer_in' ? '+' : '-'}
                {formatINR(selectedTx.amountPaise)}
              </div>
              <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                {selectedTx.status}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Reference ID</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{selectedTx.referenceId}</span>
              </div>
              {selectedTx.transferId && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Transfer ID</span>
                  <span className="font-mono text-[var(--text-main)]">{selectedTx.transferId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Transaction Type</span>
                <span className="capitalize font-semibold text-[var(--text-main)]">
                  {selectedTx.type.replace('_', ' ')}
                </span>
              </div>
              {selectedTx.counterpartyName && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Counterparty</span>
                  <span className="font-semibold text-[var(--text-main)]">{selectedTx.counterpartyName}</span>
                </div>
              )}
              {selectedTx.note && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Note</span>
                  <span className="text-[var(--text-main)]">{selectedTx.note}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Closing Balance</span>
                <span className="font-mono font-bold text-[var(--text-main)]">
                  {formatINR(selectedTx.balanceAfterPaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Timestamp</span>
                <span className="text-[var(--text-main)]">
                  {new Date(selectedTx.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                  })}
                </span>
              </div>
            </div>

            <Button
              size="md"
              variant="secondary"
              onClick={() => setSelectedTx(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
