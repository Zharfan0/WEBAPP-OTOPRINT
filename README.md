Baik, saya buat **README.md** full dan langsung bisa copas.

---

## 📄 **README.md**

```markdown
# 🖨️ OTOPRINT - Vending Machine Dokumen Akademik

**OtoPrint** adalah sistem digitalisasi dokumen akademik mandiri yang terintegrasi dengan mesin cetak (printer) di Universitas Muhammadiyah Yogyakarta. Sistem ini memungkinkan mahasiswa mencetak dokumen akademik secara mandiri, cepat, dan terverifikasi.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Instalasi Cepat](#-instalasi-cepat)
- [Akun Demo](#-akun-demo)
- [Struktur Folder](#-struktur-folder)
- [Cara Menjalankan](#-cara-menjalankan)
- [Troubleshooting](#-troubleshooting)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### Admin Panel
| Fitur | Deskripsi |
|-------|-----------|
| **Insight Dashboard** | Statistik cetak (hari ini, minggu ini, total), chart dokumen terpopuler, chart jam sibuk, filter tanggal |
| **Log Cetak** | Riwayat lengkap cetakan, filter (tanggal, dokumen, user), export CSV, pagination |
| **Template Management** | Upload file .docx, buat field dinamis dengan berbagai data source (MANUAL, AUTO_KRS, SYSTEM, MASTER_SIGNATURE) |
| **Maintenance** | Atur stok kertas, level tinta, pilih printer default, test print |

### User Panel (Mahasiswa)
| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Menampilkan daftar template yang tersedia (card touch-friendly) |
| **Form Generator** | Form dibuat otomatis berdasarkan field database, validasi input |
| **Preview Dokumen** | Lihat dokumen sebelum dicetak |
| **Cetak Langsung** | Kirim dokumen langsung ke printer fisik (tanpa popup) |
| **AFK Timeout** | Auto logout jika 45 detik tidak aktif |

### Fitur Umum
| Fitur | Deskripsi |
|-------|-----------|
| **QR Code Verifikasi** | Setiap dokumen memiliki QR unik di pojok kanan bawah untuk verifikasi keaslian |
| **Touchscreen Friendly** | Desain khusus untuk vending machine (touch target minimal 56px) |
| **Role Based Access** | Admin dan user memiliki akses berbeda |

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Backend** | Node.js, Express, SQLite3 |
| **Frontend** | HTML5, CSS3, Bootstrap 5, JavaScript |
| **Library** | Chart.js, JSZip, pdf-lib, qrcode, pdf-to-printer, docxtemplater |
| **Konversi DOCX** | LibreOffice (wajib terinstall) |
| **Session** | express-session |

---

## 📋 Prasyarat

| Software | Minimal Versi | Keterangan |
|----------|---------------|------------|
| Node.js | v18 atau lebih tinggi | [Download](https://nodejs.org) |
| LibreOffice | Versi terbaru | [Download](https://www.libreoffice.org) - WAJIB untuk konversi DOCX ke PDF |
| Git (opsional) | - | Untuk clone repository |
| Browser | Chrome/Edge/Firefox | Untuk akses aplikasi |
| Printer | - | Terhubung ke komputer server |

---

## 🚀 Instalasi Cepat

```bash
# 1. Clone repository
git clone https://github.com/username/WEBAPP-OTOPRINT.git
cd WEBAPP-OTOPRINT

# 2. Install dependencies backend
cd backend
npm install

# 3. Jalankan server
node server.js

