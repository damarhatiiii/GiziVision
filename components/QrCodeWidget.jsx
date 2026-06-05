'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, X, Copy, Check, RefreshCw } from 'lucide-react';

export default function QrCodeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to render portal safely on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch server info to get local network IP
  const fetchServerInfo = async () => {
    setLoading(true);
    try {
      // If browsing the live deployment (not localhost/local IP), use the current public URL directly
      if (
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.startsWith('192.168.') &&
        !window.location.hostname.startsWith('10.')
      ) {
        setUrl(window.location.origin);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/server-info');
      const data = await res.json();
      if (data && data.localUrl) {
        setUrl(data.localUrl);
      } else {
        setUrl(window.location.origin);
      }
    } catch (err) {
      console.error('Error fetching server info:', err);
      setUrl(window.location.origin);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();
  }, []);

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // High resolution PNG with size=300x300, rendering sharply and compatible with all browsers
  const qrImageUrl = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&qzone=1`
    : '';

  // Render the modal overlay content
  const modalContent = isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xs bg-[#121212] border border-[#262626] rounded-3xl p-5 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-text-primary">
            <Share2 className="w-4.5 h-4.5 text-text-primary" />
            <span className="font-semibold text-sm text-text-primary tracking-tight">Bagikan Aplikasi</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-text-secondary leading-relaxed px-2 mb-4">
          Scan QR Code di bawah untuk membuka aplikasi ini di perangkat lain:
        </p>

        {/* QR Code Frame */}
        <div className="bg-white rounded-[20px] p-4 w-40 h-40 mx-auto mb-4 flex items-center justify-center shadow-lg">
          {loading || !url ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-brown animate-spin" />
            </div>
          ) : (
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-full h-full object-contain rounded-lg"
            />
          )}
        </div>

        {/* URL Text and Copy Option */}
        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-3 bg-[#181818] hover:bg-card-hover border border-[#2a2a2a] hover:border-gold/30 rounded-xl flex items-center justify-between gap-3 group transition-all duration-200 cursor-pointer"
            title="Klik untuk menyalin"
          >
            <span className="text-[11px] font-mono text-text-secondary group-hover:text-gold transition-colors truncate select-all text-left">
              {url}
            </span>
            <div className="shrink-0">
              {copied ? (
                <span className="text-[9px] text-success font-medium flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Tersalin
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-text-muted group-hover:text-gold transition-colors" />
              )}
            </div>
          </button>

          {/* Edit IP trigger */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const newIp = prompt("Masukkan IP lokal atau URL kustom Anda:", url);
                if (newIp && newIp.trim() !== '') {
                  setUrl(newIp.trim());
                }
              }}
              className="text-[9px] text-text-muted hover:text-gold transition-colors underline decoration-dotted underline-offset-2 cursor-pointer"
            >
              Ubah Alamat IP
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* QR Code Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-gold border border-border hover:border-gold/50 rounded-lg bg-surface transition-all duration-200 cursor-pointer"
        title="Akses aplikasi dari Handphone"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Bagikan</span>
      </button>

      {/* Render Portal Direct to document.body */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
