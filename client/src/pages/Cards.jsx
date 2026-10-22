import React, { useState, useEffect, useRef } from 'react';
import CardCarousel from '../components/cards/CardCarousel.jsx';
import CardCatalog from '../components/cards/CardCatalog.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { getCards } from '../api/cards.js';
import { updateCard } from '../api/accounts.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Cards() {
  const { user, refreshUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const catalogRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    getCards()
      .then((data) => {
        if (isMounted) {
          setCards(data.cards || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load cards:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectCard = async (cardId) => {
    setUpdating(true);
    try {
      await updateCard(cardId);
      await refreshUser();
    } catch (err) {
      console.error('Failed to update card:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleScrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-[var(--text-muted)]">Loading virtual cards...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg lg:max-w-4xl mx-auto flex flex-col gap-10 pb-28 pt-2">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Virtual Card Studio
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Customize your card artwork with high-definition video loops and anime/gaming themes.
        </p>
      </div>

      {/* Hero Carousel */}
      <CardCarousel
        cards={cards}
        activeCardId={user?.selectedCardId}
        cardNumber={user?.demoCardNumber}
        animationSetting={user?.settings?.cardAnimation || 'mid'}
        onOpenCatalog={handleScrollToCatalog}
        onSelectCard={handleSelectCard}
      />

      {/* Catalog Section */}
      <div ref={catalogRef} className="pt-4 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">
            Explore All Designs
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Tap any card design to preview in full screen and set as your active card.
          </p>
        </div>

        <CardCatalog
          cards={cards}
          selectedCardId={user?.selectedCardId}
          onSelectCard={handleSelectCard}
          isUpdating={updating}
          cardNumber={user?.demoCardNumber}
        />
      </div>
    </div>
  );
}
