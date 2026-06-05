# 💼 SalaryVision — Sistem Prediksi Gaji Tech Talent

**SalaryVision** adalah sistem cerdas berbasis web yang dirancang untuk memprediksi estimasi standar gaji *tech talent* (dalam USD/tahun) secara instan menggunakan algoritma Machine Learning yang berjalan sepenuhnya di sisi klien (*client-side*).

---

## 👥 Anggota Kelompok Pengembang

Aplikasi ini dikembangkan oleh **Tim Bootcamp IT 2026** (Mahasiswa Semester 4, Program Studi Informatika, **Universitas Bina Sarana Informatika**):

1. **Yusuf Herfa Auliansyah**
2. **Rizqi Nuzul Firman**
3. **Yusuf Mansur**
4. **Mabel Fernanda Carelly**
5. **Yogi Aprilianto**

---

## 1. Identitas Proyek (Project Identity)

* **Nama Aplikasi:** SalaryVision
* **Tujuan Aplikasi:** Sistem cerdas berbasis web untuk memprediksi estimasi standar gaji *tech talent* (dalam USD/tahun) secara instan.
* **Pengembang:** Tim Bootcamp IT 2026 (Mahasiswa Semester 4 Prodi Informatika, Universitas Bina Sarana Informatika).

---

## 2. Spesifikasi Data & Algoritma (Data & Algorithms)

* **Basis Data (Dataset):** Menggunakan data tabular dari Kaggle berjudul **"Salary Prediction for Beginner"**. Model dilatih menggunakan **1.000 sampel data** yang berisi informasi pekerja nyata.
* **Variabel Prediksi:** Aplikasi menerima 3 input utama dari pengguna:
  * Pengalaman Kerja (tahun)
  * Tingkat Pendidikan (SMA, S1, S2, S3)
  * Usia (tahun)
* **Algoritma Machine Learning:** Menggunakan algoritma **Multiple Linear Regression** (Regresi Linier Berganda). Model menghitung gaji menggunakan persamaan matematis berdasarkan bobot (*weight*) dari masing-masing input.
* **Akurasi Model:** Model terbukti sangat akurat dengan hasil pengujian:
  * **R-Squared ($R^2$):** `0.9178` (Akurasi sebesar **91.78%**)
  * **Mean Absolute Percentage Error (MAPE):** `7.08%` (Tingkat kesalahan yang sangat rendah)

---

## 3. Arsitektur Teknis (Technical Architecture)

* **Berbasis Web (Client-Side):** Aplikasi berjalan 100% di peramban web (*browser*) sisi klien. Aplikasi tidak membutuhkan server backend (seperti Flask atau Django) untuk melakukan perhitungan prediksi.
* **Teknologi Front-End:** Dibangun murni menggunakan **HTML5, CSS3, dan JavaScript (Vanilla)**. Desainnya menggunakan tema *Dark Mode* berkonsep *Glassmorphism* yang modern dan responsif untuk berbagai ukuran layar.
* **Visualisasi Data:** Sistem menggunakan pustaka eksternal **Chart.js** untuk merender grafik data secara visual dan interaktif.
* **Deployment:** Source code dikelola menggunakan Git dan telah dipublikasikan secara langsung (*live*) di internet menggunakan layanan **GitHub Pages**.
