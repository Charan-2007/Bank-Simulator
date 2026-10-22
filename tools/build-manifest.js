import fs from 'node:fs';
import path from 'node:path';

const MANIFEST_PATH = path.resolve('server/data/cards.manifest.json');

export function createManifest() {
  const cards = [
    // ==========================================
    // 1. ABSTRACT (5 video cards) - Font: Orbitron
    // ==========================================
    {
      id: 'abstract-black-hole',
      name: 'Black Hole Monochrome',
      category: 'abstract',
      image: '/media/cards/posters/abstract-black-hole.webp',
      videos: {
        low: '/media/cards/videos/low/abstract-black-hole.mp4',
        mid: '/media/cards/videos/mid/abstract-black-hole.mp4',
        high: '/media/cards/videos/high/abstract-black-hole.mp4',
        max: '/media/cards/videos/max/abstract-black-hole.mp4'
      },
      poster: '/media/cards/posters/abstract-black-hole.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'abstract-golden-crown',
      name: 'Gothic Golden Crown',
      category: 'abstract',
      image: '/media/cards/posters/abstract-golden-crown.webp',
      videos: {
        low: '/media/cards/videos/low/abstract-golden-crown.mp4',
        mid: '/media/cards/videos/mid/abstract-golden-crown.mp4',
        high: '/media/cards/videos/high/abstract-golden-crown.mp4',
        max: '/media/cards/videos/max/abstract-golden-crown.mp4'
      },
      poster: '/media/cards/posters/abstract-golden-crown.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'abstract-silent-blade-samurai',
      name: 'Silent Blade Samurai',
      category: 'abstract',
      image: '/media/cards/posters/abstract-silent-blade-samurai.webp',
      videos: {
        low: '/media/cards/videos/low/abstract-silent-blade-samurai.mp4',
        mid: '/media/cards/videos/mid/abstract-silent-blade-samurai.mp4',
        high: '/media/cards/videos/high/abstract-silent-blade-samurai.mp4',
        max: '/media/cards/videos/max/abstract-silent-blade-samurai.mp4'
      },
      poster: '/media/cards/posters/abstract-silent-blade-samurai.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'abstract-snake-skeleton',
      name: 'Snake Skeleton & Chains',
      category: 'abstract',
      image: '/media/cards/posters/abstract-snake-skeleton.webp',
      videos: {
        low: '/media/cards/videos/low/abstract-snake-skeleton.mp4',
        mid: '/media/cards/videos/mid/abstract-snake-skeleton.mp4',
        high: '/media/cards/videos/high/abstract-snake-skeleton.mp4',
        max: '/media/cards/videos/max/abstract-snake-skeleton.mp4'
      },
      poster: '/media/cards/posters/abstract-snake-skeleton.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'abstract-spiderman-symbiote',
      name: 'Symbiote Monochrome',
      category: 'abstract',
      image: '/media/cards/posters/abstract-spiderman-symbiote.webp',
      videos: {
        low: '/media/cards/videos/low/abstract-spiderman-symbiote.mp4',
        mid: '/media/cards/videos/mid/abstract-spiderman-symbiote.mp4',
        high: '/media/cards/videos/high/abstract-spiderman-symbiote.mp4',
        max: '/media/cards/videos/max/abstract-spiderman-symbiote.mp4'
      },
      poster: '/media/cards/posters/abstract-spiderman-symbiote.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },

    // ==========================================
    // 2. CARS (6 video cards) - Font: Anton
    // ==========================================
    {
      id: 'cars-dodge-challenger-black-panther',
      name: 'Dodge Challenger Black Panther',
      category: 'cars',
      image: '/media/cards/posters/cars-dodge-challenger-black-panther.webp',
      videos: {
        low: '/media/cards/videos/low/cars-dodge-challenger-black-panther.mp4',
        mid: '/media/cards/videos/mid/cars-dodge-challenger-black-panther.mp4',
        high: '/media/cards/videos/high/cars-dodge-challenger-black-panther.mp4',
        max: '/media/cards/videos/max/cars-dodge-challenger-black-panther.mp4'
      },
      poster: '/media/cards/posters/cars-dodge-challenger-black-panther.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'cars-dodge-challenger-shadow-runner',
      name: 'Dodge Challenger Shadow Runner',
      category: 'cars',
      image: '/media/cards/posters/cars-dodge-challenger-shadow-runner.webp',
      videos: {
        low: '/media/cards/videos/low/cars-dodge-challenger-shadow-runner.mp4',
        mid: '/media/cards/videos/mid/cars-dodge-challenger-shadow-runner.mp4',
        high: '/media/cards/videos/high/cars-dodge-challenger-shadow-runner.mp4',
        max: '/media/cards/videos/max/cars-dodge-challenger-shadow-runner.mp4'
      },
      poster: '/media/cards/posters/cars-dodge-challenger-shadow-runner.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'cars-ford-mustang-gt',
      name: 'Ford Mustang GT',
      category: 'cars',
      image: '/media/cards/posters/cars-ford-mustang-gt.webp',
      videos: {
        low: '/media/cards/videos/low/cars-ford-mustang-gt.mp4',
        mid: '/media/cards/videos/mid/cars-ford-mustang-gt.mp4',
        high: '/media/cards/videos/high/cars-ford-mustang-gt.mp4',
        max: '/media/cards/videos/max/cars-ford-mustang-gt.mp4'
      },
      poster: '/media/cards/posters/cars-ford-mustang-gt.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'cars-nsx-gtr-rain',
      name: 'Honda NSX & Nissan GT-R',
      category: 'cars',
      image: '/media/cards/posters/cars-nsx-gtr-rain.webp',
      videos: {
        low: '/media/cards/videos/low/cars-nsx-gtr-rain.mp4',
        mid: '/media/cards/videos/mid/cars-nsx-gtr-rain.mp4',
        high: '/media/cards/videos/high/cars-nsx-gtr-rain.mp4',
        max: '/media/cards/videos/max/cars-nsx-gtr-rain.mp4'
      },
      poster: '/media/cards/posters/cars-nsx-gtr-rain.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'cars-lamborghini',
      name: 'Lamborghini Neon',
      category: 'cars',
      image: '/media/cards/posters/cars-lamborghini.webp',
      videos: {
        low: '/media/cards/videos/low/cars-lamborghini.mp4',
        mid: '/media/cards/videos/mid/cars-lamborghini.mp4',
        high: '/media/cards/videos/high/cars-lamborghini.mp4',
        max: '/media/cards/videos/max/cars-lamborghini.mp4'
      },
      poster: '/media/cards/posters/cars-lamborghini.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'cars-mclaren-765lt-spider',
      name: 'McLaren 765LT Spider',
      category: 'cars',
      image: '/media/cards/posters/cars-mclaren-765lt-spider.webp',
      videos: {
        low: '/media/cards/videos/low/cars-mclaren-765lt-spider.mp4',
        mid: '/media/cards/videos/mid/cars-mclaren-765lt-spider.mp4',
        high: '/media/cards/videos/high/cars-mclaren-765lt-spider.mp4',
        max: '/media/cards/videos/max/cars-mclaren-765lt-spider.mp4'
      },
      poster: '/media/cards/posters/cars-mclaren-765lt-spider.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },

    // ==========================================
    // 3. GAMING (3 video cards) - Fonts: Press Start 2P / Anton
    // ==========================================
    {
      id: 'gaming-minecraft-cherry-blossom',
      name: 'Minecraft Cherry Blossom',
      category: 'gaming',
      image: '/media/cards/posters/gaming-minecraft-cherry-blossom.webp',
      videos: {
        low: '/media/cards/videos/low/gaming-minecraft-cherry-blossom.mp4',
        mid: '/media/cards/videos/mid/gaming-minecraft-cherry-blossom.mp4',
        high: '/media/cards/videos/high/gaming-minecraft-cherry-blossom.mp4',
        max: '/media/cards/videos/max/gaming-minecraft-cherry-blossom.mp4'
      },
      poster: '/media/cards/posters/gaming-minecraft-cherry-blossom.webp',
      fontFamily: '"Press Start 2P", monospace',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      // Placed in top-left and bottom-right to keep text completely away from centered "Grand Theft Auto VI" logo
      id: 'gaming-gta-6',
      name: 'GTA VI Vice City',
      category: 'gaming',
      image: '/media/cards/posters/gaming-gta-6.webp',
      videos: {
        low: '/media/cards/videos/low/gaming-gta-6.mp4',
        mid: '/media/cards/videos/mid/gaming-gta-6.mp4',
        high: '/media/cards/videos/high/gaming-gta-6.mp4',
        max: '/media/cards/videos/max/gaming-gta-6.mp4'
      },
      poster: '/media/cards/posters/gaming-gta-6.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
      letterSpacing: '0.06em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'gaming-minecraft-train-forest',
      name: 'Minecraft Forest Train',
      category: 'gaming',
      image: '/media/cards/posters/gaming-minecraft-train-forest.webp',
      videos: {
        low: '/media/cards/videos/low/gaming-minecraft-train-forest.mp4',
        mid: '/media/cards/videos/mid/gaming-minecraft-train-forest.mp4',
        high: '/media/cards/videos/high/gaming-minecraft-train-forest.mp4',
        max: '/media/cards/videos/max/gaming-minecraft-train-forest.mp4'
      },
      poster: '/media/cards/posters/gaming-minecraft-train-forest.webp',
      fontFamily: '"Press Start 2P", monospace',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },

    // ==========================================
    // 4. ANIME (5 video cards: 4 Naruto + Frieren) - Fonts: Bangers / Cinzel
    // ==========================================
    {
      id: 'anime-itachi-sharingan',
      name: 'Itachi Sharingan',
      category: 'anime',
      image: '/media/cards/posters/anime-itachi-sharingan.webp',
      videos: {
        low: '/media/cards/videos/low/anime-itachi-sharingan.mp4',
        mid: '/media/cards/videos/mid/anime-itachi-sharingan.mp4',
        high: '/media/cards/videos/high/anime-itachi-sharingan.mp4',
        max: '/media/cards/videos/max/anime-itachi-sharingan.mp4'
      },
      poster: '/media/cards/posters/anime-itachi-sharingan.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'anime-itachi-silhouette',
      name: 'Itachi Red Moon Silhouette',
      category: 'anime',
      image: '/media/cards/posters/anime-itachi-silhouette.webp',
      videos: {
        low: '/media/cards/videos/low/anime-itachi-silhouette.mp4',
        mid: '/media/cards/videos/mid/anime-itachi-silhouette.mp4',
        high: '/media/cards/videos/high/anime-itachi-silhouette.mp4',
        max: '/media/cards/videos/max/anime-itachi-silhouette.mp4'
      },
      poster: '/media/cards/posters/anime-itachi-silhouette.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'anime-naruto-sasuke',
      name: 'Naruto & Sasuke Final Valley',
      category: 'anime',
      image: '/media/cards/posters/anime-naruto-sasuke.webp',
      videos: {
        low: '/media/cards/videos/low/anime-naruto-sasuke.mp4',
        mid: '/media/cards/videos/mid/anime-naruto-sasuke.mp4',
        high: '/media/cards/videos/high/anime-naruto-sasuke.mp4',
        max: '/media/cards/videos/max/anime-naruto-sasuke.mp4'
      },
      poster: '/media/cards/posters/anime-naruto-sasuke.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'anime-obito-broken-mask',
      name: 'Obito Broken Mask',
      category: 'anime',
      image: '/media/cards/posters/anime-obito-broken-mask.webp',
      videos: {
        low: '/media/cards/videos/low/anime-obito-broken-mask.mp4',
        mid: '/media/cards/videos/mid/anime-obito-broken-mask.mp4',
        high: '/media/cards/videos/high/anime-obito-broken-mask.mp4',
        max: '/media/cards/videos/max/anime-obito-broken-mask.mp4'
      },
      poster: '/media/cards/posters/anime-obito-broken-mask.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'anime-frieren-eyes',
      name: 'Frieren Beyond Journey',
      category: 'anime',
      image: '/media/cards/posters/anime-frieren-eyes.webp',
      videos: {
        low: '/media/cards/videos/low/anime-frieren-eyes.mp4',
        mid: '/media/cards/videos/mid/anime-frieren-eyes.mp4',
        high: '/media/cards/videos/high/anime-frieren-eyes.mp4',
        max: '/media/cards/videos/max/anime-frieren-eyes.mp4'
      },
      poster: '/media/cards/posters/anime-frieren-eyes.webp',
      fontFamily: 'Cinzel, serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },

    // ==========================================
    // 5. SUPERHEROES (5 video cards: The Batman + 4 Spider Man) - Fonts: Cinzel / Bangers
    // ==========================================
    {
      // Positioned away from center "THE BATMAN" typography
      id: 'superheroes-the-batman',
      name: 'The Batman Monochrome',
      category: 'superheroes',
      image: '/media/cards/posters/superheroes-the-batman.webp',
      videos: {
        low: '/media/cards/videos/low/superheroes-the-batman.mp4',
        mid: '/media/cards/videos/mid/superheroes-the-batman.mp4',
        high: '/media/cards/videos/high/superheroes-the-batman.mp4',
        max: '/media/cards/videos/max/superheroes-the-batman.mp4'
      },
      poster: '/media/cards/posters/superheroes-the-batman.webp',
      fontFamily: 'Cinzel, serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
      letterSpacing: '0.06em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'superheroes-dark-spiderman-neon',
      name: 'Dark Spider-Man Neon',
      category: 'superheroes',
      image: '/media/cards/posters/superheroes-dark-spiderman-neon.webp',
      videos: {
        low: '/media/cards/videos/low/superheroes-dark-spiderman-neon.mp4',
        mid: '/media/cards/videos/mid/superheroes-dark-spiderman-neon.mp4',
        high: '/media/cards/videos/high/superheroes-dark-spiderman-neon.mp4',
        max: '/media/cards/videos/max/superheroes-dark-spiderman-neon.mp4'
      },
      poster: '/media/cards/posters/superheroes-dark-spiderman-neon.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'superheroes-miles-morales-falling',
      name: 'Miles Morales Skyfall',
      category: 'superheroes',
      image: '/media/cards/posters/superheroes-miles-morales-falling.webp',
      videos: {
        low: '/media/cards/videos/low/superheroes-miles-morales-falling.mp4',
        mid: '/media/cards/videos/mid/superheroes-miles-morales-falling.mp4',
        high: '/media/cards/videos/high/superheroes-miles-morales-falling.mp4',
        max: '/media/cards/videos/max/superheroes-miles-morales-falling.mp4'
      },
      poster: '/media/cards/posters/superheroes-miles-morales-falling.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'superheroes-miles-morales-purple-city',
      name: 'Miles Morales Neon City',
      category: 'superheroes',
      image: '/media/cards/posters/superheroes-miles-morales-purple-city.webp',
      videos: {
        low: '/media/cards/videos/low/superheroes-miles-morales-purple-city.mp4',
        mid: '/media/cards/videos/mid/superheroes-miles-morales-purple-city.mp4',
        high: '/media/cards/videos/high/superheroes-miles-morales-purple-city.mp4',
        max: '/media/cards/videos/max/superheroes-miles-morales-purple-city.mp4'
      },
      poster: '/media/cards/posters/superheroes-miles-morales-purple-city.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'superheroes-spider-verse',
      name: 'Spider-Verse Leap',
      category: 'superheroes',
      image: '/media/cards/posters/superheroes-spider-verse.webp',
      videos: {
        low: '/media/cards/videos/low/superheroes-spider-verse.mp4',
        mid: '/media/cards/videos/mid/superheroes-spider-verse.mp4',
        high: '/media/cards/videos/high/superheroes-spider-verse.mp4',
        max: '/media/cards/videos/max/superheroes-spider-verse.mp4'
      },
      poster: '/media/cards/posters/superheroes-spider-verse.webp',
      fontFamily: 'Bangers, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },

    // ==========================================
    // 6. SPORTS LEGENDS (5 still image cards) - Fonts: Bebas Neue / Anton / Orbitron
    // ==========================================
    {
      id: 'sports-cristiano-ronaldo',
      name: 'Cristiano Ronaldo',
      category: 'sports-legends',
      image: '/media/cards/images/sports-cristiano-ronaldo.webp',
      videos: null,
      poster: '/media/cards/images/sports-cristiano-ronaldo.webp',
      fontFamily: '"Bebas Neue", sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'sports-max-verstappen',
      name: 'Max Verstappen',
      category: 'sports-legends',
      image: '/media/cards/images/sports-max-verstappen.webp',
      videos: null,
      poster: '/media/cards/images/sports-max-verstappen.webp',
      fontFamily: 'Anton, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'sports-prabhas',
      name: 'Prabhas',
      category: 'sports-legends',
      image: '/media/cards/images/sports-prabhas.webp',
      videos: null,
      poster: '/media/cards/images/sports-prabhas.webp',
      fontFamily: '"Bebas Neue", sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'sports-rdj',
      name: 'Robert Downey Jr.',
      category: 'sports-legends',
      image: '/media/cards/images/sports-rdj.webp',
      videos: null,
      poster: '/media/cards/images/sports-rdj.webp',
      fontFamily: 'Orbitron, sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    },
    {
      id: 'sports-virat-kohli',
      name: 'Virat Kohli',
      category: 'sports-legends',
      image: '/media/cards/images/sports-virat-kohli.webp',
      videos: null,
      poster: '/media/cards/images/sports-virat-kohli.webp',
      fontFamily: '"Bebas Neue", sans-serif',
      fontFile: null,
      numberFont: 'DM Sans, sans-serif',
      textColor: '#FFFFFF',
      textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.65)',
      letterSpacing: '0.05em',
      textPosition: { bankName: 'top-left', cardNumber: 'bottom-right' },
      objectPosition: 'center center'
    }
  ];

  return { cards };
}

export function writeManifest() {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  const manifest = createManifest();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Manifest successfully written to ${MANIFEST_PATH} with ${manifest.cards.length} cards.`);
  return manifest;
}

if (process.argv[1]?.endsWith('build-manifest.js')) {
  writeManifest();
}
