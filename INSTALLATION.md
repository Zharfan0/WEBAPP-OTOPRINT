## 📄 **INSTALLATION.md**

```markdown
# 🔧 Instalasi OtoPrint untuk Development

Dokumen ini berisi langkah-langkah instalasi OtoPrint di lingkungan **development** (localhost).

---

## 📋 Daftar Isi

- [Prasyarat](#-prasyarat)
- [Struktur Folder](#-struktur-folder)
- [Langkah Instalasi](#-langkah-instalasi)
- [Verifikasi Instalasi](#-verifikasi-instalasi)
- [Troubleshooting](#-troubleshooting)
- [Uninstall](#-uninstall)

---

## 📋 Prasyarat

### Software yang Harus Diinstall

| Software | Minimal Versi | Keterangan | Link Download |
|----------|---------------|------------|---------------|
| Node.js | v18 atau lebih tinggi | Wajib untuk menjalankan server | [https://nodejs.org](https://nodejs.org) |
| LibreOffice | Versi terbaru | Wajib untuk konversi DOCX ke PDF | [https://www.libreoffice.org](https://www.libreoffice.org) |
| Git (opsional) | - | Untuk clone repository | [https://git-scm.com](https://git-scm.com) |
| Browser | - | Chrome/Edge/Firefox | - |

### Spesifikasi Hardware (Minimal)

| Komponen | Spesifikasi |
|----------|-------------|
| RAM | 4 GB |
| Storage | 10 GB (termasuk dependencies) |
| Prosesor | Intel Core i3 atau setara |

### Port yang Digunakan

| Port | Aplikasi |
|------|----------|
| 3000 | OtoPrint Server (default) |

> **Catatan:** Pastikan port 3000 tidak digunakan oleh aplikasi lain.

---

## 📁 Struktur Folder

Setelah cloning/download, struktur folder akan seperti ini:

```
WEBAPP-OTOPRINT/
├── backend/
│   ├── server.js
│   ├── pdfGenerator.js
│   ├── signatureInjector.js
│   ├── package.json
│   └── database.sqlite (auto generated)
├── frontend/
│   ├── admin/
│   ├── pages/
│   ├── assets/
│   ├── templates/
│   ├── index.html
│   ├── login.html
│   └── verify.html
├── docs/
│   ├── INSTALLATION.md
│   ├── DEPLOYMENT.md
│   ├── API-DOCS.md
│   ├── USER-GUIDE.md
│   └── CHANGELOG.md
└── package.json
```

---

## 🚀 Langkah Instalasi

### 1. Clone atau Download Repository

**Option A: Clone via Git (Rekomendasi)**
```bash
git clone https://github.com/username/WEBAPP-OTOPRINT.git
cd WEBAPP-OTOPRINT
```

**Option B: Download ZIP**
1. Buka repository di browser
2. Klik "Code" → "Download ZIP"
3. Extract ZIP ke folder `WEBAPP-OTOPRINT`

### 2. Install Node.js (Jika Belum)

**Windows:**
1. Download installer dari https://nodejs.org
2. Pilih versi LTS (misal: 20.x.x)
3. Jalankan installer, klik "Next" terus hingga selesai
4. Centang "Automatically install the necessary tools" jika ada

**Cek instalasi:**
```bash
node --version
# Output contoh: v20.10.0

npm --version
# Output contoh: 10.2.3
```

### 3. Install LibreOffice (WAJIB)

**Windows:**
1. Download installer dari https://www.libreoffice.org
2. Jalankan installer
3. Install di `C:\Program Files\LibreOffice` (default)
4. **Catat path instalasi** karena akan digunakan di konfigurasi

**Cek instalasi:**
```bash
# Windows
dir "C:\Program Files\LibreOffice\program\soffice.exe"

# Seharusnya file ditemukan
```

### 4. Install Dependencies Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install
```

**Dependencies yang akan terinstall:**

| Package | Fungsi |
|---------|--------|
| express | Web framework |
| express-session | Session management |
| sqlite3 | Database SQLite |
| multer | File upload |
| pdf-lib | Manipulasi PDF |
| qrcode | Generate QR Code |
| pdf-to-printer | Cetak ke printer |
| docxtemplater | Manipulasi DOCX |
| pizzip | Baca/write ZIP (untuk DOCX) |

**Proses instalasi memakan waktu 1-3 menit tergantung koneksi internet.**

### 5. Konfigurasi Path LibreOffice (Jika Perlu)

Buka file `backend/pdfGenerator.js` dan cari fungsi `getLibreOfficePath()`:

```javascript
function getLibreOfficePath() {
    const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',  // ← Sesuaikan jika perlu
        'D:\\LibreOffice\\program\\soffice.exe',
    ];
    // ...
}
```

Pastikan path sesuai dengan instalasi LibreOffice di komputer Anda.

### 6. Jalankan Server

