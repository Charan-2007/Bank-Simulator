import React, { useState, useMemo, useEffect } from 'react';
import CardPreview from './CardPreview.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { getCards } from '../../api/cards.js';

export default function CardCatalog({
  cards: propCards,
  selectedCardId,
  onSelectCard,
  isUpdating = false,
  cardNumber,
  firstRun = false
}) {
  const [cards, setCards] = useState(propCards || []);
  const [loading, setLoading] = useState(!propCards || propCards.length === 0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewCard, setPreviewCard] = useState(null);

  useEffect(() => {
    if (propCards && propCards.length > 0) {
      setCards(propCards);
      setLoading(false);
      return;
    }

    let isMounted = true;
    getCards()
      .then((data) => {
        if (isMounted) {
          setCards(data.cards || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load cards manifest:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propCards]);

  // Only cards with artwork (image, poster, or videos)
  const populatedCards = useMemo(() => {
    return cards.filter(c => Boolean(c.poster || c.image || c.videos || c.video));
  }, [cards]);

  // Categories with at least one populated card
  const availableCategories = useMemo(() => {
    const cats = new Set();
    populatedCards.forEach(c => {
      if (c.category) cats.add(c.category.toLowerCase());
    });
    return ['all', ...Array.from(cats)];
  }, [populatedCards]);

  // Filtered cards
  const displayCards = useMemo(() => {
    if (activeCategory === 'all') return populatedCards;
    return populatedCards.filter(c => c.category?.toLowerCase() === activeCategory);
  }, [populatedCards, activeCategory]);

  const handleCardClick = (card) => {
    setPreviewCard(card);
  };

  const handleConfirmSelect = async (cardId) => {
    if (onSelectCard) {
      await onSelectCard(cardId);
      setPreviewCard(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-[var(--text-muted)]">Loading exclusive card designs...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Category filter pills - only populated categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#1b4f9c] text-white shadow-sm'
                : 'bg-[var(--surface-subtle)] text-[var(--text-main)] hover:bg-[var(--border-subtle)] border border-[var(--border)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {displayCards.map((card) => {
          const isSelected = card.id === selectedCardId;
          const poster = card.poster || card.image;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? 'border-[#1b4f9c] ring-4 ring-[#1b4f9c]/20 shadow-lg'
                  : 'border-[var(--border)] hover:border-[#1b4f9c]/50 hover:shadow-md'
              }`}
              style={{ aspectRatio: '1.586 / 1' }}
            >
              {poster && (
                <img
                  src={poster}
                  alt={card.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-white tracking-wider">
                    NovaBank
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b4f9c] text-white uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-bold text-white truncate drop-shadow">
                    {card.name}
                  </div>
                  <div className="text-[10px] text-white/70 capitalize">
                    {card.category} {card.videos ? '• Video' : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      <CardPreview
        isOpen={Boolean(previewCard)}
        onClose={() => setPreviewCard(null)}
        card={previewCard}
        cardNumber={cardNumber}
        onSelectCard={handleConfirmSelect}
        isSelected={previewCard?.id === selectedCardId}
        isUpdating={isUpdating}
      />
    </div>
  );
}
