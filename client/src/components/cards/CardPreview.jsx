import React from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import CardFace from './CardFace.jsx';

export default function CardPreview({
  isOpen,
  onClose,
  card,
  cardNumber,
  onSelectCard,
  isSelected = false,
  isUpdating = false,
  animationSetting = 'mid'
}) {
  if (!card) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card.name || 'Card Preview'}>
      <div className="flex flex-col gap-5">
        <div className="w-full">
          <CardFace
            card={card}
            cardNumber={cardNumber}
            isFocused={true}
            animationSetting={animationSetting}
          />
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Category</span>
            <span className="font-semibold capitalize text-[var(--text-main)]">{card.category}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Design Font</span>
            <span className="font-semibold text-[var(--text-main)]">{card.fontFamily?.split(',')[0]}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Animation</span>
            <span className="font-semibold text-[var(--text-main)]">
              {card.videos ? '4K/HD Video' : 'Static Artwork'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSelectCard(card.id)}
            isLoading={isUpdating}
            disabled={isSelected}
            className="flex-1"
          >
            {isSelected ? 'Current Card' : 'Use this card'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
