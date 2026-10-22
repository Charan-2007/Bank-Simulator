# NovaBank — Media Pipeline Audit & Verification Report (Phase 0)

*Generated: 2026-10-19T06:36:50.184Z*

## 1. Quality Tiers Overview & Total Sizes

| Tier | Target Resolution | Target FPS | CRF Setting | File Budget Cap | Total Files | Total Size (MB) | CRF Bumps Required |
|---|---|---|---|---|---|---|---|
| **LOW** | 480×302 | 24 fps | CRF 27 | ≤ 1.5 MB | 24 / 24 | **3.01 MB** | 0 (None needed) |
| **MID** | 720×454 | 30 fps | CRF 23 | ≤ 4.0 MB | 24 / 24 | **10.94 MB** | 0 (None needed) |
| **HIGH** | 1080×680 | 30 fps | CRF 21 | ≤ 8.0 MB | 24 / 24 | **28.69 MB** | 0 (None needed) |
| **MAX** | 1440×908 | 30 fps | CRF 19 | ≤ 14.0 MB | 24 / 24 | **62.88 MB** | 0 (None needed) |

**Grand Total Across All 96 Transcoded Videos:** 105.53 MB  
**Result:** 100% of the 96 transcoded video files (24 videos × 4 tiers) are strictly within their file size budget caps.

## 2. Complete 96-File ffprobe Metadata Table

