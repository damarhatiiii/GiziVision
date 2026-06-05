# 🍽️ GiziVisionV2 — Platform Analisis Gizi Pangan Indonesia

**GiziVisionV2** adalah platform analisis kandungan nutrisi makanan khas Indonesia berbasis *computer vision* (Gemini AI) dan sinkronisasi dataset gizi pangan nasional secara instan.

---

## 👥 Anggota Kelompok Pengembang

Aplikasi ini dikembangkan oleh **Tim Bootcamp IT 2026** (Mahasiswa Semester 4, Program Studi Informatika, **Universitas Bina Sarana Informatika**):

1. **Muhammad Damarhati** (15240045)
2. **Ananta Bagas Sasena** (15240078)
3. **Achmad Nazzri Adlan Fatkhuladzi** (15240054)
4. **Akhdan Adiva Sangaji** (15240006)
5. **Dyas Fathir Arkananta** (15240091)

---

## 1. Identitas Proyek (Project Identity)

* **Nama Aplikasi:** GiziVision (Versi 2)
* **Tujuan Aplikasi:** Menganalisis kandungan kalori, protein, lemak, dan karbohidrat dari foto makanan khas Indonesia (mendukung deteksi multi-makanan dalam satu piring) secara otomatis dan real-time.
* **Pengembang:** Tim Bootcamp IT 2026 (Mahasiswa Semester 4 Prodi Informatika, Universitas Bina Sarana Informatika).

---

## 2. Spesifikasi Data & Algoritma (Data & Algorithms)

* **Basis Data (Dataset):** Menggunakan data tabel gizi pangan resmi **Kementerian Kesehatan Republik Indonesia (Kemenkes RI)** (panganku.org) via *Indonesian Food and Drink Nutrition Dataset* (Kaggle oleh Anas Fikri Hanif) dengan **1.300+ entri data pangan** aktif.
* **Variabel Analisis:** Aplikasi menerima unggahan berkas foto makanan/minuman (JPEG, PNG, WEBP) serta input nama kustom (*custom name hint*) opsional sebagai petunjuk tambahan bagi AI.
* **Teknologi AI & Pendeteksian:** Menggunakan model **Gemini 2.5 Flash** (via `@google/generative-ai`) untuk menganalisis objek visual (*Multi-Food Detection*) secara dinamis. Hasil deteksi kemudian dicocokkan secara otomatis dengan nama makanan resmi dalam database lokal (`nutrition.csv`) untuk mendapatkan nilai nutrisi resmi.
* **Cadangan Estimasi (Fallback):** Jika data pangan tidak terdaftar pada database lokal, sistem menggunakan kalkulasi nutrisi berbasis kecerdasan buatan Gemini AI secara otomatis.

---

## 3. Arsitektur Teknis (Technical Architecture)

* **Kerangka Kerja (Framework):** Dibangun menggunakan **Next.js 15.5.19** (App Router & Turbopack) dengan React 19.
* **Teknologi Front-End & Animasi:** Styling modern bertema gelap (*Dark Mode*) menggunakan **Tailwind CSS v4** & CSS Kustom. Animasi interaktif didukung oleh **Anime.js**, dan ikon disediakan oleh **Lucide React**.
* **Visualisasi Data:** Menggunakan library **Recharts** untuk merender grafik kalori harian serta diagram makronutrisi (karbohidrat, protein, lemak) di halaman dashboard secara visual dan interaktif.
* **Optimalisasi Penyimpanan Lokal (localStorage):** Menyimpan riwayat scan langsung di sisi klien browser secara aman dengan mengompres foto menjadi thumbnail kecil (~5KB) dan membatasi riwayat maksimal 50 pemindaian dengan sistem *auto-trimming* untuk menghindari error memori browser.
* **Deployment:** Source code dikelola menggunakan Git dan didistribusikan secara online melalui platform GitHub.
