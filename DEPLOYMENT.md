## 📄 **DEPLOYMENT.md**

```markdown
# 🚀 Deployment OtoPrint ke Vending Machine

Dokumen ini berisi langkah-langkah deployment OtoPrint ke **server production** sebagai vending machine dokumen akademik yang berjalan 24/7.

---

## 📋 Daftar Isi

- [Spesifikasi Server](#-spesifikasi-server)
- [Persiapan Sebelum Deployment](#-persiapan-sebelum-deployment)
- [Instalasi di Server](#-instalasi-di-server)
- [Konfigurasi](#-konfigurasi)
- [Setup Printer](#-setup-printer)
- [Setup Touchscreen (Kiosk Mode)](#-setup-touchscreen-kiosk-mode)
- [Menjalankan Server](#-menjalankan-server)
- [Auto Start](#-auto-start)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Backup & Restore](#-backup--restore)
- [Update OtoPrint](#-update-otoprint)
- [Troubleshooting Deployment](#-troubleshooting-deployment)
- [Checklist Deployment](#-checklist-deployment)

---

## 🖥️ Spesifikasi Server

### Rekomendasi Minimal

| Komponen | Spesifikasi |
|----------|-------------|
| **OS** | Windows 10/11 Pro (64-bit) |
| **RAM** | 4 GB |
| **Storage** | 50 GB (SSD direkomendasikan) |
| **Prosesor** | Intel Core i3 atau setara |
| **Printer** | Terhubung via USB/Ethernet |

### Rekomendasi Ideal

| Komponen | Spesifikasi |
|----------|-------------|
| **OS** | Windows Server 2022 / Windows 11 Pro |
| **RAM** | 8 GB |
| **Storage** | 100 GB SSD |
| **Prosesor** | Intel Core i5 atau setara |
| **Printer** | Printer thermal / inkjet support PDF |

### Mengapa Windows?

- Kompatibilitas driver printer lebih baik
- LibreOffice lebih stabil di Windows
- Mudah dalam maintenance (IT kampus umumnya pakai Windows)

---

## 📦 Persiapan Sebelum Deployment

### Software yang Harus Diinstall

| Software | Versi | Keterangan | Link |
|----------|-------|------------|------|
| Node.js | v18 LTS atau lebih tinggi | Runtime JavaScript | [Download](https://nodejs.org) |
| LibreOffice | Versi terbaru | Konversi DOCX ke PDF | [Download](https://www.libreoffice.org) |
| Git (opsional) | Terbaru | Untuk update kode | [Download](https://git-scm.com) |
| PM2 | Terbaru | Process manager (optional) | `npm install -g pm2` |

### File yang Perlu Disiapkan

```
OTOPRINT-Deployment/
├── backend/
│   ├── server.js
│   ├── pdfGenerator.js
│   ├── signatureInjector.js
│   └── package.json
├── frontend/
│   ├── admin/
│   ├── pages/
│   ├── assets/
│   ├── index.html
│   ├── login.html
│   └── verify.html
└── docs/
    └── (dokumentasi)
```

### Hapus File yang Tidak Perlu (Development)

```bash
# File yang aman dihapus sebelum deploy
del backend\cert.pem
del backend\certificate.pfx
del backend\key.pem
del backend\*.log
```

---

## 🔧 Instalasi di Server

### Langkah 1: Copy File ke Server

```bash
# Buat folder utama
mkdir C:\OTOPRINT

# Copy seluruh folder backend dan frontend
xcopy /E /I /Y "path\source\backend" "C:\OTOPRINT\backend"
xcopy /E /I /Y "path\source\frontend" "C:\OTOPRINT\frontend"
```

### Langkah 2: Install Node.js

1. Download installer dari https://nodejs.org
2. Pilih versi **LTS** (misal: 20.x.x)
3. Jalankan installer dengan **Administrator**
4. Centang "Automatically install the necessary tools"
5. Restart komputer jika diperlukan

**Verifikasi instalasi:**
```bash
node --version
# Output: v20.10.0