| # | Card ID | Card Name | Tier | Resolution | FPS | Duration | File Size | Bitrate | CRF (Bumped?) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `abstract-black-hole` | Black Hole Monochrome | **low** | 480×302 | 24 fps | 8.00s | 0.07 MB | 67 kbps | CRF 27 (No bump) | ✅ PASS |
| 2 | `abstract-black-hole` | Black Hole Monochrome | **mid** | 720×454 | 30 fps | 8.00s | 0.20 MB | 203 kbps | CRF 23 (No bump) | ✅ PASS |
| 3 | `abstract-black-hole` | Black Hole Monochrome | **high** | 1080×680 | 30 fps | 8.00s | 0.47 MB | 488 kbps | CRF 21 (No bump) | ✅ PASS |
| 4 | `abstract-black-hole` | Black Hole Monochrome | **max** | 1440×908 | 30 fps | 8.00s | 1.04 MB | 1082 kbps | CRF 19 (No bump) | ✅ PASS |
| 5 | `abstract-golden-crown` | Gothic Golden Crown | **low** | 480×302 | 24 fps | 8.00s | 0.07 MB | 71 kbps | CRF 27 (No bump) | ✅ PASS |
| 6 | `abstract-golden-crown` | Gothic Golden Crown | **mid** | 720×454 | 30 fps | 8.00s | 0.29 MB | 305 kbps | CRF 23 (No bump) | ✅ PASS |
| 7 | `abstract-golden-crown` | Gothic Golden Crown | **high** | 1080×680 | 30 fps | 8.00s | 0.84 MB | 878 kbps | CRF 21 (No bump) | ✅ PASS |
| 8 | `abstract-golden-crown` | Gothic Golden Crown | **max** | 1440×908 | 30 fps | 8.00s | 1.77 MB | 1853 kbps | CRF 19 (No bump) | ✅ PASS |
| 9 | `abstract-silent-blade-samurai` | Silent Blade Samurai | **low** | 480×302 | 24 fps | 8.00s | 0.05 MB | 44 kbps | CRF 27 (No bump) | ✅ PASS |
| 10 | `abstract-silent-blade-samurai` | Silent Blade Samurai | **mid** | 720×454 | 30 fps | 8.00s | 0.16 MB | 159 kbps | CRF 23 (No bump) | ✅ PASS |
| 11 | `abstract-silent-blade-samurai` | Silent Blade Samurai | **high** | 1080×680 | 30 fps | 8.00s | 0.38 MB | 390 kbps | CRF 21 (No bump) | ✅ PASS |
| 12 | `abstract-silent-blade-samurai` | Silent Blade Samurai | **max** | 1440×908 | 30 fps | 8.00s | 0.76 MB | 795 kbps | CRF 19 (No bump) | ✅ PASS |
| 13 | `abstract-snake-skeleton` | Snake Skeleton & Chains | **low** | 480×302 | 24 fps | 8.00s | 0.23 MB | 239 kbps | CRF 27 (No bump) | ✅ PASS |
| 14 | `abstract-snake-skeleton` | Snake Skeleton & Chains | **mid** | 720×454 | 30 fps | 8.00s | 0.73 MB | 757 kbps | CRF 23 (No bump) | ✅ PASS |
| 15 | `abstract-snake-skeleton` | Snake Skeleton & Chains | **high** | 1080×680 | 30 fps | 8.00s | 1.62 MB | 1693 kbps | CRF 21 (No bump) | ✅ PASS |
| 16 | `abstract-snake-skeleton` | Snake Skeleton & Chains | **max** | 1440×908 | 30 fps | 8.00s | 3.10 MB | 3247 kbps | CRF 19 (No bump) | ✅ PASS |
| 17 | `abstract-spiderman-symbiote` | Symbiote Monochrome | **low** | 480×302 | 24 fps | 8.00s | 0.11 MB | 116 kbps | CRF 27 (No bump) | ✅ PASS |
| 18 | `abstract-spiderman-symbiote` | Symbiote Monochrome | **mid** | 720×454 | 30 fps | 8.00s | 0.45 MB | 467 kbps | CRF 23 (No bump) | ✅ PASS |
| 19 | `abstract-spiderman-symbiote` | Symbiote Monochrome | **high** | 1080×680 | 30 fps | 8.00s | 1.09 MB | 1143 kbps | CRF 21 (No bump) | ✅ PASS |
| 20 | `abstract-spiderman-symbiote` | Symbiote Monochrome | **max** | 1440×908 | 30 fps | 8.00s | 2.16 MB | 2256 kbps | CRF 19 (No bump) | ✅ PASS |
| 21 | `cars-dodge-challenger-black-panther` | Dodge Challenger Black Panther | **low** | 480×302 | 24 fps | 8.00s | 0.08 MB | 77 kbps | CRF 27 (No bump) | ✅ PASS |
| 22 | `cars-dodge-challenger-black-panther` | Dodge Challenger Black Panther | **mid** | 720×454 | 30 fps | 8.00s | 0.27 MB | 284 kbps | CRF 23 (No bump) | ✅ PASS |
| 23 | `cars-dodge-challenger-black-panther` | Dodge Challenger Black Panther | **high** | 1080×680 | 30 fps | 8.00s | 0.68 MB | 707 kbps | CRF 21 (No bump) | ✅ PASS |
| 24 | `cars-dodge-challenger-black-panther` | Dodge Challenger Black Panther | **max** | 1440×908 | 30 fps | 8.00s | 1.35 MB | 1410 kbps | CRF 19 (No bump) | ✅ PASS |
| 25 | `cars-dodge-challenger-shadow-runner` | Dodge Challenger Shadow Runner | **low** | 480×302 | 24 fps | 7.58s | 0.34 MB | 376 kbps | CRF 27 (No bump) | ✅ PASS |
| 26 | `cars-dodge-challenger-shadow-runner` | Dodge Challenger Shadow Runner | **mid** | 720×454 | 30 fps | 7.60s | 1.08 MB | 1188 kbps | CRF 23 (No bump) | ✅ PASS |
| 27 | `cars-dodge-challenger-shadow-runner` | Dodge Challenger Shadow Runner | **high** | 1080×680 | 30 fps | 7.60s | 2.58 MB | 2845 kbps | CRF 21 (No bump) | ✅ PASS |
| 28 | `cars-dodge-challenger-shadow-runner` | Dodge Challenger Shadow Runner | **max** | 1440×908 | 30 fps | 7.60s | 4.94 MB | 5448 kbps | CRF 19 (No bump) | ✅ PASS |
| 29 | `cars-ford-mustang-gt` | Ford Mustang GT | **low** | 480×302 | 24 fps | 5.92s | 0.12 MB | 161 kbps | CRF 27 (No bump) | ✅ PASS |
| 30 | `cars-ford-mustang-gt` | Ford Mustang GT | **mid** | 720×454 | 30 fps | 5.93s | 0.61 MB | 862 kbps | CRF 23 (No bump) | ✅ PASS |
| 31 | `cars-ford-mustang-gt` | Ford Mustang GT | **high** | 1080×680 | 30 fps | 5.93s | 2.00 MB | 2828 kbps | CRF 21 (No bump) | ✅ PASS |
| 32 | `cars-ford-mustang-gt` | Ford Mustang GT | **max** | 1440×908 | 30 fps | 5.93s | 4.54 MB | 6416 kbps | CRF 19 (No bump) | ✅ PASS |
| 33 | `cars-nsx-gtr-rain` | Honda NSX & Nissan GT-R | **low** | 480×302 | 24 fps | 8.00s | 0.05 MB | 47 kbps | CRF 27 (No bump) | ✅ PASS |
| 34 | `cars-nsx-gtr-rain` | Honda NSX & Nissan GT-R | **mid** | 720×454 | 30 fps | 8.00s | 0.25 MB | 258 kbps | CRF 23 (No bump) | ✅ PASS |
| 35 | `cars-nsx-gtr-rain` | Honda NSX & Nissan GT-R | **high** | 1080×680 | 30 fps | 8.00s | 0.97 MB | 1009 kbps | CRF 21 (No bump) | ✅ PASS |
| 36 | `cars-nsx-gtr-rain` | Honda NSX & Nissan GT-R | **max** | 1440×908 | 30 fps | 8.00s | 2.94 MB | 3077 kbps | CRF 19 (No bump) | ✅ PASS |
| 37 | `cars-lamborghini` | Lamborghini Neon | **low** | 480×302 | 24 fps | 8.00s | 0.08 MB | 85 kbps | CRF 27 (No bump) | ✅ PASS |
| 38 | `cars-lamborghini` | Lamborghini Neon | **mid** | 720×454 | 30 fps | 8.00s | 0.33 MB | 346 kbps | CRF 23 (No bump) | ✅ PASS |
| 39 | `cars-lamborghini` | Lamborghini Neon | **high** | 1080×680 | 30 fps | 8.00s | 0.89 MB | 931 kbps | CRF 21 (No bump) | ✅ PASS |
| 40 | `cars-lamborghini` | Lamborghini Neon | **max** | 1440×908 | 30 fps | 8.00s | 1.91 MB | 1997 kbps | CRF 19 (No bump) | ✅ PASS |
| 41 | `cars-mclaren-765lt-spider` | McLaren 765LT Spider | **low** | 480×302 | 24 fps | 8.00s | 0.05 MB | 49 kbps | CRF 27 (No bump) | ✅ PASS |
| 42 | `cars-mclaren-765lt-spider` | McLaren 765LT Spider | **mid** | 720×454 | 30 fps | 8.00s | 0.18 MB | 186 kbps | CRF 23 (No bump) | ✅ PASS |
| 43 | `cars-mclaren-765lt-spider` | McLaren 765LT Spider | **high** | 1080×680 | 30 fps | 8.00s | 0.45 MB | 472 kbps | CRF 21 (No bump) | ✅ PASS |
| 44 | `cars-mclaren-765lt-spider` | McLaren 765LT Spider | **max** | 1440×908 | 30 fps | 8.00s | 1.04 MB | 1083 kbps | CRF 19 (No bump) | ✅ PASS |
| 45 | `gaming-minecraft-cherry-blossom` | Minecraft Cherry Blossom | **low** | 480×302 | 24 fps | 8.00s | 0.16 MB | 165 kbps | CRF 27 (No bump) | ✅ PASS |
| 46 | `gaming-minecraft-cherry-blossom` | Minecraft Cherry Blossom | **mid** | 720×454 | 30 fps | 8.00s | 0.54 MB | 564 kbps | CRF 23 (No bump) | ✅ PASS |
| 47 | `gaming-minecraft-cherry-blossom` | Minecraft Cherry Blossom | **high** | 1080×680 | 30 fps | 8.00s | 1.23 MB | 1282 kbps | CRF 21 (No bump) | ✅ PASS |
| 48 | `gaming-minecraft-cherry-blossom` | Minecraft Cherry Blossom | **max** | 1440×908 | 30 fps | 8.00s | 2.65 MB | 2779 kbps | CRF 19 (No bump) | ✅ PASS |
| 49 | `gaming-gta-6` | GTA VI Vice City | **low** | 480×302 | 24 fps | 8.00s | 0.19 MB | 196 kbps | CRF 27 (No bump) | ✅ PASS |
| 50 | `gaming-gta-6` | GTA VI Vice City | **mid** | 720×454 | 30 fps | 8.00s | 0.86 MB | 903 kbps | CRF 23 (No bump) | ✅ PASS |
| 51 | `gaming-gta-6` | GTA VI Vice City | **high** | 1080×680 | 30 fps | 8.00s | 2.52 MB | 2636 kbps | CRF 21 (No bump) | ✅ PASS |
| 52 | `gaming-gta-6` | GTA VI Vice City | **max** | 1440×908 | 30 fps | 8.00s | 5.29 MB | 5548 kbps | CRF 19 (No bump) | ✅ PASS |
| 53 | `gaming-minecraft-train-forest` | Minecraft Forest Train | **low** | 480×302 | 24 fps | 8.00s | 0.19 MB | 194 kbps | CRF 27 (No bump) | ✅ PASS |
| 54 | `gaming-minecraft-train-forest` | Minecraft Forest Train | **mid** | 720×454 | 30 fps | 8.00s | 0.74 MB | 777 kbps | CRF 23 (No bump) | ✅ PASS |
| 55 | `gaming-minecraft-train-forest` | Minecraft Forest Train | **high** | 1080×680 | 30 fps | 8.00s | 2.02 MB | 2112 kbps | CRF 21 (No bump) | ✅ PASS |
| 56 | `gaming-minecraft-train-forest` | Minecraft Forest Train | **max** | 1440×908 | 30 fps | 8.00s | 5.23 MB | 5485 kbps | CRF 19 (No bump) | ✅ PASS |
| 57 | `anime-itachi-sharingan` | Itachi Sharingan | **low** | 480×302 | 24 fps | 8.00s | 0.08 MB | 82 kbps | CRF 27 (No bump) | ✅ PASS |
| 58 | `anime-itachi-sharingan` | Itachi Sharingan | **mid** | 720×454 | 30 fps | 8.00s | 0.27 MB | 276 kbps | CRF 23 (No bump) | ✅ PASS |
| 59 | `anime-itachi-sharingan` | Itachi Sharingan | **high** | 1080×680 | 30 fps | 8.00s | 0.78 MB | 814 kbps | CRF 21 (No bump) | ✅ PASS |
| 60 | `anime-itachi-sharingan` | Itachi Sharingan | **max** | 1440×908 | 30 fps | 8.00s | 1.88 MB | 1964 kbps | CRF 19 (No bump) | ✅ PASS |
| 61 | `anime-itachi-silhouette` | Itachi Red Moon Silhouette | **low** | 480×302 | 24 fps | 8.00s | 0.12 MB | 128 kbps | CRF 27 (No bump) | ✅ PASS |
| 62 | `anime-itachi-silhouette` | Itachi Red Moon Silhouette | **mid** | 720×454 | 30 fps | 8.00s | 0.38 MB | 399 kbps | CRF 23 (No bump) | ✅ PASS |
| 63 | `anime-itachi-silhouette` | Itachi Red Moon Silhouette | **high** | 1080×680 | 30 fps | 8.00s | 0.86 MB | 900 kbps | CRF 21 (No bump) | ✅ PASS |
| 64 | `anime-itachi-silhouette` | Itachi Red Moon Silhouette | **max** | 1440×908 | 30 fps | 8.00s | 1.85 MB | 1934 kbps | CRF 19 (No bump) | ✅ PASS |
| 65 | `anime-naruto-sasuke` | Naruto & Sasuke Final Valley | **low** | 480×302 | 24 fps | 8.00s | 0.15 MB | 150 kbps | CRF 27 (No bump) | ✅ PASS |
| 66 | `anime-naruto-sasuke` | Naruto & Sasuke Final Valley | **mid** | 720×454 | 30 fps | 8.00s | 0.51 MB | 528 kbps | CRF 23 (No bump) | ✅ PASS |
| 67 | `anime-naruto-sasuke` | Naruto & Sasuke Final Valley | **high** | 1080×680 | 30 fps | 8.00s | 1.27 MB | 1324 kbps | CRF 21 (No bump) | ✅ PASS |
| 68 | `anime-naruto-sasuke` | Naruto & Sasuke Final Valley | **max** | 1440×908 | 30 fps | 8.00s | 2.57 MB | 2693 kbps | CRF 19 (No bump) | ✅ PASS |
| 69 | `anime-obito-broken-mask` | Obito Broken Mask | **low** | 480×302 | 24 fps | 8.00s | 0.11 MB | 113 kbps | CRF 27 (No bump) | ✅ PASS |
| 70 | `anime-obito-broken-mask` | Obito Broken Mask | **mid** | 720×454 | 30 fps | 8.00s | 0.36 MB | 376 kbps | CRF 23 (No bump) | ✅ PASS |
| 71 | `anime-obito-broken-mask` | Obito Broken Mask | **high** | 1080×680 | 30 fps | 8.00s | 0.97 MB | 1011 kbps | CRF 21 (No bump) | ✅ PASS |
| 72 | `anime-obito-broken-mask` | Obito Broken Mask | **max** | 1440×908 | 30 fps | 8.00s | 2.31 MB | 2419 kbps | CRF 19 (No bump) | ✅ PASS |
| 73 | `anime-frieren-eyes` | Frieren Beyond Journey | **low** | 480×302 | 24 fps | 8.00s | 0.19 MB | 195 kbps | CRF 27 (No bump) | ✅ PASS |
| 74 | `anime-frieren-eyes` | Frieren Beyond Journey | **mid** | 720×454 | 30 fps | 8.00s | 0.63 MB | 661 kbps | CRF 23 (No bump) | ✅ PASS |
| 75 | `anime-frieren-eyes` | Frieren Beyond Journey | **high** | 1080×680 | 30 fps | 8.00s | 1.67 MB | 1749 kbps | CRF 21 (No bump) | ✅ PASS |
| 76 | `anime-frieren-eyes` | Frieren Beyond Journey | **max** | 1440×908 | 30 fps | 8.00s | 3.49 MB | 3658 kbps | CRF 19 (No bump) | ✅ PASS |
| 77 | `superheroes-the-batman` | The Batman Monochrome | **low** | 480×302 | 24 fps | 8.00s | 0.06 MB | 56 kbps | CRF 27 (No bump) | ✅ PASS |
| 78 | `superheroes-the-batman` | The Batman Monochrome | **mid** | 720×454 | 30 fps | 8.00s | 0.27 MB | 276 kbps | CRF 23 (No bump) | ✅ PASS |
| 79 | `superheroes-the-batman` | The Batman Monochrome | **high** | 1080×680 | 30 fps | 8.00s | 0.85 MB | 891 kbps | CRF 21 (No bump) | ✅ PASS |
| 80 | `superheroes-the-batman` | The Batman Monochrome | **max** | 1440×908 | 30 fps | 8.00s | 2.11 MB | 2210 kbps | CRF 19 (No bump) | ✅ PASS |
| 81 | `superheroes-dark-spiderman-neon` | Dark Spider-Man Neon | **low** | 480×302 | 24 fps | 8.00s | 0.05 MB | 52 kbps | CRF 27 (No bump) | ✅ PASS |
| 82 | `superheroes-dark-spiderman-neon` | Dark Spider-Man Neon | **mid** | 720×454 | 30 fps | 8.00s | 0.19 MB | 198 kbps | CRF 23 (No bump) | ✅ PASS |
| 83 | `superheroes-dark-spiderman-neon` | Dark Spider-Man Neon | **high** | 1080×680 | 30 fps | 8.00s | 0.54 MB | 566 kbps | CRF 21 (No bump) | ✅ PASS |
| 84 | `superheroes-dark-spiderman-neon` | Dark Spider-Man Neon | **max** | 1440×908 | 30 fps | 8.00s | 1.20 MB | 1257 kbps | CRF 19 (No bump) | ✅ PASS |
| 85 | `superheroes-miles-morales-falling` | Miles Morales Skyfall | **low** | 480×302 | 24 fps | 8.00s | 0.05 MB | 53 kbps | CRF 27 (No bump) | ✅ PASS |
| 86 | `superheroes-miles-morales-falling` | Miles Morales Skyfall | **mid** | 720×454 | 30 fps | 8.00s | 0.17 MB | 179 kbps | CRF 23 (No bump) | ✅ PASS |
| 87 | `superheroes-miles-morales-falling` | Miles Morales Skyfall | **high** | 1080×680 | 30 fps | 8.00s | 0.44 MB | 460 kbps | CRF 21 (No bump) | ✅ PASS |
| 88 | `superheroes-miles-morales-falling` | Miles Morales Skyfall | **max** | 1440×908 | 30 fps | 8.00s | 1.02 MB | 1061 kbps | CRF 19 (No bump) | ✅ PASS |
| 89 | `superheroes-miles-morales-purple-city` | Miles Morales Neon City | **low** | 480×302 | 24 fps | 8.00s | 0.20 MB | 201 kbps | CRF 27 (No bump) | ✅ PASS |
| 90 | `superheroes-miles-morales-purple-city` | Miles Morales Neon City | **mid** | 720×454 | 30 fps | 8.00s | 0.77 MB | 808 kbps | CRF 23 (No bump) | ✅ PASS |
| 91 | `superheroes-miles-morales-purple-city` | Miles Morales Neon City | **high** | 1080×680 | 30 fps | 8.00s | 2.02 MB | 2113 kbps | CRF 21 (No bump) | ✅ PASS |
| 92 | `superheroes-miles-morales-purple-city` | Miles Morales Neon City | **max** | 1440×908 | 30 fps | 8.00s | 4.65 MB | 4867 kbps | CRF 19 (No bump) | ✅ PASS |
| 93 | `superheroes-spider-verse` | Spider-Verse Leap | **low** | 480×302 | 24 fps | 8.00s | 0.22 MB | 232 kbps | CRF 27 (No bump) | ✅ PASS |
| 94 | `superheroes-spider-verse` | Spider-Verse Leap | **mid** | 720×454 | 30 fps | 8.00s | 0.68 MB | 714 kbps | CRF 23 (No bump) | ✅ PASS |
| 95 | `superheroes-spider-verse` | Spider-Verse Leap | **high** | 1080×680 | 30 fps | 8.00s | 1.56 MB | 1631 kbps | CRF 21 (No bump) | ✅ PASS |
| 96 | `superheroes-spider-verse` | Spider-Verse Leap | **max** | 1440×908 | 30 fps | 8.00s | 3.09 MB | 3238 kbps | CRF 19 (No bump) | ✅ PASS |

