import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardCatalog from '../components/cards/CardCatalog.jsx';
import SimulationNotice from '../components/common/SimulationNotice.jsx';
import { updateCard } from '../api/accounts.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChooseCard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleSelectCard = async (cardId) => {
    setIsUpdating(true);
    setError('');
    try {
      await updateCard(cardId);
      await refreshUser();
      navigate('/account-created');
    } catch (err) {
      setError(err.message || 'Failed to select card. You can choose one later in Cards.');
      setIsUpdating(false);
    }
  };

  const handleSkip = () => {
    navigate('/account-created');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-[var(--bg)] text-[var(--text-main)]">
      <div className="w-full max-w-4xl mx-auto pt-4 flex flex-col items-center">
        <SimulationNotice />
      </div>

      <div className="w-full max-w-4xl mx-auto my-6 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
              Choose your card design
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Select your personalized virtual card skin. You can switch anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#1b4f9c] dark:text-blue-400 hover:underline self-start sm:self-auto cursor-pointer"
          >
            Skip for now →
          </button>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex-1">
          <CardCatalog
            selectedCardId={user?.selectedCardId}
            onSelectCard={handleSelectCard}
            isUpdating={isUpdating}
            cardNumber={user?.demoCardNumber}
            firstRun={true}
          />
        </div>
      </div>
    </div>
  );
}
