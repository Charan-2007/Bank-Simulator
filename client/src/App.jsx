import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { GlassProvider } from './context/GlassContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppShell from './components/layout/AppShell.jsx';

// Pages
import Welcome from './pages/Welcome.jsx';
import Register from './pages/Register.jsx';
import OtpVerify from './pages/OtpVerify.jsx';
import SetPin from './pages/SetPin.jsx';
import ChooseCard from './pages/ChooseCard.jsx';
import AccountCreated from './pages/AccountCreated.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Cards from './pages/Cards.jsx';
import Pay from './pages/Pay.jsx';
import Passbook from './pages/Passbook.jsx';
import Profile from './pages/Profile.jsx';
import GlassTest from './pages/dev/GlassTest.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';
import WakeUpBanner from './components/common/WakeUpBanner.jsx';
import { initBackgroundHealthCheck } from './api/client.js';

const TAB_INDEX_MAP = {
  home: 0,
  cards: 1,
  pay: 2,
  passbook: 3,
  profile: 4
};

function MainSections() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let handle;
      CapApp.addListener('backButton', () => {
        // If modal or sheet is open, let its keydown listener or close handler deal with it
        // Otherwise: if not on Home, go to Home. If on Home, exit app.
        setActiveTab((prev) => {
          if (prev !== 0) {
            return 0; // go to Home tab
          }
          CapApp.exitApp();
          return prev;
        });
      }).then(h => {
        handle = h;
      });

      return () => {
        if (handle) handle.remove();
      };
    }
  }, []);

  const handleNavigateTab = (tabName) => {
    const idx = TAB_INDEX_MAP[tabName];
    if (idx !== undefined) {
      setActiveTab(idx);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <AppShell activeIndex={activeTab} onTabChange={setActiveTab}>
      <div className="px-4 sm:px-6 pt-4">
        <Home onNavigateTab={handleNavigateTab} />
      </div>
      <div className="px-4 sm:px-6 pt-4">
        <Cards />
      </div>
      <div className="px-4 sm:px-6 pt-4">
        <Pay />
      </div>
      <div className="px-4 sm:px-6 pt-4">
        <Passbook />
      </div>
      <div className="px-4 sm:px-6 pt-4">
        <Profile />
      </div>
    </AppShell>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

export function App() {
  useEffect(() => {
    initBackgroundHealthCheck();
  }, []);

  return (
    <ThemeProvider>
      <GlassProvider>
        <AuthProvider>
          <WakeUpBanner />
          <BrowserRouter>
            <Routes>
              {/* Authenticated Dashboard */}
              <Route path="/" element={<MainSections />} />

              {/* Public & Onboarding Flows */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/otp-verify" element={<OtpVerify />} />
              <Route path="/set-pin" element={<SetPin />} />
              <Route path="/choose-card" element={<ChooseCard />} />
              <Route path="/account-created" element={<AccountCreated />} />
              <Route path="/login" element={<Login />} />

              {/* Dev Verification Route */}
              <Route path="/dev/glass-test" element={<GlassTest />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </GlassProvider>
    </ThemeProvider>
  );
}

export default App;