## 3. Frame Difference Verification (Active Motion Check)

To prove videos are not frozen and feature active animations, 3 frames were extracted from the `mid` tier at 1s, 4s, and 7s and compared via PSNR and byte diff:

| Card Name | Card ID | 1s vs 4s PSNR | 4s vs 7s PSNR | Byte Check | Active Animation? |
|---|---|---|---|---|---|
| Honda NSX rain | `cars-nsx-gtr-rain` | **36.654394 dB** | **36.435689 dB** | Distinct | ✅ YES (Active) |
| Lamborghini Neon | `cars-lamborghini` | **34.354004 dB** | **33.208048 dB** | Distinct | ✅ YES (Active) |
| Gothic Golden Crown | `abstract-golden-crown` | **23.554270 dB** | **23.363420 dB** | Distinct | ✅ YES (Active) |
| Miles Morales Neon City | `superheroes-miles-morales-purple-city` | **22.689102 dB** | **19.077211 dB** | Distinct | ✅ YES (Active) |

> Note: Finite PSNR (19–37 dB) and differing image bytes confirm active movement across timestamps.

## 4. Visual Comparison Composites

Generated vertical comparison composites in `docs/` illustrating Original Uncropped Source vs Max Tier vs Low Tier:

1. **Ultrawide Video:** `docs/comparison-ultrawide.webp` — Spider-Man Into the Spider-Verse
2. **4K Video:** `docs/comparison-4k.webp` — Itachi Sharingan (Naruto 3840×2160 source)
3. **Supercar Video:** `docs/comparison-car.webp` — Dodge Challenger Black Panther

