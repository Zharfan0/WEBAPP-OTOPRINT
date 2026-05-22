## 📄 **USER-GUIDE.md**

```markdown
# 📖 Panduan Penggunaan OtoPrint

Panduan lengkap untuk **Admin** dan **User (Mahasiswa)** dalam menggunakan sistem OtoPrint.

---

## 📋 Daftar Isi

- [Login](#-login)
- [Panduan Admin](#-panduan-admin)
  - [Insight Dashboard](#1-insight-dashboard)
  - [Log Cetak](#2-log-cetak)
  - [Manajemen Template V1](#3-manajemen-template-v1)
  - [Manajemen Template V2 (Layout Visual)](#4-manajemen-template-v2-layout-visual)
  - [Master Signature](#5-master-signature)
  - [Maintenance](#6-maintenance)
- [Panduan User (Mahasiswa)](#-panduan-user-mahasiswa)
  - [Dashboard](#1-dashboard)
  - [Form Isi Data](#2-form-isi-data)
  - [Preview & Cetak](#3-preview--cetak)
  - [Verifikasi Dokumen](#4-verifikasi-dokumen)
- [FAQ](#-faq)
- [Troubleshooting](#-troubleshooting)

---

## 🔐 Login

### Halaman Login
Buka `http://localhost:3000/login.html`

### Akun Demo

| Role | NIM | Password |
|------|-----|----------|
| **Admin** | 20220140027 | admin123 |
| **User** | 20220140055 | user123 |
| **User** | 20220140079 | user123 |
| **User** | 20220140107 | user123 |

### Cara Login
1. Masukkan NIM (atau email) di kolom pertama
2. Masukkan password
3. Klik tombol **"Log In"**
4. Sistem akan redirect sesuai role:
   - Admin → Halaman Insight
   - User → Halaman Dashboard

> **Tips:** Gunakan keyboard numeric untuk input NIM (touchscreen friendly)

---

## 👨‍💼 Panduan Admin

Setelah login sebagai admin, Anda akan melihat sidebar dengan menu berikut:

```
┌─────────────────────────────┐
│  📊 Insight                 │
│  📋 Log Cetak               │
│  📄 Template V1             │
│  🎨 Template V2             │
│  ✍️ Master Signature        │
│  🔧 Maintenance             │
│  🚪 Logout                  │
└─────────────────────────────┘
```

---

### 1. Insight Dashboard

**Menu:** Sidebar → Insight

Halaman ini menampilkan statistik penggunaan sistem.

#### Fitur:

| Komponen | Deskripsi |
|----------|-----------|
| **Card Statistik** | Total cetak hari ini, minggu ini, dan keseluruhan |
| **Chart Dokumen Populer** | Menampilkan dokumen yang paling sering dicetak (bar chart) |
| **Chart Jam Sibuk** | Menampilkan jam penggunaan tertinggi (line chart) |
| **Filter Tanggal** | Filter statistik berdasarkan rentang tanggal |
| **Status Printer** | Menampilkan stok kertas dan level tinta |

#### Cara Filter Tanggal:
1. Pilih **"Dari Tanggal"** (kalender)
2. Pilih **"Sampai Tanggal"** (kalender)
3. Klik **"Terapkan Filter"**
4. Data statistik akan berubah sesuai rentang tanggal

---

### 2. Log Cetak

**Menu:** Sidebar → Log Cetak

Halaman ini menampilkan riwayat lengkap semua aktivitas cetak.

#### Fitur:

| Fitur | Deskripsi |
|-------|-----------|
| **Tabel Riwayat** | Menampilkan NIM, Nama, Jenis Dokumen, Tanggal Cetak |
| **Filter Tanggal** | Filter berdasarkan rentang tanggal |
| **Filter Dokumen** | Filter berdasarkan jenis dokumen (dropdown) |
| **Pencarian** | Cari berdasarkan NIM atau Nama |
| **Export CSV** | Download data log dalam format CSV |
| **Pagination** | Navigasi halaman untuk data banyak |

#### Cara Export CSV:
1. Terapkan filter yang diinginkan (opsional)
2. Klik tombol **"Export CSV"**
3. File akan terdownload otomatis
4. Buka dengan Excel atau aplikasi spreadsheet lainnya

