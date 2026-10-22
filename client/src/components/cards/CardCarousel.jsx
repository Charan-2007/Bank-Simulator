import React, { useState } from 'react';
import CardFace from './CardFace.jsx';
import Button from '../common/Button.jsx';

export default function CardCarousel({
  cards = [],
  activeCardId,
  cardNumber,
  animationSetting = 'mid',
  glassMode = 'auto',
  onOpenCatalog,
  onSelectCard
}) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = cards.findIndex(c => c.id === activeCardId);
    return idx !== -1 ? idx : 0;
  });

  const activeCard = cards[currentIndex] || cards[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  if (!activeCard) return null;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full max-w-md relative group">
        <CardFace
          card={activeCard}
          cardNumber={cardNumber}
          isFocused={true}
          animationSetting={animationSetting}
          glassMode={glassMode}
        />

        {/* Carousel arrows */}
        {cards.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous card design"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next card design"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Card Info & Actions */}
      <div className="w-full max-w-md flex items-center justify-between px-2">
        <div>
          <h2 className="text-base font-bold text-[var(--text-main)]">{activeCard.name}</h2>
          <p className="text-xs text-[var(--text-muted)] capitalize">{activeCard.category} Series</p>
        </div>

        <div className="flex items-center gap-2">
          {activeCard.id !== activeCardId ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSelectCard(activeCard.id)}
            >
              Set as Active
            </Button>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Card
            </span>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenCatalog}
          >
            Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