## 5. Poster Extraction & Quality Checks (24 items)

Every video had a 1080px wide WebP poster extracted at **30% duration (2.4s)** into `server/public/media/cards/posters/<id>.webp`.

| # | Poster File | Resolution | File Size | Blank/Black Check | Status |
|---|---|---|---|---|---|
| 1 | `abstract-black-hole.webp` | 1080×680 | 45.9 KB | CLEAN & VIVID | ✅ PASS |
| 2 | `abstract-golden-crown.webp` | 1080×680 | 38.7 KB | CLEAN & VIVID | ✅ PASS |
| 3 | `abstract-silent-blade-samurai.webp` | 1080×680 | 21.8 KB | CLEAN & VIVID | ✅ PASS |
| 4 | `abstract-snake-skeleton.webp` | 1080×680 | 72.5 KB | CLEAN & VIVID | ✅ PASS |
| 5 | `abstract-spiderman-symbiote.webp` | 1080×680 | 44.0 KB | CLEAN & VIVID | ✅ PASS |
| 6 | `cars-dodge-challenger-black-panther.webp` | 1080×680 | 48.7 KB | CLEAN & VIVID | ✅ PASS |
| 7 | `cars-dodge-challenger-shadow-runner.webp` | 1080×680 | 37.7 KB | CLEAN & VIVID | ✅ PASS |
| 8 | `cars-ford-mustang-gt.webp` | 1080×680 | 116.4 KB | CLEAN & VIVID | ✅ PASS |
| 9 | `cars-nsx-gtr-rain.webp` | 1080×680 | 47.2 KB | CLEAN & VIVID | ✅ PASS |
| 10 | `cars-lamborghini.webp` | 1080×680 | 60.2 KB | CLEAN & VIVID | ✅ PASS |
| 11 | `cars-mclaren-765lt-spider.webp` | 1080×680 | 107.3 KB | CLEAN & VIVID | ✅ PASS |
| 12 | `gaming-minecraft-cherry-blossom.webp` | 1080×680 | 114.1 KB | CLEAN & VIVID | ✅ PASS |
| 13 | `gaming-gta-6.webp` | 1080×680 | 140.3 KB | CLEAN & VIVID | ✅ PASS |
| 14 | `gaming-minecraft-train-forest.webp` | 1080×680 | 74.7 KB | CLEAN & VIVID | ✅ PASS |
| 15 | `anime-itachi-sharingan.webp` | 1080×680 | 68.6 KB | CLEAN & VIVID | ✅ PASS |
| 16 | `anime-itachi-silhouette.webp` | 1080×680 | 65.3 KB | CLEAN & VIVID | ✅ PASS |
| 17 | `anime-naruto-sasuke.webp` | 1080×680 | 65.8 KB | CLEAN & VIVID | ✅ PASS |
| 18 | `anime-obito-broken-mask.webp` | 1080×680 | 50.5 KB | CLEAN & VIVID | ✅ PASS |
| 19 | `anime-frieren-eyes.webp` | 1080×680 | 63.0 KB | CLEAN & VIVID | ✅ PASS |
| 20 | `superheroes-the-batman.webp` | 1080×680 | 20.3 KB | CLEAN & VIVID | ✅ PASS |
| 21 | `superheroes-dark-spiderman-neon.webp` | 1080×680 | 15.0 KB | CLEAN & VIVID | ✅ PASS |
| 22 | `superheroes-miles-morales-falling.webp` | 1080×680 | 38.6 KB | CLEAN & VIVID | ✅ PASS |
| 23 | `superheroes-miles-morales-purple-city.webp` | 1080×680 | 78.0 KB | CLEAN & VIVID | ✅ PASS |
| 24 | `superheroes-spider-verse.webp` | 1080×680 | 127.6 KB | CLEAN & VIVID | ✅ PASS |

