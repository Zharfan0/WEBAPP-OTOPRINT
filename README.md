# OTOPRINT - Vending Machine Dokumen Akademik

**OtoPrint** adalah sistem cetak mandiri dokumen akademik yang terintegrasi dengan printer di Universitas Muhammadiyah Yogyakarta. Mahasiswa dapat mencetak dokumen seperti surat aktif kuliah, transkrip, atau sertifikat secara mandiri dengan verifikasi QR code.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi Cepat](#instalasi-cepat)
- [Akun Demo](#akun-demo)
- [Struktur Folder](#struktur-folder)
- [Cara Menjalankan](#cara-menjalankan)
- [Troubleshooting](#troubleshooting)

---

## Fitur Utama

### Admin Panel

| Fitur | Penjelasan |
|-------|------------|
| Insight Dashboard | Menampilkan statistik cetak (hari ini, minggu ini, total), chart dokumen terpopuler, jam sibuk, filter tanggal |
| Log Cetak | Riwayat lengkap cetakan, filter (tanggal, dokumen, user), export CSV, pagination |
| Manajemen Template | Upload file .docx, buat field dinamis dengan sumber data (MANUAL, AUTO_KRS, SYSTEM, MASTER_SIGNATURE) |
| Maintenance | Atur stok kertas, level tinta, pilih printer default, test print |

### User Panel (Mahasiswa)

| Fitur | Penjelasan |
|-------|------------|
| Dashboard | Daftar template yang tersedia (card touch-friendly) |
| Form Generator | Form otomatis sesuai field database dengan validasi input |
| Preview Dokumen | Lihat dokumen sebelum dicetak |
| Cetak Langsung | Kirim dokumen langsung ke printer fisik (tanpa popup) |
| AFK Timeout | Auto logout jika 45 detik tidak aktif |

### Fitur Umum

| Fitur | Penjelasan |
|-------|------------|
| Verifikasi QR Code | Setiap dokumen memiliki QR unik di pojok kanan bawah untuk cek keaslian |
| Touchscreen Friendly | Desain untuk vending machine (ukuran sentuh minimal 56px) |
| Role Based Access | Admin dan user memiliki akses berbeda |

---

## Teknologi

| Kategori | Teknologi |
|----------|------------|
| Backend | Node.js, Express, SQLite3 |
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript |
| Library pendukung | Chart.js, JSZip, pdf-lib, qrcode, pdf-to-printer, docxtemplater |
| Konversi DOCX | LibreOffice (wajib terinstall) |
| Session | express-session |

---

## Prasyarat

| Software | Minimal Versi | Catatan |
|----------|---------------|---------|
| Node.js | v18 atau lebih tinggi | [Download](https://nodejs.org) |
| LibreOffice | terbaru | [Download](https://www.libreoffice.org) - wajib untuk konversi DOCX ke PDF |
| Git (opsional) | - | untuk clone repository |
| Browser | Chrome/Edge/Firefox | untuk akses web |
| Printer | - | terhubung ke komputer server |

---

## Instalasi Cepat

```bash
# Clone repository
git clone https://github.com/username/WEBAPP-OTOPRINT.git
cd WEBAPP-OTOPRINT

# Install dependensi backend
cd backend
npm install

# Jalankan server
node server.js

# Buka browser di alamat
http://localhost:3000
```

---

## Akun Demo

| NIM | Nama | Role | Password |
|-----|------|------|----------|
| 20220140027 | Ahmad Ilman | admin | admin123 |
| 20220140055 | Andi Granityo | user | user123 |
| 20220140079 | Muhammad Zharfan | user | user123 |
| 20220140107 | Muhammad Ikram | user | user123 |

---

## Struktur Folder

| Folder / File | Deskripsi |
|---------------|-----------|
| `backend/` | Kode server Node.js |
| `backend/server.js` | Entry point utama |
| `backend/pdfGenerator.js` | Konversi DOCX ke PDF |
| `backend/signatureInjector.js` | Inject tanda tangan ke DOCX |
| `backend/database.sqlite` | Database SQLite (auto generated) |
| `frontend/` | File statis (HTML, CSS, JS, gambar) |
| `frontend/admin/` | Halaman admin (insight, logs, maintenance, signature, template) |
| `frontend/pages/` | Halaman user (dashboard, form-generator, preview-generator) |
| `frontend/templates/` | File .docx template hasil upload |
| `frontend/index.html` | Landing page publik |
| `frontend/login.html` | Halaman login |
| `frontend/verify.html` | Verifikasi QR code |
| `docs/` | Dokumentasi tambahan (INSTALLATION, DEPLOYMENT, API-DOCS, USER-GUIDE, CHANGELOG) |

---

## Cara Menjalankan

### Development (localhost)

```bash
cd backend
npm install   # sekali saja
node server.js
# Buka http://localhost:3000
```

### Production (vending machine)

Lihat panduan di `docs/DEPLOYMENT.md`.

---

## Sumber Data Field

| Sumber Data | Fungsi | Tampil di Form? |
|-------------|--------|-----------------|
| MANUAL | User mengisi sendiri | Ya (wajib diisi) |
| AUTO_KRS | Data dari session (NIM, Nama, Prodi) | Tidak |
| SYSTEM | Auto generate (tanggal, nomor surat, QR) | Tidak |
| MASTER_SIGNATURE | Tanda tangan dosen dari database | Tidak |

---

## Keamanan

| Fitur | Keterangan |
|-------|------------|
| Session management | express-session, masa aktif 30 menit |
| Role-based access | Admin dan user punya menu berbeda |
| AFK timeout | Logout otomatis setelah 45 detik tidak aktif |
| Validasi input | Dilakukan di frontend dan backend |
| Escape karakter XML | Mencegah error parsing |

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Server tidak berjalan | Cek versi Node.js (`node --version`), minimal v18 |
| Library tidak ditemukan | Jalankan `npm install` di folder backend |
| Konversi DOCX gagal | Pastikan LibreOffice terinstall dan path-nya benar |
| Preview tidak muncul | Cek koneksi internet (library via CDN) |
| Printer tidak merespon | Cek koneksi printer, set sebagai default |
| Port 3000 sudah dipakai | Ganti port di server.js atau matikan proses yang memakainya |

---

## Kontak

**Tim Capstone UMY**  
Universitas Muhammadiyah Yogyakarta
