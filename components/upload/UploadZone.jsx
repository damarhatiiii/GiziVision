'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addHistory } from '@/services/history.service';
import { UploadCloud, X, Sparkles, Loader2, ImageIcon, AlertTriangle, AlertCircle, XCircle, CheckCircle, WifiOff, ArrowRight, Settings, Check, Key, Camera } from 'lucide-react';

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
      try {
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

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Revoke only after successfully drawing and converting to prevent Safari iOS bugs
        URL.revokeObjectURL(objectUrl);
        resolve(compressedDataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses gambar.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Map HTTP status code to custom user-friendly Indonesian messages.
 */
function getErrorMessageByStatus(status, fallbackMsg = '') {
  switch (status) {
    case 400:
      return "Sistem tidak dapat mengenali makanan pada gambar yang diunggah.";
    case 401:
    case 403:
      return "Terjadi gangguan pada layanan analisis AI.";
    case 404:
      return "Sistem tidak dapat mengenali makanan pada gambar yang diunggah.";
    case 408:
      return "Proses analisis memakan waktu terlalu lama. Silakan coba kembali.";
    case 413:
      return "Ukuran gambar melebihi batas yang diizinkan.";
    case 429:
      return "Layanan AI sedang mencapai batas penggunaan. Silakan coba lagi beberapa saat.";
    case 500:
      return "Server sedang mengalami gangguan. Silakan coba kembali nanti.";
    case 502:
    case 503:
      return "Terjadi gangguan pada layanan analisis AI.";
    case 504:
      return "Proses analisis memakan waktu terlalu lama. Silakan coba kembali.";
    default:
      if (fallbackMsg && (fallbackMsg.includes('fetch failed') || fallbackMsg.includes('network') || fallbackMsg.includes('connection'))) {
        return "Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.";
      }
      return "Terjadi gangguan pada layanan analisis AI.";
  }
}

export default function UploadZone() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [base64Image, setBase64Image] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [recognizedNames, setRecognizedNames] = useState([]);
  const [notification, setNotification] = useState(null);

  // Gemini Key and Custom Food Name
  const [customName, setCustomName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const customNameInputRef = useRef(null);
  const router = useRouter();

  // Manual compression states
  const [quality, setQuality] = useState(0.6);
  const [maxDim, setMaxDim] = useState(1024);
  const [showCompressSettings, setShowCompressSettings] = useState(false);

  const getCompressedSize = () => {
    if (!base64Image) return 0;
    const base64Content = base64Image.split(',')[1] || '';
    return (base64Content.length * 0.75) / 1024; // in KB
  };

  const applyCompression = async (selectedFile, targetDim, targetQuality) => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      const compressed = await resizeAndCompressImage(selectedFile, targetDim, targetDim, targetQuality);
      setBase64Image(compressed);
    } catch (err) {
      console.error('Manual compression error:', err);
      setError('Gagal menerapkan kompresi kustom.');
    } finally {
      setLoading(false);
    }
  };

  const handleQualityChange = async (newVal) => {
    setQuality(newVal);
    await applyCompression(file, maxDim, newVal);
  };

  const handleMaxDimChange = async (newVal) => {
    setMaxDim(newVal);
    await applyCompression(file, newVal, quality);
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
    // Reset previous errors and notifications
    setError('');
    setErrorType('');
    setRecognizedNames([]);
    setNotification(null);

    // 1. Check if format is supported
    const isImage = selectedFile.type.startsWith('image/') ||
      /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(selectedFile.name);
    if (!isImage) {
      setNotification({
        type: 'error',
        title: 'Analisis Gagal',
        message: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.'
      });
      return;
    }

    // 2. Check if file size exceeds the limit (> 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setNotification({
        type: 'error',
        title: 'Analisis Gagal',
        message: 'Ukuran gambar melebihi batas yang diizinkan.'
      });
      return;
    }

    // 3. Warning if image is large (> 3MB)
    if (selectedFile.size > 3 * 1024 * 1024) {
      setNotification({
        type: 'warning',
        title: 'Peringatan',
        message: 'Ukuran gambar cukup besar sehingga proses mungkin memerlukan waktu lebih lama.'
      });
    }

    // 4. Warning if image quality/resolution is low (< 480px width/height)
    const imgTest = new Image();
    imgTest.onload = () => {
      if (imgTest.width < 480 || imgTest.height < 480) {
        setNotification({
          type: 'warning',
          title: 'Peringatan',
          message: 'Hasil analisis mungkin kurang akurat karena kualitas gambar rendah.'
        });
      }
    };
    imgTest.src = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Reset manual compression settings to defaults for new files
    setQuality(0.6);
    setMaxDim(1024);
    setShowCompressSettings(false);

    setLoading(true);
    try {
      const compressed = await resizeAndCompressImage(selectedFile, 1024, 1024, 0.6);
      setBase64Image(compressed);
    } catch (err) {
      console.error('Image compression error:', err);
      // Fallback: If compression fails but the file is reasonably small, try loading via FileReader
      if (selectedFile.size < 1.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => setBase64Image(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setNotification({
          type: 'error',
          title: 'Analisis Gagal',
          message: 'Sistem tidak dapat mengenali makanan pada gambar yang diunggah.'
        });
        setLoading(false);
        setFile(null);
        setPreviewUrl('');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl('');
    setBase64Image('');
    setError('');
    setErrorType('');
    setRecognizedNames([]);
    setNotification(null);
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
    if (!base64Image) {
      setNotification({
        type: 'error',
        title: 'Analisis Gagal',
        message: 'Silakan unggah foto makanan terlebih dahulu.'
      });
      return;
    }
    setLoading(true);
    setError('');
    setErrorType('');
    setRecognizedNames([]);
    setNotification(null);
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
          fileName: file?.name || 'makanan.jpg',
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
        
        const err = new Error('Server returned non-JSON response');
        err.status = response.status;
        throw err;
      }

      if (!response.ok) {
        const err = new Error(data?.error || 'Gagal menganalisis gambar.');
        err.status = response.status;
        err.errorType = data?.errorType || 'GENERAL_ERROR';
        err.recognizedNames = data?.recognizedNames || [];
        throw err;
      }

      // Create small thumbnail for localStorage (not the full image)
      const thumbnail = await createThumbnail(base64Image);

      // Save to history with new multi-item format
      const savedScan = addHistory({
        items: data.items || [],
        totalNutrition: data.totalNutrition || { calories: 0, proteins: 0, fat: 0, carbohydrate: 0 },
        imagePreview: thumbnail,
      });

      if (savedScan) {
        setNotification({
          type: 'success',
          title: 'Analisis Berhasil',
          message: 'Foto berhasil dianalisis dan kandungan nutrisi telah dihitung.'
        });
        setTimeout(() => {
          router.push(`/analysis?id=${savedScan.id}`);
        }, 1500);
      } else {
        throw new Error('Gagal menyimpan hasil analisis.');
      }
    } catch (err) {
      console.error('Gemini API/Server raw error debug details:', err); // Log details in console for debugging
      
      let userFriendlyMessage = "Terjadi gangguan pada layanan analisis AI.";
      
      if (err.errorType === 'FOOD_NOT_FOUND_IN_DATASET') {
        setError('Makanan tidak ada di data, mohon isi nama makanan.');
        setErrorType(err.errorType);
        setRecognizedNames(err.recognizedNames || []);
        
        setNotification({
          type: 'error',
          title: 'Analisis Gagal',
          message: 'Sistem tidak dapat mengenali makanan pada gambar yang diunggah.'
        });
        setLoading(false);
        return;
      }

      if (err.message && (err.message.includes('fetch failed') || err.message.includes('Failed to fetch') || !navigator.onLine)) {
        userFriendlyMessage = "Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.";
      } else if (err.status) {
        userFriendlyMessage = getErrorMessageByStatus(err.status, err.message);
      } else if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
        userFriendlyMessage = "Proses analisis memakan waktu terlalu lama. Silakan coba kembali.";
      }

      setNotification({
        type: 'error',
        title: 'Analisis Gagal',
        message: userFriendlyMessage
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">

      {/* ── API STATUS BAR ── */}
      <div className="flex items-center bg-surface border border-border rounded-xl p-3.5 transition-all">
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
      </div>

      {/* ── NOTIFICATION COMPONENT ── */}
      {notification && (
        <div className={`
          p-4 rounded-xl flex items-start justify-between gap-3 shadow-lg border animate-fade-in text-left relative
          bg-surface/75 backdrop-blur-md transition-all duration-300
          ${notification.type === 'success' 
            ? 'border-success/30 text-success shadow-success/5' 
            : notification.type === 'warning' 
              ? 'border-warning/30 text-warning shadow-warning/5' 
              : 'border-danger/30 text-danger shadow-danger/5'
          }
        `}>
          <div className="flex items-start gap-3">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${notification.type === 'success' 
                ? 'bg-success/15 text-success' 
                : notification.type === 'warning' 
                  ? 'bg-warning/15 text-warning' 
                  : 'bg-danger/15 text-danger'
              }
            `}>
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-0.5">{notification.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed text-text-secondary">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0 absolute top-3 right-3 p-1 rounded-md hover:bg-white/5"
            aria-label="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
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

          {/* Manual Compression Accordion */}
          <div className="border border-border rounded-lg bg-surface/30 overflow-hidden text-left">
            <button
              type="button"
              onClick={() => setShowCompressSettings(!showCompressSettings)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-text-secondary hover:text-text-primary transition-all hover:bg-surface/50"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-gold animate-[spin_8s_linear_infinite]" />
                Atur Kompresi Gambar (Manual)
              </span>
              <span className="text-[10px] text-gold hover:underline">
                {showCompressSettings ? 'Sembunyikan' : 'Sesuaikan Ukuran'}
              </span>
            </button>

            {showCompressSettings && (
              <div className="p-4 border-t border-border bg-card/40 space-y-4">
                {/* Quality Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-text-muted">Kualitas Kompresi</span>
                    <span className="font-mono text-gold font-semibold">{(quality * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={quality}
                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                  <p className="text-[9px] text-text-disabled">Semakin kecil nilai kualitas, ukuran file semakin kecil & hemat kuota.</p>
                </div>

                {/* Resolution Selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Resolusi Maksimal</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[600, 800, 1024, 1200].map((dim) => (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => handleMaxDimChange(dim)}
                        className={`
                          py-1.5 rounded-md border text-[10px] font-semibold transition-all
                          ${maxDim === dim
                            ? 'bg-gold/15 text-gold border-gold'
                            : 'bg-surface border-border text-text-secondary hover:border-text-muted'
                          }
                        `}
                      >
                        {dim}px
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-text-disabled">Resolusi lebih kecil membuat analisis AI menjadi lebih cepat.</p>
                </div>
              </div>
            )}
          </div>

          {/* Custom Name Hint Input */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="custom-food-name" className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Nama Makanan (Opsional)
            </label>
            <input
              ref={customNameInputRef}
              id="custom-food-name"
              type="text"
              placeholder="Contoh: Nasi Goreng, Telur Ceplok, Kerupuk (pisahkan dengan koma)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={loading}
              className={`input-premium text-xs transition-all duration-300 ${errorType === 'FOOD_NOT_FOUND_IN_DATASET'
                  ? 'border-warning/60 focus:border-warning ring-2 ring-warning/20 shadow-[0_0_12px_rgba(192,138,40,0.15)]'
                  : ''
                }`}
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

      {/* Dataset Warning Panel */}
      {error && errorType === 'FOOD_NOT_FOUND_IN_DATASET' && (
        <div className="mt-4 animate-fade-in">
          {/* ── FOOD NOT FOUND IN DATASET ERROR (Warning Theme) ── */}
          <div className="p-5 rounded-xl border border-warning/20 bg-warning/5 text-left space-y-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center text-warning shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Makanan Tidak Ada di Data</h4>
                <p className="text-[10px] text-warning/90 font-semibold uppercase tracking-wider">Perlu Masukan Nama Makanan</p>
              </div>
            </div>

            <div className="text-xs text-text-secondary leading-relaxed space-y-2">
              <p>
                Sistem mendeteksi kemungkinan makanan: {recognizedNames.length > 0 ? (
                  <span className="font-semibold text-text-primary">{recognizedNames.map(name => `"${name}"`).join(', ')}</span>
                ) : (
                  <span className="italic text-text-muted">Tidak dikenal</span>
                )}
                , namun data nutrisinya tidak ditemukan dalam database gizi nasional kami.
              </p>
              <div className="p-3 bg-surface/50 rounded-lg border border-border/40 text-text-secondary text-[11px] flex items-start gap-2">
                <span className="text-warning font-bold shrink-0 mt-0.5">⚠️</span>
                <span><strong>Makanan tidak ada di data, mohon isi nama makanan</strong> secara manual dengan nama makanan khas Indonesia yang terdaftar (contoh: Nasi Goreng, Bakso, Soto Ayam).</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (customNameInputRef.current) {
                    customNameInputRef.current.focus();
                    customNameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="btn-secondary py-1.5 px-3.5 text-xs text-warning hover:text-warning border-warning/20 hover:border-warning/50 hover:bg-warning/5 font-semibold flex items-center gap-1.5 transition-all w-full sm:w-auto cursor-pointer"
              >
                Isi Nama Makanan Sekarang
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
