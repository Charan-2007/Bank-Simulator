import api from './client.js';

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL || '';

function prefixUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function getCards() {
  const data = await api.get('/api/cards');
  const cards = (data.cards || []).map(card => {
    const updated = {
      ...card,
      image: prefixUrl(card.image),
      poster: prefixUrl(card.poster)
    };

    if (card.videos && typeof card.videos === 'object') {
      updated.videos = {
        low: prefixUrl(card.videos.low),
        mid: prefixUrl(card.videos.mid),
        high: prefixUrl(card.videos.high),
        max: prefixUrl(card.videos.max)
      };
    } else if (card.video) {
      updated.video = prefixUrl(card.video);
    }

    return updated;
  });

  return {
    ...data,
    cards
  };
}