---

### 3. Manajemen Template V1

**Menu:** Sidebar → Template V1

Template V1 menggunakan sistem **placeholder** di file .docx (contoh: `{{nama_mahasiswa}}`).

#### 3.1 Buat Template Baru

1. Klik tombol **"Buat Template Baru"**
2. Isi form:
   - **Nama Dokumen (Indonesia)** : Contoh "Surat Aktif Kuliah"
   - **Nama Dokumen (Inggris)** : Contoh "Certificate of Enrollment"
   - **File Template (.docx)** : Upload file Word yang sudah berisi placeholder
3. Klik **"Simpan Template"**

#### 3.2 Edit Template & Field

1. Pada card template, klik tombol **"Edit"**
2. Akan muncul modal dengan 2 kolom:
   - **Kiri:** Form edit template + daftar field
   - **Kanan:** Preview dokumen (sticky)
3. Untuk menambah field, klik **"Tambah Field"**

#### 3.3 Form Tambah Field

| Field | Deskripsi | Wajib |
|-------|-----------|-------|
| **Placeholder** | Pilih dari dropdown (otomatis dari scan DOCX) | ✅ |
| **Sumber Data** | Pilih sumber data | ✅ |
| **Label** | Tampilan di form user (untuk Manual) | ❌ |
| **Urutan** | Urutan tampil di form user | ❌ |

**Pilihan Sumber Data:**

| Sumber Data | Fungsi | Tampil di Form |
|-------------|--------|----------------|
| **Manual** | User mengisi sendiri | ✅ Ya (wajib isi) |
| **Auto KRS** | Data otomatis dari database | ❌ Tidak (backend isi) |
| **System** | Auto generate (tanggal, nomor surat) | ❌ Tidak |
| **Tanda Tangan** | Signature dari Master Signature | ❌ Tidak |

#### 3.4 Mengatur Urutan Field

Field dengan sumber data **Manual** dapat diatur urutannya:

- Klik tombol **↑** untuk naik
- Klik tombol **↓** untuk turun
- Urutan akan otomatis tersimpan

> **Catatan:** Field Auto KRS, System, dan Tanda Tangan tidak bisa diurutkan dan akan muncul di bagian bawah.

#### 3.5 Edit Field

1. Pada daftar field, klik tombol **✏️ (Edit)**
2. Ubah data yang diperlukan
3. Klik **"Simpan Field"**

#### 3.6 Hapus Field

1. Pada daftar field, klik tombol **🗑️ (Hapus)**
2. Konfirmasi penghapusan

#### 3.7 Hapus Template

1. Pada card template, klik tombol **"Hapus"**
2. Konfirmasi penghapusan
3. **Peringatan:** Semua field akan ikut terhapus

---

### 4. Manajemen Template V2 (Layout Visual)

**Menu:** Sidebar → Template V2

Template V2 menggunakan sistem **layout visual** (drag & drop box) untuk menempatkan field dan QR.

#### 4.1 Buat Template V2

1. Klik tombol **"Buat Template Baru (V2)"**
2. Isi nama dokumen dan upload file .docx
3. Setelah save, akan redirect ke **Editor Layout V2**

#### 4.2 Editor Layout V2

**Komponen Editor:**

| Komponen | Fungsi |
|----------|--------|
| **Preview Area** | Menampilkan background grid (A4) sebagai panduan |
| **Mode QR** | Aktifkan mode seleksi untuk menempatkan QR/Signature |
| **Field Teks** | Tambah box field teks (drag & drop) |
| **Simpan** | Simpan layout ke database |

**Cara Menambah Field Teks:**
1. Klik tombol **"+ Field Teks"**
2. Isi Field Name dan Label
3. Atur lebar/tinggi (opsional)
4. Klik **"Tambah"**
5. Box akan muncul di tengah halaman
6. Drag box ke posisi yang diinginkan
7. Resize dengan menarik sudut kanan-bawah box