> **Contact Sheet:** `docs/posters-contact-sheet.webp` (1920×804, 4 rows × 6 cards).

## 6. Processed Card Images (5 items) & Chip Audit

| # | Card Name | Output File | Dimensions | WebP Size | Chip Found? |
|---|---|---|---|---|---|
| 1 | Cristiano Ronaldo | `sports-cristiano-ronaldo.webp` | 1080×680 (1.586:1) | 7.1 KB | **NONE (Confirmed)** |
| 2 | Max Verstappen | `sports-max-verstappen.webp` | 1080×680 (1.586:1) | 46.0 KB | **NONE (Confirmed)** |
| 3 | Prabhas | `sports-prabhas.webp` | 1080×680 (1.586:1) | 81.7 KB | **NONE (Confirmed)** |
| 4 | Robert Downey Jr. | `sports-rdj.webp` | 1080×680 (1.586:1) | 63.0 KB | **NONE (Confirmed)** |
| 5 | Virat Kohli | `sports-virat-kohli.webp` | 1080×680 (1.586:1) | 61.6 KB | **NONE (Confirmed)** |

> **Chip Verification Result:** All 5 card images visually verified. 0 physical or baked chip symbols found. No chips are displayed on any card face.
> **Contact Sheet:** `docs/images-contact-sheet.webp` (5 cards horizontal stack).