npm --version
# Output: 10.2.3
```

### Langkah 3: Install LibreOffice

1. Download installer dari https://www.libreoffice.org
2. Jalankan installer
3. Pilih **Standard Installation**
4. Install di `C:\Program Files\LibreOffice` (default)
5. **Catat path instalasi** untuk konfigurasi nanti

**Verifikasi instalasi:**
```bash
dir "C:\Program Files\LibreOffice\program\soffice.exe"
# File harus ditemukan
```

### Langkah 4: Install Dependencies

```bash
cd C:\OTOPRINT\backend
npm install --production
```

> `--production` hanya install dependencies untuk production (tidak termasuk devDependencies)

### Langkah 5: Setup Database

Database akan **otomatis dibuat** saat pertama kali server dijalankan. Tidak perlu konfigurasi manual.

**Tabel yang akan dibuat:**
- users
- templates
- fields
- template_layouts
- master_signature
- print_logs
- maintenance_settings
- document_verifications

---

## ⚙️ Konfigurasi

### 1. Konfigurasi LibreOffice Path

Edit `C:\OTOPRINT\backend\pdfGenerator.js`:

```javascript
function getLibreOfficePath() {
    const possiblePaths = [
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',  // ← Windows default
        'D:\\LibreOffice\\program\\soffice.exe',
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('✅ LibreOffice ditemukan di:', p);
            return p;
        }
    }
    return null;
}
```

### 2. Konfigurasi Port (Opsional)

Edit `C:\OTOPRINT\backend\server.js`:

```javascript
const PORT = process.env.PORT || 3000;  // Ganti 3000 jika perlu
```

### 3. Konfigurasi Session Timeout (Opsional)

Edit `C:\OTOPRINT\backend\server.js`:

```javascript
app.use(session({
    secret: 'otoprint-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }  // 30 menit, sesuaikan jika perlu
}));
```

### 4. Environment Variables (Opsional)

Buat file `.env` di `C:\OTOPRINT\backend\`:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=otoprint-super-secret-key-change-this
LIBRE_OFFICE_PATH=C:\\Program Files\\LibreOffice\\program\\soffice.exe
```

---

## 🖨️ Setup Printer

### 1. Install Driver Printer

- Install driver printer sesuai merek (Epson, HP, Brother, Canon, dll)
- Pastikan printer terdeteksi di **Control Panel → Devices and Printers**

### 2. Cek Daftar Printer

Jalankan script berikut untuk melihat daftar printer yang terinstall:

```bash
cd C:\OTOPRINT\backend
node -e "const { getPrinters } = require('pdf-to-printer'); getPrinters().then(console.log)"
```

**Output contoh:**
```json
[
  { "name": "EPSON L3110 Series", "isDefault": true },
  { "name": "Microsoft Print to PDF", "isDefault": false }
]
```

### 3. Set Default Printer via Admin Panel

1. Buka `http://localhost:3000/admin/maintenance.html`
2. Login sebagai admin (`20220140027` / `admin123`)
3. Pada bagian **"Pengaturan Printer"**:
   - Pilih printer dari dropdown
   - Klik **"Set Default Printer"**
   - Klik **"Test Print"** untuk verifikasi

### 4. Restart Print Spooler (Jika Printer Tidak Terdeteksi)

```bash
# Buka Command Prompt sebagai Administrator
net stop spooler
net start spooler
```

---

## 🖥️ Setup Touchscreen (Kiosk Mode)

### Chrome Kiosk Mode (Rekomendasi)

Buat shortcut di Desktop dengan target:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --disable-pinch --overscroll-history-navigation=0 --incognito http://localhost:3000
```

**Parameter yang digunakan:**
| Parameter | Fungsi |
|-----------|--------|
| `--kiosk` | Mode layar penuh tanpa toolbar |
| `--disable-pinch` | Nonaktifkan zoom pinch (touchscreen) |
| `--overscroll-history-navigation=0` | Nonaktifkan swipe back/forward |
| `--incognito` | Tidak menyimpan history (opsional) |

### Edge Kiosk Mode

```bash
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --edge-kiosk-type=fullscreen http://localhost:3000
```

### Firefox Kiosk Mode

```bash
"C:\Program Files\Mozilla Firefox\firefox.exe" -kiosk http://localhost:3000
```

### Auto Login (Opsional)

Agar tidak perlu login setiap restart, tambahkan endpoint di `server.js`:

```javascript
// Endpoint untuk auto login demo (HANYA untuk vending machine)
app.get('/api/auto-login', (req, res) => {
    // Hanya aktifkan jika IP dari localhost
    if (req.ip === '::1' || req.ip === '127.0.0.1') {
        req.session.user = { id: 2, nim: '20220140055', name: 'Andi Granityo', role: 'user' };
        res.redirect('/pages/dashboard.html');
    } else {
        res.redirect('/login.html');
    }
});
```

Kemudian arahkan browser ke `http://localhost:3000/api/auto-login`