**Cara Menambah QR / Signature:**
1. Klik tombol **"Mode QR"** (tombol akan berubah warna)
2. Klik dan drag di area dokumen untuk membuat selection box
3. Akan muncul modal pilih:
   - **QR Code** → QR verifikasi
   - **Signature Langsung** → Gambar tanda tangan
4. Pilih dosen dari dropdown
5. Klik **"Tempatkan"**
6. Box akan muncul di area yang dipilih

**Cara Mengatur Box:**
- **Drag** untuk memindahkan posisi
- **Sudut kanan-bawah** untuk resize
- **Klik ❌** untuk menghapus box

**Cara Menyimpan Layout:**
- Klik tombol **"Simpan"**
- Layout akan tersimpan ke database

---

### 5. Master Signature

**Menu:** Sidebar → Master Signature

Halaman untuk mengelola tanda tangan dosen yang akan digunakan di template.

#### 5.1 Tambah Tanda Tangan

1. Klik tombol **"Tambah Signature"**
2. Isi form:
   - **Nama Dosen** : Nama lengkap
   - **NIP** : Nomor Induk Pegawai
   - **Jabatan** : Dekan, Kaprodi, dll
   - **Upload Gambar** : File tanda tangan (.png/.jpg)
   - **Status** : Aktif / Tidak Aktif
3. Klik **"Simpan"**

#### 5.2 Edit Tanda Tangan

1. Klik tombol **✏️ (Edit)** pada card signature
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

#### 5.3 Hapus Tanda Tangan

1. Klik tombol **🗑️ (Hapus)** pada card signature
2. Konfirmasi penghapusan

---

### 6. Maintenance

**Menu:** Sidebar → Maintenance

Halaman untuk mengatur printer, stok kertas, dan level tinta.

#### 6.1 Atur Printer

1. Pilih printer dari dropdown **"Pilih Printer"**
2. Klik **"Set Default Printer"**
3. Klik **"Test Print"** untuk verifikasi printer berfungsi

#### 6.2 Atur Stok Kertas

1. Masukkan jumlah stok kertas (dalam lembar)
2. Klik **"Update Stok"**
3. Sistem akan menampilkan peringatan jika stok di bawah threshold (100 lembar)

#### 6.3 Atur Level Tinta

1. Masukkan level tinta (dalam persen, 0-100)
2. Klik **"Update Tinta"**
3. Sistem akan menampilkan peringatan jika tinta di bawah threshold (20%)

#### 6.4 Reset ke Default

Klik tombol **"Reset ke Default"** untuk mengatur ulang ke nilai awal:
- Stok kertas: 500 lembar
- Level tinta: 75%

#### 6.5 Log Maintenance

Halaman mencatat riwayat perubahan maintenance:
- Perubahan stok kertas
- Perubahan level tinta
- Perubahan printer
- Test print

---

## 👤 Panduan User (Mahasiswa)

Setelah login sebagai user, Anda akan melihat dashboard dengan kartu-kartu dokumen.

### 1. Dashboard

**Menu:** Setelah login (halaman awal user)

Halaman ini menampilkan semua template dokumen yang tersedia.

#### Cara Memilih Dokumen:
1. Lihat kartu dokumen yang tersedia
2. Klik pada kartu atau tombol **"Buat Dokumen"**
3. Akan redirect ke halaman form isi data

---

### 2. Form Isi Data

Halaman ini menampilkan form yang dibuat otomatis berdasarkan field dari template.

#### Komponen Form:

| Komponen | Deskripsi |
|----------|-----------|
| **Field Manual** | Input yang harus diisi user (bertanda *) |
| **Auto KRS** | Tidak ditampilkan (backend yang isi) |
| **System** | Tidak ditampilkan (auto generate) |
| **Tanda Tangan** | Tidak ditampilkan |

#### Cara Mengisi Form:
1. Isi semua field yang bertanda **"*" (wajib)**
2. Field yang sudah terisi otomatis (Auto KRS) tidak terlihat
3. Klik tombol **"Preview Dokumen"** untuk melanjutkan

> **Tips:** Gunakan keyboard untuk navigasi, tombol Enter untuk submit

---

### 3. Preview & Cetak

Halaman ini menampilkan preview dokumen sebelum dicetak.

