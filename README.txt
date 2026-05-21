╔═══════════════════════════════════════════════════════════════════════════════╗
║                              OTOPRINT VENDING MACHINE                          ║
║                    Sistem Digitalisasi Dokumen Akademik Mandiri                ║
╚═══════════════════════════════════════════════════════════════════════════════╝


📁 STRUKTUR FOLDER
================================================================================

WEBAPP-OTOPRINT/
├── backend/
│   ├── server.js                 (Main server - Node.js/Express)
│   ├── database.sqlite           (Database SQLite)
│   ├── certificate.pfx           (Sertifikat digital untuk tanda tangan - opsional)
│   └── node_modules/
│
├── frontend/
│   ├── index.html                (Landing page publik)
│   ├── login.html                (Halaman login - Touchscreen friendly)
│   │
│   ├── pages/
│   │   ├── dashboard.html        (Dashboard user - dinamis, Touchscreen)
│   │   ├── form-generator.html   (Form auto-generate dari field)
│   │   └── preview-generator.html (Preview & cetak dokumen)
│   │
│   ├── admin/
│   │   ├── insight.html          (Statistik cetak, chart, filter tanggal)
│   │   ├── logs.html             (Riwayat cetak, filter, export CSV)
│   │   ├── templates.html        (Kelola template + field dinamis)
│   │   └── maintenance.html      (Stok kertas, tinta, printer settings)
│   │
│   ├── assets/
│   │   └── images/
│   │       ├── gedung-umy.jpg
│   │       ├── modal-afk.png
│   │       └── logo-umy3.png
│   │
│   └── templates/                (File .docx template)
│       ├── template_xxxxx.docx
│       └── ...
│
└── package.json


👥 AKUN DEMO
================================================================================

| ID | NIM          | Nama                   | Role    | Password  |
|----|--------------|------------------------|---------|-----------|
| 1  | 20220140027  | Ahmad Ilman            | admin   | admin123  |
| 2  | 20220140055  | Andi Granityo          | user    | user123   |
| 3  | 20220140079  | Muhammad Zharfan       | user    | user123   |
| 4  | 20220140107  | Muhammad Ikram         | user    | user123   |


✨ FITUR LENGKAP
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN PANEL                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Insight                                                                  │
│    - Statistik cetak (hari ini, minggu ini, total)                          │
│    - Filter statistik berdasarkan rentang tanggal                           │
│    - Chart dokumen terpopuler (dengan warna berbeda)                        │
│    - Chart jam sibuk penggunaan (line chart)                                │
│    - Status printer (stok kertas & level tinta)                             │
│                                                                             │
│ 2. Log Cetak                                                                │
│    - Riwayat lengkap semua aktivitas cetak                                  │
│    - Filter berdasarkan tanggal, jenis dokumen, pencarian NIM/nama          │
│    - Export data ke CSV                                                     │
│    - Pagination untuk data banyak                                           │
│                                                                             │
│ 3. Template Management                                                      │
│    - Upload file template .docx                                             │
│    - Buat field dinamis dengan atribut:                                     │
│      * Field Name (placeholder di template: {{field_name}})                 │
│      * Label (tampilan di form user)                                        │
│      * Field Type (text, number, date, qr)                                  │
│      * Data Source (MANUAL, AUTO_KRS, SYSTEM)                               │
│      * Source Key (key untuk AUTO_KRS/SYSTEM)                               │
│      * Order (urutan tampil di form user)                                   │
│    - Edit/hapus template dan field                                          │
│                                                                             │
│ 4. Maintenance & Pengaturan                                                 │
│    - Atur stok kertas (dalam lembar)                                        │
│    - Atur level tinta (dalam persen)                                        │
│    - Reset ke nilai default (500 kertas, 75% tinta)                         │
│    - Pilih printer default dari daftar printer terinstall                   │
│    - Test print untuk memverifikasi printer                                 │
│    - Log aktivitas maintenance                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ USER PANEL (Touchscreen Friendly)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Dashboard                                                                │
│    - Menampilkan daftar template yang tersedia dari database                │
│    - Card dokumen dengan icon dan nama (touch-friendly)                     │
│    - Nama user dinamis dari session                                         │
│                                                                             │
│ 2. Form Generator (Auto-generate)                                           │
│    - Form dibuat otomatis berdasarkan field database                        │
│    - Field MANUAL: user mengisi langsung                                    │
│    - Field AUTO_KRS: otomatis terisi dari session (dummy)                   │
│    - Field SYSTEM: tidak ditampilkan (auto generate di preview)             │
│    - Validasi input (required, format NIM 11 digit, dll)                    │
│    - Desain touchscreen (tombol besar, input besar)                         │
│                                                                             │
│ 3. Preview Generator                                                        │
│    - Preview dokumen menggunakan library docx-preview                       │
│    - Replace placeholder {{field_name}} dengan data                         │
│    - Tampilkan loading saat memproses                                       │
│    - QR Code verifikasi di pojok kanan bawah                                │
│                                                                             │
│ 4. Cetak Langsung (Vending Machine)                                         │
│    - Klik "Cetak Sekarang" → langsung kirim ke printer                      │
│    - Tidak ada popup, tidak ada download (kecuali fallback)                 │
│    - Simpan ke print_logs                                                   │
│    - Kurangi stok kertas otomatis                                           │
│    - Tampilkan halaman sukses                                               │
│                                                                             │
│ 5. AFK Timeout (Away From Keyboard)                                         │
│    - Khusus untuk role USER                                                 │
│    - 45 detik tidak aktif → muncul modal peringatan                         │
│    - Jika tidak respons, logout otomatis                                    │
└─────────────────────────────────────────────────────────────────────────────┘