---

## 🚀 Menjalankan Server

### Cara 1: Manual (Untuk Testing)

```bash
cd C:\OTOPRINT\backend
node server.js
```

### Cara 2: Dengan PM2 (Rekomendasi untuk Production)

**Install PM2:**
```bash
npm install -g pm2
```

**Start server dengan PM2:**
```bash
cd C:\OTOPRINT\backend
pm2 start server.js --name otoprint
```

**Perintah PM2 yang Berguna:**
```bash
# Lihat status
pm2 status

# Lihat log
pm2 logs otoprint

# Restart server
pm2 restart otoprint

# Stop server
pm2 stop otoprint

# Save konfigurasi (agar bisa auto start)
pm2 save

# Setup startup (agar PM2 berjalan saat boot)
pm2 startup
```

### Cara 3: Windows Service (dengan node-windows)

```bash
npm install -g node-windows
cd C:\OTOPRINT\backend
npm install node-windows --save
```

Buat file `service.js`:

```javascript
const Service = require('node-windows').Service;
const svc = new Service({
    name: 'OtoPrint',
    description: 'OtoPrint Vending Machine Service',
    script: 'C:\\OTOPRINT\\backend\\server.js',
    nodeOptions: ['--max-old-space-size=512']
});

svc.on('install', () => svc.start());
svc.install();
```

---

## 🔄 Auto Start

### Opsi 1: PM2 (Rekomendasi)

```bash
# Install PM2
npm install -g pm2

# Start dan save
cd C:\OTOPRINT\backend
pm2 start server.js --name otoprint
pm2 save

# Generate startup script
pm2 startup
# Copy dan jalankan perintah yang diberikan
```

### Opsi 2: Windows Task Scheduler

1. Buka **Task Scheduler**
2. Klik **Create Basic Task**
3. Name: `OtoPrint Server`
4. Trigger: **When the computer starts**
5. Action: **Start a program**
   - Program: `node`
   - Arguments: `C:\OTOPRINT\backend\server.js`
   - Start in: `C:\OTOPRINT\backend`
6. Finish

### Opsi 3: Startup Folder (Paling Sederhana)

Buat file `start.bat` di `C:\OTOPRINT\`:

```batch
@echo off
cd /d C:\OTOPRINT\backend
node server.js
```

Buat shortcut dari `start.bat` dan copy ke:

```
shell:startup
```

---

## 📊 Monitoring & Maintenance

### Health Check Endpoint

Tambahkan endpoint di `server.js`:

```javascript
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        db: 'connected'
    });
});
```

### Monitoring dengan PM2

```bash
# Monitoring real-time
pm2 monit

# Lihat log
pm2 logs otoprint --lines 100
```

### Log Harian

PM2 akan menyimpan log di:
```
C:\Users\%USERNAME%\.pm2\logs\
```

---

## 💾 Backup & Restore

### Backup Database

```bash
# Backup manual
copy C:\OTOPRINT\backend\database.sqlite C:\backup\db_%date:~0,4%%date:~5,2%%date:~8,2%.sqlite

# Backup dengan script (backup.bat)
@echo off
set DATESTR=%date:~0,4%%date:~5,2%%date:~8,2%
copy C:\OTOPRINT\backend\database.sqlite C:\backup\otoprint_db_%DATESTR%.sqlite
echo Backup completed: otoprint_db_%DATESTR%.sqlite
```

### Backup Template Files

```bash
# Backup semua template .docx
xcopy /E /I "C:\OTOPRINT\frontend\templates" "C:\backup\templates_%date:~0,4%%date:~5,2%%date:~8,2%"
```

### Restore Database

```bash
# Stop server
pm2 stop otoprint