#### Preview Dokumen:
- Tampilan dokumen dalam iframe PDF
- Bisa di-scroll untuk melihat seluruh halaman
- Klik **"Refresh Preview"** jika perlu

#### Cetak Dokumen:
1. Klik tombol **"Cetak Sekarang"**
2. Akan muncul loading "Mencetak..."
3. Dokumen akan langsung keluar dari printer (tanpa popup)
4. Tampilan halaman sukses

#### Halaman Sukses:
- Menampilkan pesan "Berhasil! Dokumen Sedang Dicetak"
- Tombol **"Kembali ke Beranda"** untuk kembali ke dashboard

#### AFK Timeout (Away From Keyboard):
- Jika 45 detik tidak ada aktivitas, muncul modal peringatan
- Jika 15 detik lagi tidak respons, akan logout otomatis
- Klik **"Kembali"** untuk membatalkan logout

---

### 4. Verifikasi Dokumen

Setiap dokumen yang dicetak memiliki **QR Code** di pojok kanan bawah.

#### Cara Verifikasi:
1. Scan QR Code menggunakan HP
2. Akan terbuka halaman verifikasi
3. Halaman menampilkan status:
   - ✅ **DOKUMEN ASLI** - Jika dokumen valid
   - ❌ **DOKUMEN TIDAK VALID** - Jika dokumen tidak ditemukan atau dicabut

#### Informasi yang Ditampilkan:
- Jenis Dokumen
- Nama Mahasiswa
- NIM
- Tanggal Cetak
- ID Verifikasi

---

## ❓ FAQ

### 1. Saya lupa password, bagaimana?
Hubungi admin untuk mereset password.

### 2. Preview dokumen tidak muncul?
- Cek koneksi internet (library via CDN)
- Cek console browser (F12) untuk error
- Pastikan file template tidak corrupt

### 3. Cetak dokumen gagal?
- Cek koneksi printer
- Cek stok kertas di menu Maintenance
- Cek level tinta
- Coba test print dari menu Maintenance

### 4. QR Code tidak muncul di dokumen?
- Pastikan fitur QR sudah diaktifkan
- Cek layout template V2 (jika pakai V2)
- QR otomatis muncul di pojok kanan bawah untuk semua dokumen

### 5. Bagaimana cara mengatur urutan field?
- Hanya field dengan sumber data **Manual** yang bisa diurutkan
- Gunakan tombol ↑ dan ↓ di daftar field
- Field lain (Auto KRS, System, Signature) tidak bisa diurutkan

### 6. Perbedaan Template V1 dan V2?
| Aspek | V1 | V2 |
|-------|----|----|
| Penempatan field | Placeholder di .docx | Drag & drop box |
| Preview | Dokumen asli | Grid background |
| Fleksibilitas | Terbatas | Bebas posisi |

### 7. Apa itu QR Code di dokumen?
QR Code berisi link verifikasi unik untuk setiap dokumen. Scan QR untuk memastikan keaslian dokumen.

### 8. Session logout terus?
Session memiliki timeout 30 menit. Jika tidak aktif selama 30 menit, akan logout otomatis.

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Login gagal | Cek NIM dan password, pastikan caps lock mati |
| Template tidak bisa diupload | Pastikan file .docx tidak corrupt, ukuran maksimal 10MB |
| Field tidak muncul di form | Cek data source field (harus MANUAL) |
| Preview error | Cek console browser (F12) untuk detail error |
| Printer tidak merespon | Restart print spooler, cek koneksi printer |
| Cetak dokumen double | Cek antrian printer, batalkan cetakan yang tidak perlu |

---

## 📞 Bantuan

Jika mengalami masalah yang tidak tercantum di panduan ini:

1. **Cek dokumentasi** lainnya (INSTALLATION.md, DEPLOYMENT.md)
2. **Cek console browser** (F12) untuk error JavaScript
3. **Cek terminal server** untuk error Node.js
4. **Hubungi tim IT** atau admin sistem

---

**© 2025 Tim Capstone UMY**
```

**Silakan copas seluruh kode di atas ke file `USER-GUIDE.md` Anda.** ✅