## 7. Disk Path Verification: `D:\Bank Simulation\Cards\Images`

- **Path Checked:** `D:\Bank Simulation\Cards\Images`
- **Path Existence:** **DOES NOT EXIST (`False`)**
- **Parent Directory `D:\Bank Simulation` Existence:** **DOES NOT EXIST (`False`)**
- **Active Source:** All 24 source videos and 5 GOAT's images reside exclusively in `D:\Bank Simulator\Cards\`.

## 8. Category Mapping & Fallback Fonts

| Category ID | Display Name | Card Count | Fallback Font (@fontsource) | Artwork Types |
|---|---|---|---|---|
| `abstract` | Abstract Art | 5 | `@fontsource/orbitron` | 4-Tier Video + Poster |
| `cars` | Supercars & Drift | 6 | `@fontsource/anton` | 4-Tier Video + Poster |
| `gaming` | Gaming Worlds | 3 | `@fontsource/press-start-2p` | 4-Tier Video + Poster |
| `anime` | Anime | 5 | `@fontsource/bangers` | 4-Tier Video + Poster |
| `superheroes` | Superheroes | 5 | `@fontsource/bangers` | 4-Tier Video + Poster |
| `sports-legends` | Sports Legends | 5 | `@fontsource/bebas-neue` | 1080px WebP Still Image |