# 4. Buka browser
http://localhost:3000
```

---

## 👥 Akun Demo

| NIM | Nama | Role | Password |
|-----|------|------|----------|
| 20220140027 | Ahmad Ilman | **admin** | admin123 |
| 20220140055 | Andi Granityo | **user** | user123 |
| 20220140079 | Muhammad Zharfan | **user** | user123 |
| 20220140107 | Muhammad Ikram | **user** | user123 |

---

## 📁 Struktur Folder

```
WEBAPP-OTOPRINT/
├── backend/                      # Server Node.js
│   ├── server.js                # Main entry point
│   ├── pdfGenerator.js          # Konversi DOCX ke PDF
│   ├── signatureInjector.js     # Inject tanda tangan ke DOCX
│   ├── database.sqlite          # Database SQLite (auto generated)
│   └── package.json             # Dependencies
│
├── frontend/                     # Static files
│   ├── admin/                   # Halaman admin
│   │   ├── insight.html         # Dashboard statistik
│   │   ├── logs.html            # Log cetak
│   │   ├── maintenance.html     # Pengaturan printer & stok
│   │   ├── signature.html       # Master signature
│   │   ├── templates_V1.html    # Template V1 (placeholder)
│   │   ├── templates_V2.html    # Template V2 (layout visual)
│   │   └── templates_V2_editor.html # Editor layout V2
│   ├── pages/                   # Halaman user
│   │   ├── dashboard.html       # Dashboard user
│   │   ├── form-generator.html  # Form isi data
│   │   └── preview-generator.html # Preview & cetak
│   ├── assets/                  # Gambar, CSS, JS
│   ├── templates/               # File .docx template (upload)
│   ├── index.html               # Landing page publik
│   ├── login.html               # Halaman login
│   └── verify.html              # Verifikasi QR Code
│
├── docs/                         # Dokumentasi
│   ├── INSTALLATION.md
│   ├── DEPLOYMENT.md
│   ├── API-DOCS.md
│   ├── USER-GUIDE.md
│   └── CHANGELOG.md
│
└── package.json                  # Dependencies root (jika ada)
```

---

## 🖥️ Cara Menjalankan

### Development (Localhost)

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install dependencies (hanya sekali)
npm install

# 3. Jalankan server
node server.js

# 4. Buka browser
http://localhost:3000
```

### Production (Vending Machine)

Untuk deployment ke vending machine, lihat panduan lengkap di [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## 🔧 Data Source Field

| Data Source | Fungsi | Tampil di Form |
|-------------|--------|----------------|
| **MANUAL** | User mengisi sendiri | ✅ Ya (wajib isi) |
| **AUTO_KRS** | Data otomatis dari session (NIM, Nama, Prodi) | ❌ Tidak (backend yang isi) |
| **SYSTEM** | Auto generate (tanggal, nomor surat, QR) | ❌ Tidak |
| **MASTER_SIGNATURE** | Tanda tangan dosen dari database | ❌ Tidak |

---

## 🔐 Fitur Keamanan

- Session management dengan express-session (30 menit)
- Role-based access control (admin vs user)
- AFK Timeout untuk user (45 detik tidak aktif → logout)
- Validasi input di frontend & backend
- Escape karakter XML untuk mencegah error parsing

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Server tidak berjalan | Cek Node.js version (`node --version`), minimal v18 |
| Library tidak ditemukan | Jalankan `npm install` di folder backend |
| Konversi DOCX gagal | Pastikan LibreOffice terinstall dan path benar |
| Preview tidak muncul | Cek koneksi internet (library via CDN) |
| Printer tidak merespon | Cek koneksi printer, set sebagai default |
| Port 3000 sudah dipakai | Ganti port di server.js atau kill proses yang menggunakan |

---

## 📞 Kontak

**Tim Capstone UMY**  
Universitas Muhammadiyah Yogyakarta

---

## 📜 Lisensi

© 2025 Tim Capstone UMY. All rights reserved.

---

## 📚 Dokumentasi Lainnya

| File | Isi |
|------|-----|
| [INSTALLATION.md](./docs/INSTALLATION.md) | Panduan instalasi lengkap |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Panduan deploy ke vending machine |
| [API-DOCS.md](./docs/API-DOCS.md) | Dokumentasi endpoint API |
| [USER-GUIDE.md](./docs/USER-GUIDE.md) | Panduan penggunaan (admin & user) |
| [CHANGELOG.md](./docs/CHANGELOG.md) | Riwayat perubahan versi |
```