🔧 TEKNOLOGI YANG DIGUNAKAN
================================================================================

| Kategori        | Teknologi                                          |
|-----------------|----------------------------------------------------|
| Backend         | Node.js, Express, SQLite3                         |
| Frontend        | HTML5, CSS3, Bootstrap 5, JavaScript              |
| Library         | Chart.js, JSZip, docx-preview, pdf-to-printer     |
|                 | multer, pdf-lib, qrcode, pdf-parse                |
| Konversi DOCX   | LibreOffice (diharuskan terinstall)               |
| Lainnya         | express-session                                   |


📋 DATA SOURCE FIELD
================================================================================

| Data Source | Fungsi                          | Status          |
|-------------|---------------------------------|-----------------|
| MANUAL      | User mengisi sendiri di form    | ✅ Berfungsi    |
| AUTO_KRS    | Data otomatis dari session      | ✅ Dummy        |
| SYSTEM      | Auto generate (tanggal, QR)     | ✅ Berfungsi    |


🔐 FITUR KEAMANAN
================================================================================

- Session management dengan express-session (30 menit)
- Role-based access control (admin vs user)
- AFK Timeout untuk user (45 detik)
- Validasi input di frontend & backend
- Escape karakter XML untuk mencegah error


🖨️ PERSYARATAN PRINTER (UNTUK VENDING MACHINE)
================================================================================

1. Printer harus terhubung ke komputer server
2. Set printer sebagai default Windows (atau pilih via menu Maintenance)
3. Install LibreOffice (untuk konversi DOCX ke PDF)
   - Download: https://www.libreoffice.org/
   - Install di: D:\LibreOffice (atau sesuaikan path di server.js)


📝 CATATAN PENTING
================================================================================

1. Template menggunakan placeholder {{field_name}} di file .docx
2. Data AUTO_KRS saat ini masih dummy:
   - name: dari session user
   - nim: dari session user
   - prodi: 'Teknologi Informasi'
   - ipk: '3.75'
   - sks: '110'
3. File template disimpan sebagai file fisik di folder frontend/templates/
4. QR Code verifikasi muncul di pojok kanan bawah dokumen hasil cetak
5. Preview dokumen tidak menampilkan gambar QR (karena library docx-preview)


🚀 CARA MENJALANKAN
================================================================================

1. Buka terminal / command prompt

2. Masuk ke folder backend:
   cd backend

3. Install dependencies (hanya sekali):
   npm install

4. Jalankan server:
   node server.js

5. Buka browser dan akses:
   http://localhost:3000/login.html


📦 INSTALLASI DEPENDENCIES (LENGKAP)
================================================================================

```bash
cd backend
npm install express sqlite3 express-session multer
npm install pdf-to-printer docx-pdf pdf-lib qrcode pdf-parse
npm install chart.js bootstrap bootstrap-icons jszip
npm install child_process
npm install docxtemplater pizzip docxtemplater-image-module-free
npm install pdf-lib qrcode

TROUBLESHOTING
Masalah	                 |   Solusi
Server tidak berjalan	 |  Cek Node.js version (min v14)
Library tidak ditemukan	 |   Jalankan npm install di folder backend
Konversi DOCX gagal	     |   Pastikan LibreOffice terinstall dan path benar
Printer tidak merespon	 |   Cek koneksi printer, set sebagai default
Preview tidak muncul	 |   Cek koneksi internet (library docx-preview via CDN)
QR Code tidak muncul	 |   Pastikan template memiliki placeholder {QR_MARKER}