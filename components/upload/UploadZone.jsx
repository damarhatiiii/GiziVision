'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addHistory } from '@/services/history.service';
import { UploadCloud, X, Sparkles, Loader2, ImageIcon, AlertTriangle, Settings, Check, Key, Camera } from 'lucide-react';

/**
 * Compress an image to a small thumbnail for localStorage storage.
 * Returns a small base64 JPEG string.
 */
function createThumbnail(base64Image, maxWidth = 120, quality = 0.5) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(null);
    img.src = base64Image;
  });
}

/**
 * Resize and compress image to prevent Vercel 413 Payload Too Large / 504 Timeout errors.
 * Returns compressed base64 JPEG.
 */
function resizeAndCompressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses gambar.'));
    };
    img.src = objectUrl;
  });
}

export default function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [base64Image, setBase64Image] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gemini Key and Custom Food Name
  const [customName, setCustomName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const router = useRouter();

  const getCompressedSize = () => {
    if (!base64Image) return 0;
    const base64Content = base64Image.split(',')[1] || '';
    return (base64Content.length * 0.75) / 1024; // in KB
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('gizivision_gemini_key') || '';
      setApiKeyInput(storedKey);
      setHasApiKey(!!storedKey);
    }

    fetch('/api/analyze')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasServerKey === 'boolean') {
          setHasServerKey(data.hasServerKey);
        }
      })
      .catch(err => console.error('Gagal mengecek status API Key server:', err));
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Format berkas harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }
    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    
    setLoading(true);
    try {
      const compressed = await resizeAndCompressImage(selectedFile);
      setBase64Image(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result);
      reader.readAsDataURL(selectedFile);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl('');
    setBase64Image('');
    setError('');
    setCustomName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('gizivision_gemini_key', trimmed);
      setHasApiKey(true);
      setShowSettings(false);
    } else {
      handleClearApiKey();
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gizivision_gemini_key');
    setApiKeyInput('');
    setHasApiKey(false);
  };

  const handleAnalyze = async () => {
    if (!base64Image) return;
    setLoading(true);
    setError('');
    try {
      const userApiKey = localStorage.getItem('gizivision_gemini_key') || '';
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey
        },
        body: JSON.stringify({ 
          image: base64Image, 
          fileName: file.name,
          customName: customName.trim()
        }),
      });

      // Parse JSON safely or handle HTML error page gracefully (e.g. Vercel 504/500/413)
      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        
        if (response.status === 504) {
          throw new Error('Server Timeout (Penyebab: Gemini AI memakan waktu terlalu lama atau koneksi lambat). Silakan coba lagi.');
        } else if (response.status === 413) {
          throw new Error('Gambar terlalu besar untuk diunggah ke server.');
        } else {
          throw new Error(`Gagal menghubungi server (${response.status}). Coba lagi beberapa saat lagi.`);
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal menganalisis gambar.');
      }

      // Create small thumbnail for localStorage (not the full image)
      const thumbnail = await createThumbnail(base64Image);

      // Save to history with new multi-item format
      const savedScan = addHistory({
        items: data.items || [],
        totalNutrition: data.totalNutrition || { calories: 0, proteins: 0, fat: 0, carbohydrate: 0 },
        imagePreview: thumbnail,
      });

      if (savedScan) router.push(`/analysis?id=${savedScan.id}`);
      else throw new Error('Gagal menyimpan hasil analisis.');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menganalisis.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">

      {/* ── API STATUS BAR ── */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-3.5 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${(hasServerKey || hasApiKey) ? 'bg-success' : 'bg-warning'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${(hasServerKey || hasApiKey) ? 'bg-success' : 'bg-warning'}`}></span>
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-text-primary">
              {(hasServerKey || hasApiKey) ? 'Mode AI Aktif (Gemini)' : 'Mode Simulasi (Mock)'}
            </p>
            <p className="text-[10px] text-text-muted">
              {hasServerKey 
                ? 'API Key terkonfigurasi di server. Siap menganalisis gambar riil.' 
                : hasApiKey 
                  ? 'API Key terkonfigurasi di browser Anda. Siap menganalisis gambar riil.' 
                  : 'Menggunakan kecocokan nama file & fallback acak.'
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`
            p-2 rounded-lg border border-border flex items-center justify-center gap-1.5 text-xs font-medium transition-all
            ${showSettings ? 'bg-card text-gold border-gold/45 shadow-[0_0_8px_rgba(212,175,55,0.1)]' : 'bg-card text-text-secondary hover:text-text-primary hover:border-text-muted'}
          `}
        >
          <Settings className="w-3.5 h-3.5" />
          Pengaturan Key
        </button>
      </div>

      {/* ── SETTINGS COLLAPSIBLE PANEL ── */}
      {showSettings && (
        <div className="card p-5 space-y-3.5 text-left border-gold/20 shadow-lg">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-gold" />
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Konfigurasi Gemini API</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {hasServerKey 
              ? 'API Key Gemini sudah terkonfigurasi di sisi server (.env.local). Anda tidak perlu memasukkan key secara manual, kecuali jika ingin menimpa (override) dengan key Anda sendiri.'
              : 'Untuk analisis foto makanan yang akurat dan deteksi wajah otomatis, masukkan Gemini API Key Anda. Key disimpan dengan aman di penyimpanan lokal browser Anda. Dapatkan Key secara gratis di Google AI Studio.'
            }
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder={hasServerKey ? "Menggunakan key dari server (tersembunyi)" : "Masukkan AIzaSy..."}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="input-premium font-mono text-xs flex-1"
            />
            <button
              onClick={handleSaveApiKey}
              className="btn-primary py-2 px-4 text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
          {hasApiKey && (
            <div className="flex justify-end">
              <button
                onClick={handleClearApiKey}
                className="text-[10px] text-danger hover:underline font-medium transition-all"
              >
                Hapus API Key yang Tersimpan di Browser
              </button>
            </div>
          )}
        </div>
      )}

      {!previewUrl ? (
        /* ── DROPZONE ── */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full h-85 rounded-xl border-2 border-dashed
            flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-all duration-200
            ${dragActive
              ? 'border-gold bg-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
              : 'border-border hover:border-brown hover:bg-surface/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
          />
          
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
            ${dragActive ? 'bg-gold/15 text-gold' : 'bg-card text-text-muted'}
          `}>
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-center px-6">
            <p className="text-sm font-semibold text-text-primary mb-1">
              {dragActive ? 'Lepaskan file di sini' : 'Pilih Foto Makanan'}
            </p>
            <p className="text-xs text-text-muted mb-2">
              Tarik & lepas foto di sini, atau pilih opsi di bawah:
            </p>
          </div>

          {/* Gallery / Camera Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-70 px-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="py-2.5 px-3 rounded-xl bg-card hover:bg-card-hover border border-border hover:border-gold/30 text-text-secondary hover:text-text-primary text-[11px] font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-gold" />
              Dari Galeri
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="py-2.5 px-3 rounded-xl bg-card hover:bg-card-hover border border-border hover:border-gold/30 text-text-secondary hover:text-text-primary text-[11px] font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-gold" />
              Dari Kamera
            </button>
          </div>

          <div className="text-[10px] text-text-disabled bg-[#181818] border border-border px-3 py-1.5 rounded-md mt-2">
            AI akan mendeteksi semua makanan yang terlihat di foto
          </div>
        </div>

      ) : (
        /* ── PREVIEW STATE ── */
        <div className="card p-5 space-y-4">
          
          {/* Image */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-bg border border-border flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Food Preview"
              className="max-h-full max-w-full object-contain"
            />

            {/* Loading scan line */}
            {loading && (
              <div
                className="absolute left-0 w-full h-0.5 opacity-70 animate-[scanLine_1.8s_linear_infinite]"
                style={{
                  background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                  boxShadow: '0 0 8px #D4AF37',
                }}
              />
            )}
          </div>

          {/* File info row */}
          <div className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3 text-left">
              <ImageIcon className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-xs font-semibold text-text-primary truncate max-w-xs">{file?.name}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[10px] text-text-muted">
                  <span>Asli: {(file?.size / 1024 / 1024).toFixed(2)} MB</span>
                  {base64Image && (
                    <>
                      <span className="hidden sm:inline text-text-disabled">·</span>
                      <span className="text-success font-semibold flex items-center gap-1">
                        Kompresi: {getCompressedSize().toFixed(1)} KB
                        {file?.size > 0 && (
                          <span className="text-success/90 font-medium bg-success/10 px-1.5 py-0.2 rounded">
                            (hemat {(((file.size - (getCompressedSize() * 1024)) / file.size) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!loading && (
              <button
                onClick={handleRemove}
                className="w-7 h-7 rounded-md border border-border bg-card flex items-center justify-center text-text-muted hover:border-danger/50 hover:text-danger transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Custom Name Hint Input */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="custom-food-name" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Nama Makanan (Opsional)
            </label>
            <input
              id="custom-food-name"
              type="text"
              placeholder="Contoh: Nasi Goreng, Telur Ceplok, Kerupuk (pisahkan dengan koma)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={loading}
              className="input-premium text-xs"
            />
            <p className="text-[9px] text-text-disabled leading-relaxed">
              * Sebutkan semua makanan yang terlihat, pisahkan dengan koma untuk deteksi lebih akurat.
            </p>
          </div>

          {/* Analyze button */}
          <button
            disabled={loading}
            onClick={handleAnalyze}
            className={`
              w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2
              transition-all duration-200
              ${loading
                ? 'bg-brown/30 text-brown cursor-not-allowed border border-brown/20'
                : 'btn-primary w-full justify-center py-3'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menganalisis semua makanan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analisis Kandungan Nutrisi
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-danger/5 border border-danger/20 text-danger text-sm text-left animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Analisis Gagal</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}

    </div>
  );
}
