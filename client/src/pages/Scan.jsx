import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Button from '../components/common/Button.jsx';
import { lookupRecipient } from '../api/accounts.js';

export default function Scan({ isActive, onClose, onScanSuccess }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null); // null, true, false
  const [resolving, setResolving] = useState(false);
  const [scanError, setScanError] = useState('');

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {}
      controlsRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
  }, []);

  // Handle scanned text
  const handleDecodedText = useCallback(async (text) => {
    if (resolving || !text) return;
    setResolving(true);
    setScanError('');

    try {
      let targetAccount = null;
      let targetPhone = null;

      // Attempt parsing JSON format
      try {
        const parsed = JSON.parse(text);
        if (parsed.accountNumber) targetAccount = parsed.accountNumber;
        else if (parsed.phone) targetPhone = parsed.phone;
      } catch (e) {
        // Plain string fallback
        if (text.startsWith('NB')) targetAccount = text;
        else if (text.startsWith('+') || /^\d{10}$/.test(text)) targetPhone = text;
      }

      if (!targetAccount && !targetPhone) {
        throw new Error('Unrecognized NovaBank QR format');
      }

      // Query server for authoritative recipient name
      const res = await lookupRecipient({
        account: targetAccount || undefined,
        phone: targetPhone || undefined
      });

      if (!res.recipient) {
        throw new Error('Recipient account not found on NovaBank server');
      }

      // Authoritative recipient resolved
      stopCamera();
      onScanSuccess(res.recipient);
    } catch (err) {
      setScanError(err.message || 'Could not resolve recipient from QR');
      setResolving(false);
    }
  }, [resolving, stopCamera, onScanSuccess]);

  // Camera lifecycle: starts ONLY when active, stops immediately on unmount or inactive
  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return;
    }

    let isMounted = true;
    const codeReader = new BrowserQRCodeReader();

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
            controlsRef.current = controls;
            if (result && isMounted) {
              handleDecodedText(result.getText());
            }
          }).catch((err) => {
            if (isMounted) {
              setScanError('Camera initialization error: ' + err.message);
            }
          });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHasPermission(false);
          setScanError('Camera access denied. Please grant permission in your browser or app settings.');
        }
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isActive, stopCamera, handleDecodedText]);

  if (!isActive || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between text-white pt-2">
        <div>
          <h2 className="text-lg font-bold">Scan NovaBank QR</h2>
          <p className="text-xs text-white/70">Point camera at recipient's code</p>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          aria-label="Close Scanner"
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Viewport / Reticle */}
      <div className="relative flex-1 flex items-center justify-center my-6 overflow-hidden rounded-3xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Viewfinder Target Reticle */}
        <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border-2 border-white/60 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex items-center justify-center">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#3a7bd5] rounded-tl-xl -mt-0.5 -ml-0.5" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#3a7bd5] rounded-tr-xl -mt-0.5 -mr-0.5" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#3a7bd5] rounded-bl-xl -mb-0.5 -ml-0.5" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#3a7bd5] rounded-br-xl -mb-0.5 -mr-0.5" />

          {/* Animated laser line */}
          <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

          {resolving && (
            <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-2 text-white">
              <LoadingSpinner size="md" />
              <span className="text-xs font-semibold">Verifying recipient...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info / Error */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        {scanError ? (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-medium max-w-sm">
            {scanError}
          </div>
        ) : (
          <p className="text-xs text-white/60">
            Names are verified directly with the server for security
          </p>
        )}

        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
        >
          Cancel
        </Button>
      </div>
    </div>,
    document.body
  );
}
