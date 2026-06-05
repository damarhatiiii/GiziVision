import Link from 'next/link';
import { getStats } from '@/services/nutrition.service';
import LandingAnimation from '@/components/animations/LandingAnimation';
import { ArrowRight, Database, Layers, CheckSquare, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'GiziVision — Analisis Nutrisi Makanan Indonesia',
  description: 'Platform analisis kandungan nutrisi makanan Indonesia berbasis computer vision dan dataset gizi pangan nasional.',
};

export default function Home() {
  const stats = getStats();

  return (
    <div className="flex-1 flex flex-col">
      <LandingAnimation />

      {/* ── HERO ── */}
      <section className="container mx-auto px-6 max-w-7xl pt-20 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Content */}
          <div className="animate-hero opacity-0">
            
            <div className="flex items-center gap-2 mb-8">
              <div className="gold-line"></div>
              <span className="section-label">Computer Vision · Gizi Pangan</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-[1.15] mb-6">
              Analisis Nutrisi<br />
              Makanan Indonesia<br />
              <span className="text-gold">Berbasis AI</span>
            </h1>

            <p className="text-base text-text-secondary leading-relaxed mb-10 max-w-lg">
              GiziVision mendeteksi <strong>semua makanan di piring Anda</strong> — kalori, protein, lemak, 
              dan karbohidrat dari foto makanan khas Indonesia secara otomatis menggunakan dataset gizi 
              pangan nasional dengan {stats.totalItems.toLocaleString('id-ID')}+ entri data.
            </p>

            <div className="flex items-center gap-3 mb-12">
              <Link href="/upload" className="btn-primary">
                Mulai Analisis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Lihat Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-border">
              <div>
                <p className="stat-value text-xl">{stats.totalItems.toLocaleString('id-ID')}</p>
                <p className="text-xs text-text-muted mt-0.5">Entri pangan</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <p className="stat-value text-xl">{stats.totalDataPoints.toLocaleString('id-ID')}</p>
                <p className="text-xs text-text-muted mt-0.5">Data poin nutrisi</p>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <p className="stat-value text-xl">{stats.totalCategories}</p>
                <p className="text-xs text-text-muted mt-0.5">Klaster kategori</p>
              </div>
            </div>
          </div>

          {/* Right: Visual Preview Card — Multi-item example */}
          <div className="animate-hero opacity-0 hidden lg:block">
            <div className="card p-6 space-y-4" style={{ animationDelay: '0.15s' }}>
              
              {/* Mock header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success opacity-80"></div>
                  <span className="text-xs text-text-muted font-medium">Hasil Analisis — 2 Item</span>
                </div>
                <span className="badge badge-gold">Multi-Deteksi</span>
              </div>

              {/* Food items preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface border border-border p-3 text-center">
                  <div className="w-8 h-8 rounded-lg bg-brown/20 border border-brown/30 flex items-center justify-center mx-auto mb-1.5">
                    <span className="text-sm">🍜</span>
                  </div>
                  <p className="text-xs font-semibold text-text-primary">Bakso</p>
                  <p className="text-[10px] text-text-muted">76 kkal</p>
                </div>
                <div className="rounded-lg bg-surface border border-border p-3 text-center">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center mx-auto mb-1.5">
                    <span className="text-sm">🍚</span>
                  </div>
                  <p className="text-xs font-semibold text-text-primary">Nasi Goreng</p>
                  <p className="text-[10px] text-text-muted">276 kkal</p>
                </div>
              </div>

              {/* Total nutrisi bars — based on Bakso (76,4.1,2.5,9.2) + Nasi Goreng (276,3.2,3.2,30.2) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Nutrisi</span>
                  <span className="text-xs font-bold text-text-primary">352 kkal</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Karbohidrat', value: '39.4 g', pct: 61 },
                    { label: 'Protein', value: '7.3 g', pct: 11 },
                    { label: 'Lemak', value: '5.7 g', pct: 9 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-text-secondary font-medium">{item.label}</span>
                        <span className="text-xs font-semibold text-text-primary">{item.value}</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill-brown" style={{ width: `${item.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom tag */}
              <div className="pt-3 border-t border-border flex items-center gap-2">
                <div className="gold-dot"></div>
                <span className="text-xs text-text-muted">Dataset Kemenkes RI · {stats.totalItems.toLocaleString('id-ID')} entri</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="divider"></div>

      {/* ── HOW IT WORKS ── */}
      <section className="container mx-auto px-6 max-w-7xl py-20">
        <div className="animate-features opacity-0 mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="gold-line"></div>
            <span className="section-label">Cara Kerja</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Alur Analisis Nutrisi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden">
          {[
            {
              num: '01',
              title: 'Unggah Foto',
              desc: 'Unggah foto makanan khas Indonesia ke dalam sistem melalui antarmuka drag-and-drop.',
              icon: '📷',
            },
            {
              num: '02',
              title: 'Deteksi AI',
              desc: 'Model Gemini Vision mendeteksi semua objek makanan dan mengidentifikasi setiap jenis pangan.',
              icon: '🔍',
            },
            {
              num: '03',
              title: 'Pencocokan Data',
              desc: `Sistem mencocokkan setiap hasil deteksi dengan ${stats.totalItems.toLocaleString('id-ID')}+ entri dataset gizi nasional.`,
              icon: '📊',
            },
            {
              num: '04',
              title: 'Laporan Nutrisi',
              desc: 'Dapatkan laporan lengkap per-item dan total kalori, protein, lemak, karbo, serta rekomendasi.',
              icon: '📋',
            },
          ].map((step, i) => (
            <div
              key={step.num}
              className="animate-features opacity-0 bg-surface p-7 flex flex-col gap-4"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-mono font-bold text-text-disabled">{step.num}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DATASET INFO ── */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 max-w-7xl py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="animate-features opacity-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="gold-line"></div>
                <span className="section-label">Dataset</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Data Gizi dari Sumber Terpercaya
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                GiziVision menggunakan <strong>Indonesian Food and Drink Nutrition Dataset</strong> oleh 
                Anas Fikri Hanif, kumpulan data gizi makanan dan minuman khas Indonesia yang bersumber 
                dari <strong>Tabel Komposisi Pangan Indonesia</strong> (panganku.org) oleh Kementerian Kesehatan RI.
              </p>
              <div className="space-y-3 mb-5">
                {[
                  'Tidak menggunakan data nutrisi buatan (dummy)',
                  'Semua analisis dicocokkan dengan dataset real',
                  'Data diproses secara lokal untuk privasi pengguna',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-gold shrink-0" />
                    <span className="text-sm text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://www.kaggle.com/datasets/anasfikrihanif/indonesian-food-and-drink-nutrition-dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-gold hover:underline font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat Dataset di Kaggle
              </a>
            </div>

            <div className="animate-features opacity-0 grid grid-cols-2 gap-4">
              {[
                { icon: <Database className="w-5 h-5" />, label: 'Total Entri Pangan', value: stats.totalItems.toLocaleString('id-ID') },
                { icon: <Layers className="w-5 h-5" />, label: 'Kategori Klaster', value: stats.totalCategories },
                { icon: <CheckSquare className="w-5 h-5" />, label: 'Data Poin Nutrisi', value: stats.totalDataPoints.toLocaleString('id-ID') },
                { icon: <ArrowRight className="w-5 h-5" />, label: 'Sumber Data', value: 'Kemenkes RI' },
              ].map((item, i) => (
                <div key={i} className="card p-5">
                  <div className="text-text-muted mb-3">{item.icon}</div>
                  <p className="stat-label mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TIM PENGEMBANG (Bootcamp IT 2026) ── */}
      <section className="border-t border-border py-16 bg-surface/30">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="card bg-card/40 border border-border-subtle p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="gold-line"></div>
                <span className="section-label">Pengembang Aplikasi</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary">Tim Bootcamp IT 2026</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-md">
                Mahasiswa Semester 4 Program Studi Informatika, Universitas Bina Sarana Informatika. 
                Mengembangkan platform GiziVision sebagai bagian dari tugas kelompok IT.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end max-w-2xl">
              {[
                { name: 'Muhammad Damarhati', nim: '15240045' },
                { name: 'Ananta Bagas Sasena', nim: '15240078' },
                { name: 'Achmad Nazzri Adlan Fatkhuladzi', nim: '15240054' },
                { name: 'Akhdan Adiva Sangaji', nim: '15240006' },
                { name: 'Dyas Fathir Arkananta', nim: '15240091' },
              ].map((member, i) => (
                <div 
                  key={i} 
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border/80 flex flex-col items-start gap-1 text-left hover:border-gold/30 transition-colors"
                >
                  <span className="text-xs font-semibold text-text-primary leading-none">{member.name}</span>
                  <span className="text-[10px] text-text-muted leading-none font-mono mt-0.5">{member.nim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
