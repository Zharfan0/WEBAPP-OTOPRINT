## 📄 **CHANGELOG.md**

```markdown
# 📝 Changelog OtoPrint

Semua perubahan penting pada proyek OtoPrint akan dicatat di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2025-01-15

### 🎉 Initial Release

#### ✨ Added

**Backend:**
- Server Node.js dengan Express framework
- Database SQLite dengan auto-create tables
- Session management (30 menit timeout)
- Role-based access control (admin/user)
- Endpoint login, logout, check session
- Upload file template (.docx) dengan multer
- Manajemen field CRUD
- Manajemen master signature (tanda tangan dosen)
- Konversi DOCX ke PDF via LibreOffice
- Generate QR Code verifikasi
- Cetak ke printer fisik via pdf-to-printer
- Print logs dan statistik
- Maintenance settings (stok kertas, tinta, printer)
- Endpoint public untuk halaman utama
- AFK Timeout middleware (45 detik)

**Admin Panel:**
- Insight dashboard dengan statistik cetak
- Chart dokumen terpopuler (bar chart)
- Chart jam sibuk penggunaan (line chart)
- Filter statistik berdasarkan rentang tanggal
- Log cetak lengkap dengan filter (tanggal, dokumen, user)
- Export log ke CSV
- Pagination untuk data banyak
- Template management (upload, edit, hapus)
- Field management (tambah, edit, hapus, urutkan)
- Master signature management (tambah, edit, hapus)
- Maintenance settings (stok kertas, tinta, printer)
- Pilih printer default dari dropdown
- Test print untuk verifikasi printer
- Log maintenance activity

**User Panel:**
- Dashboard dengan daftar template (card touch-friendly)
- Form generator otomatis dari field database
- Field MANUAL (user input dengan validasi)
- Field AUTO_KRS (auto dari session - tidak ditampilkan)
- Field SYSTEM (auto generate - tidak ditampilkan)
- Field MASTER_SIGNATURE (tidak ditampilkan)
- Preview dokumen sebelum cetak
- Cetak langsung ke printer (tanpa popup)
- Halaman sukses setelah cetak
- AFK Timeout (45 detik → peringatan → 15 detik → logout)

**Template V1 (Placeholder Based):**
- Placeholder format `{{field_name}}` di file .docx
- Scan placeholder otomatis dari file .docx menggunakan mammoth
- Dropdown field name dari hasil scan
- Urutan field manual dengan tombol ↑↓
- Preview dokumen dengan iframe PDF
- Sticky preview di modal edit template

**Template V2 (Layout Visual):**
- Editor layout visual (drag & drop box)
- Grid background A4 sebagai panduan
- Mode seleksi QR (drag area)
- Tambah field teks dengan drag & drop
- Resize box (tarik sudut kanan-bawah)
- Hapus box dengan tombol ❌
- Simpan layout ke database (tabel template_layouts)
- Load layout yang sudah tersimpan

**QR Code Verifikasi:**
- Generate doc_uuid unik (format: `OTP-{timestamp}-{random}`)
- QR Code di pojok kanan bawah dokumen
- Teks "AUTHENTICATION" di bawah QR
- Halaman verifikasi publik (/verify.html)
- Endpoint API verifikasi (/api/verify/:uuid)
- Status verifikasi: "DOKUMEN ASLI" atau "TIDAK VALID"
- Informasi lengkap (nama, NIM, jenis dokumen, tanggal cetak)

**Public Pages:**
- Landing page (/index.html) dengan informasi sistem
- Halaman login touchscreen friendly
- Halaman verifikasi QR Code

**Fitur Touchscreen:**
- Touch target minimal 56px untuk semua tombol
- Input field besar (padding 18px)
- Efek sentuh (scale transform)
- Font lebih besar untuk keterbacaan
- Haptic vibration (navigator.vibrate)

**Fitur Keamanan:**
- Session management (30 menit)
- Role-based access control
- Escape karakter XML untuk mencegah error
- Validasi input di frontend & backend

---

#### 🔧 Fixed

- Konversi DOCX ke PDF dengan fallback dummy PDF jika LibreOffice error
- Validasi input form (required field, format NIM)
- Session tidak hilang saat refresh halaman
- Error handling untuk file template corrupt
- Duplikasi field name dicegah
- Scroll issue pada modal edit template (sticky preview)

---

#### 🗑️ Removed

- Kode yang tidak terpakai (console.log development)
- File sertifikat contoh (cert.pem, key.pem, certificate.pfx)
- Duplikasi package.json (sekarang hanya di backend)

---

#### 📚 Documentation

- README.md (gambaran umum proyek)
- INSTALLATION.md (panduan instalasi development)
- DEPLOYMENT.md (panduan deploy ke vending machine)
- API-DOCS.md (dokumentasi endpoint API)
- USER-GUIDE.md (panduan penggunaan admin & user)
- CHANGELOG.md (riwayat perubahan)

---

## [0.9.0] - 2025-01-10

### Beta Testing Release

#### Added
- Fitur dasar cetak dokumen
- Preview dokumen sederhana
- Login dengan NIM dan password
- Template dasar dengan placeholder

#### Fixed
- Bug konversi DOCX ke PDF
- Error handling untuk file tidak ditemukan

---

## [0.8.0] - 2025-01-01

### Alpha Testing Release

#### Added
- Prototype awal sistem
- Upload template .docx
- Generate PDF sederhana

#### Known Issues
- Konversi DOCX ke PDF belum stabil
- Preview belum akurat
- Belum ada QR Code verifikasi

---

## 🚀 Planned for Future Releases

### [1.1.0] - (Rencana)

#### 🔜 In Progress / Planned

- [ ] **Integrasi RFID Login**
  - Baca kartu RFID mahasiswa untuk login otomatis
  - Halaman khusus untuk scan kartu
  - Registrasi RFID card ke akun user

- [ ] **Tanda Tangan Elektronik Tersertifikasi (PSrE)**
  - Integrasi dengan PSrE (Privy/VIDA)
  - Digital signature dengan sertifikat resmi
  - Validasi hukum dokumen

- [ ] **Multi-Printer Support**
  - Load balancing antar printer
  - Fallback jika printer rusak
  - Status printer real-time

- [ ] **Notifikasi**
  - Telegram bot untuk notifikasi admin
  - WhatsApp notification untuk user
  - Email notifikasi untuk verifikasi dokumen

- [ ] **Laporan Export**
  - Export statistik ke Excel
  - Export log cetak ke PDF
  - Laporan bulanan otomatis

- [ ] **Dashboard User Enhancement**
  - Riwayat cetak pribadi user
  - Status verifikasi dokumen
  - Profil user

- [ ] **Auto Backup Database**
  - Backup otomatis setiap hari
  - Restore dari backup via admin panel
  - Export/import data

- [ ] **HTTPS Support**
  - Konfigurasi SSL certificate
  - Redirect HTTP ke HTTPS
  - Security headers

- [ ] **Multi-language Support**
  - Bahasa Indonesia
  - Bahasa Inggris (fallback)

---

## 📊 Versi Summary

| Versi | Tanggal | Status | Keterangan |
|-------|---------|--------|------------|
| 1.0.0 | 15 Jan 2025 | ✅ Released | Initial production release |
| 0.9.0 | 10 Jan 2025 | ✅ Released | Beta testing |
| 0.8.0 | 1 Jan 2025 | ✅ Released | Alpha testing |

---

## 👥 Kontributor

| Nama | Role | Kontribusi |
|------|------|------------|
| Ahmad Ilman | Developer | Backend, API, Database |
| Andi Granityo | Developer | Frontend, UI/UX |
| Muhammad Zharfan | Developer | QR Code, Verifikasi |
| Muhammad Ikram | Developer | Template, Layout V2 |

---

## 📞 Laporan Bug / Feature Request

Jika menemukan bug atau ingin mengajukan feature request, silakan hubungi tim pengembang melalui:

- Email: [email tim]
- GitHub Issues: [link repository]
- Kontak langsung: [nomor kontak]

---

**Format Entri Baru:**

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- Fitur baru yang ditambahkan

### Changed
- Perubahan pada fitur existing

### Fixed
- Bug yang diperbaiki

### Removed
- Fitur yang dihapus

### Security
- Perbaikan keamanan
```

---

**© 2025 Tim Capstone UMY**
```