# Restore database
copy C:\backup\database_backup.sqlite C:\OTOPRINT\backend\database.sqlite

# Start server
pm2 start otoprint
```

### Auto Backup (Schedule)

Buat task scheduler untuk menjalankan `backup.bat` setiap hari jam 01:00.

---

## 🔄 Update OtoPrint

### Cara Update Kode

```bash
# 1. Stop server
pm2 stop otoprint

# 2. Backup database
copy C:\OTOPRINT\backend\database.sqlite C:\backup\db_before_update.sqlite

# 3. Pull perubahan (jika pakai git)
cd C:\OTOPRINT
git pull

# 4. Update dependencies (jika ada perubahan)
cd backend
npm install --production

# 5. Restart server
pm2 restart otoprint

# 6. Cek log
pm2 logs otoprint --lines 50
```

### Rollback Jika Error

```bash
# 1. Stop server
pm2 stop otoprint

# 2. Restore database
copy C:\backup\db_before_update.sqlite C:\OTOPRINT\backend\database.sqlite

# 3. Restore kode (jika perlu)
git reset --hard HEAD~1

# 4. Restart server
pm2 restart otoprint
```

---

## ⚠️ Troubleshooting Deployment

| Masalah | Solusi |
|---------|--------|
| **Server tidak berjalan** | Cek Node.js version (`node --version`), minimal v18 |
| **Port 3000 sudah dipakai** | Ganti port di server.js atau kill proses yang menggunakan: `netstat -ano \| findstr :3000` |
| **LibreOffice error** | Cek path, reinstall LibreOffice, coba run as administrator |
| **Preview PDF gagal** | Cek file .docx tidak corrupt, coba upload ulang, cek LibreOffice |
| **Printer tidak terdeteksi** | Restart print spooler, reinstall driver, cek koneksi USB |
| **Session logout terus** | Perbesar maxAge di session config, cek cookie settings |
| **Database locked** | Hapus file `database.sqlite-journal` jika ada, restart server |
| **Memory leak** | Restart server secara periodik (gunakan PM2 auto restart) |
| **Request timeout** | Perbesar timeout di `server.js`, cek koneksi jaringan |

### Debugging Commands

```bash
# Cek Node.js process
tasklist | findstr node

# Cek port usage
netstat -ano | findstr :3000

# Cek log error
pm2 logs otoprint --err

# Cek database integrity
sqlite3 C:\OTOPRINT\backend\database.sqlite "PRAGMA integrity_check;"
```

---

## ✅ Checklist Deployment

| No | Langkah | Status |
|----|---------|--------|
| 1 | Server sudah diinstall Windows | ☐ |
| 2 | Node.js terinstall (v18+) | ☐ |
| 3 | LibreOffice terinstall | ☐ |
| 4 | Driver printer terinstall | ☐ |
| 5 | File OtoPrint sudah dicopy ke server | ☐ |
| 6 | Dependencies backend terinstall | ☐ |
| 7 | Path LibreOffice sudah dikonfigurasi | ☐ |
| 8 | Server berjalan di port 3000 | ☐ |
| 9 | Database auto-generated | ☐ |
| 10 | Login admin berhasil | ☐ |
| 11 | Upload template berhasil | ☐ |
| 12 | Printer sudah diset default | ☐ |
| 13 | Test print berhasil | ☐ |
| 14 | Touchscreen mode sudah diatur | ☐ |
| 15 | Auto start sudah dikonfigurasi | ☐ |
| 16 | Backup sudah diatur | ☐ |
| 17 | Monitoring sudah diatur | ☐ |

---

## 📞 Kontak & Dukungan

**Tim Pengembang OtoPrint**  
Universitas Muhammadiyah Yogyakarta

---

**© 2025 Tim Capstone UMY**
```

**Silakan copas seluruh kode di atas ke file `DEPLOYMENT.md` Anda.** ✅