```bash
# Pastikan masih di folder backend
cd backend

# Jalankan server
node server.js
```

**Output sukses:**
```
✅ Server running at http://localhost:3000
📁 Frontend path: C:\...\WEBAPP-OTOPRINT\frontend
🔗 Login page: http://localhost:3000/login.html
🔗 Home page: http://localhost:3000/Index.html
```

> **Catatan:** Database `database.sqlite` akan dibuat secara otomatis pada pertama kali server dijalankan.

### 7. Akses Aplikasi

Buka browser dan akses:
- **Landing Page:** http://localhost:3000/
- **Login:** http://localhost:3000/login.html
- **Admin Panel:** http://localhost:3000/admin/insight.html
- **User Dashboard:** http://localhost:3000/pages/dashboard.html

---

## ✅ Verifikasi Instalasi

### Cek Server
```bash
curl http://localhost:3000/api/test
```
**Output yang diharapkan:**
```json
{"message":"Server is running!"}
```

### Cek Database
```bash
# Buka database dengan sqlite3
sqlite3 backend/database.sqlite

# Lihat daftar tabel
.tables

# Keluar
.quit
```

**Tabel yang seharusnya ada:**
- users
- templates
- fields
- template_layouts
- master_signature
- print_logs
- maintenance_settings
- document_verifications

### Cek Login
1. Buka http://localhost:3000/login.html
2. Login sebagai admin:
   - NIM: `20220140027`
   - Password: `admin123`
3. Harus berhasil masuk ke admin panel

### Cek Upload Template
1. Buka admin panel → Template V1
2. Klik "Buat Template Baru"
3. Upload file .docx (contoh: template kosong dengan placeholder `{{nama}}`)
4. Harus berhasil tersimpan

---

## ⚠️ Troubleshooting

### Server Tidak Berjalan

| Masalah | Solusi |
|---------|--------|
| `node: command not found` | Install Node.js terlebih dahulu |
| `Cannot find module 'express'` | Jalankan `npm install` di folder backend |
| `Port 3000 already in use` | Ganti port di server.js atau kill proses yang menggunakan port 3000 |
| `SQLITE_ERROR: unable to open database` | Pastikan folder backend memiliki akses write |

### LibreOffice Error

| Masalah | Solusi |
|---------|--------|
| `LibreOffice tidak ditemukan` | Install LibreOffice atau perbaiki path di `pdfGenerator.js` |
| `Konversi DOCX ke PDF gagal` | Cek file .docx tidak corrupt, coba buka dengan Word |
| `LibreOffice timeout` | File .docx terlalu besar atau kompleks |

### Preview Tidak Muncul

| Masalah | Solusi |
|---------|--------|
| Preview loading terus | Cek koneksi internet (library via CDN) |
| Preview error | Cek console browser (F12) untuk melihat error |
| Template tidak muncul | Pastikan file .docx sudah diupload |

### Database Error

| Masalah | Solusi |
|---------|--------|
| `SQLITE_ERROR: no such table` | Hapus file `database.sqlite` dan restart server (akan dibuat ulang) |
| `SQLITE_CONSTRAINT: UNIQUE constraint failed` | Data duplikat, cek apakah sudah ada sebelumnya |

### Printer Tidak Terdeteksi

| Masalah | Solusi |
|---------|--------|
| Printer tidak muncul di dropdown | Pastikan printer terinstall di Windows |
| Test print gagal | Cek koneksi printer, set sebagai default |
| Cetak tidak keluar | Cek antrian printer, restart print spooler |

---

## 🗑️ Uninstall

### Menghapus OtoPrint

```bash
# 1. Hapus folder proyek
rm -rf WEBAPP-OTOPRINT

# Atau di Windows:
# rmdir /s WEBAPP-OTOPRINT
```

### Menghapus Database (Opsional)
```bash
rm backend/database.sqlite
```

### Menghapus Dependencies (Opsional)
```bash
rm -rf backend/node_modules
```

### Menghapus File Template yang Diupload (Opsional)
```bash
rm -rf frontend/templates/*.docx
```

---

## 📞 Bantuan

Jika mengalami masalah saat instalasi:

1. **Cek Console Browser** (F12) untuk error JavaScript
2. **Cek Terminal** untuk error Node.js
3. **Cek file log** (jika ada)
4. **Hubungi tim pengembang** melalui kontak yang tersedia

---

## ✅ Checklist Instalasi

| Langkah | Status |
|---------|--------|
| Node.js terinstall | ☐ |
| LibreOffice terinstall | ☐ |
| Repository sudah di-clone/download | ☐ |
| Dependencies backend terinstall | ☐ |
| Server berjalan di port 3000 | ☐ |
| Database auto-generated | ☐ |
| Login admin berhasil | ☐ |
| Template bisa diupload | ☐ |

---

**© 2025 Tim Capstone UMY**
```