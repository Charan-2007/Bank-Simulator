# NovaBank — Android APK Build & Deployment Guide

This guide details the complete process for building, running, and testing NovaBank as an Android APK via Capacitor.

---

## 1. Prerequisites

To build the APK on your machine:
- **Node.js** (v18+ or v20+) and **npm**
- **Java Development Kit (JDK)**: JDK 17 or JDK 21 (recommended)
  - Verify with `java -version`
- **Android Studio / Android SDK**:
  - `ANDROID_HOME` or `ANDROID_SDK_ROOT` environment variable configured
  - Android SDK Platform-Tools (including `adb`)
  - Android SDK Build-Tools 34+

---

## 2. Project Architecture

The client project lives in `client/` and uses Capacitor 8:
- **Configuration**: `client/capacitor.config.json`
- **Native Android Project**: `client/android/`
- **Permissions**: `client/android/app/src/main/AndroidManifest.xml`
  - `android:usesCleartextTraffic="true"` (enabled for local LAN dev)
  - `android:networkSecurityConfig="@xml/network_security_config"`
  - `<uses-permission android:name="android.permission.INTERNET" />`
  - `<uses-permission android:name="android.permission.CAMERA" />`

---

## 3. Development Modes

### Option A: Live-Reload Over Wi-Fi (Fastest for UI Dev)
1. Ensure your laptop and Android test device (e.g. Vivo V29) are on the **same Wi-Fi network**.
2. Find your laptop's local LAN IP (e.g., `ipconfig` -> `192.168.1.50`).
3. In `client/capacitor.config.json`, add:
   ```json
   "server": {
     "url": "http://192.168.1.50:5173",
     "cleartext": true,
     "androidScheme": "http"
   }
   ```
4. Start the backend: `npm --prefix server run dev` (starts on port 3000).
5. Start the Vite dev server with host listening: `npm --prefix client run dev -- --host 0.0.0.0`.
6. Sync to Android: `cd client && npx cap sync android`.

### Option B: Standalone Production APK (Bundled Web Assets)
1. Build the production web bundle:
   ```bash
   cd client
   npm run build
   ```
2. Sync the bundled `dist/` assets to Android:
   ```bash
   npx cap sync android
   ```
3. Ensure `server.url` is omitted or commented out in `client/capacitor.config.json` so the app loads assets locally from device storage (`android/app/src/main/assets/public/`).

---

## 4. Building the Debug APK with Gradle

From the `client/android` directory:

### On Windows (PowerShell):
```powershell
cd client\android
.\gradlew.bat assembleDebug
```

### On Linux / macOS:
```bash
cd client/android
./gradlew assembleDebug
```

### Generated APK Output Path:
```
client/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Installing and Testing on Device

1. Connect your phone via USB with **USB Debugging** enabled in Developer Options.
2. Verify connection:
   ```bash
   adb devices
   ```
3. Install the APK directly:
   ```bash
   adb install -r client/android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Or open the project in Android Studio:
   ```bash
   cd client
   npx cap open android
   ```
   and click **Run 'app'** (Green Play button).

---

## 6. Android Platform Features Verified

- **Capacitor App**: Hardware back button integration (closes overlays, navigates to Home tab, exits cleanly from Home).
- **Capacitor Haptics**: Light haptic pulse on tab changes and pointer drags.
- **Capacitor Status Bar**: Styled with NovaBank dark blue `#1b4f9c`.
- **Camera Permission**: Automatically requests permission when opening QR Scanner.
