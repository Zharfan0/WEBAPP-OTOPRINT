## 📄 **API-DOCS.md**

```markdown
# 📡 API Documentation - OtoPrint

Dokumentasi lengkap endpoint API yang tersedia di OtoPrint.

---

## 📋 Daftar Isi

- [Base URL](#-base-url)
- [Authentication](#-authentication)
- [Public Endpoints](#-public-endpoints-tanpa-login)
- [Auth Endpoints](#-auth-endpoints)
- [Admin - Template Endpoints](#-admin---template-endpoints)
- [Admin - Field Endpoints](#-admin---field-endpoints)
- [Admin - Layout Endpoints (V2)](#-admin---layout-endpoints-v2)
- [Admin - Signature Endpoints](#-admin---signature-endpoints)
- [Admin - Print Logs Endpoints](#-admin---print-logs-endpoints)
- [Admin - Maintenance Endpoints](#-admin---maintenance-endpoints)
- [User Endpoints](#-user-endpoints)
- [Generate & Print Endpoints](#-generate--print-endpoints)
- [Verification Endpoint](#-verification-endpoint)
- [Error Codes](#-error-codes)
- [Contoh Request/Response](#-contoh-requestresponse)

---

## 🔗 Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Production | `https://otoprint.umy.ac.id` |

---

## 🔐 Authentication

Sistem menggunakan **Session Based Authentication** (bukan JWT).

**Cara kerja:**
1. User login ke `/api/login`
2. Server membuat session dan mengirim cookie `connect.sid`
3. Request berikutnya harus menyertakan cookie tersebut

**Header yang diperlukan:**
```
Cookie: connect.sid=s%3Axxx
```

**Session timeout:** 30 menit tidak aktif

---

## 🌐 Public Endpoints (Tanpa Login)

Endpoint yang bisa diakses tanpa authentication.

### GET /api/public/templates
**Deskripsi:** Ambil semua template untuk halaman publik (landing page)

**Response:**
```json
[
  {
    "id": 1,
    "name_id": "Surat Aktif Kuliah",
    "name_en": "Certificate of Enrollment",
    "created_at": "2025-01-15 10:00:00"
  }
]
```

### GET /api/public/templates/:id
**Deskripsi:** Ambil detail template publik

**Parameter:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| id | integer | ID template |

**Response:**
```json
{
  "id": 1,
  "name_id": "Surat Aktif Kuliah",
  "name_en": "Certificate of Enrollment"
}
```

---

## 🔑 Auth Endpoints

### POST /api/login
**Deskripsi:** Login user (admin atau mahasiswa)

**Request Body:**
```json
{
  "nim": "20220140055",
  "password": "user123"
}
```

**Response (Sukses - User):**
```json
{
  "success": true,
  "role": "user",
  "redirect": "/pages/dashboard.html"
}
```

**Response (Sukses - Admin):**
```json
{
  "success": true,
  "role": "admin",
  "redirect": "/admin/insight.html"
}
```

**Response (Gagal):**
```json
{
  "success": false,
  "message": "NIM atau password salah"
}
```

### POST /api/logout
**Deskripsi:** Logout, hapus session

**Response:**
```json
{
  "success": true
}
```

### GET /api/me
**Deskripsi:** Cek session user saat ini

**Response (Login):**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "nim": "20220140055",
    "name": "Andi Granityo",
    "role": "user"
  }
}
```

**Response (Belum Login):**
```json
{
  "success": false
}
```

---

## 📄 Admin - Template Endpoints

*Semua endpoint di bawah ini memerlukan role **admin**.*

### GET /api/templates
**Deskripsi:** Ambil semua template (lengkap dengan metadata)

**Response:**
```json
[
  {
    "id": 1,
    "name_id": "Surat Aktif Kuliah",
    "name_en": "Certificate of Enrollment",
    "filename": "template_123.docx",
    "file_path": "templates/template_123.docx",
    "created_at": "2025-01-15 10:00:00",
    "updated_at": null
  }
]
```

### GET /api/templates/:id
**Deskripsi:** Ambil detail template

**Response:**
```json
{
  "id": 1,
  "name_id": "Surat Aktif Kuliah",
  "name_en": "Certificate of Enrollment",
  "filename": "template_123.docx",
  "file_path": "templates/template_123.docx"
}
```

### POST /api/templates
**Deskripsi:** Buat template baru (upload file .docx)

**Request:** `multipart/form-data`

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| name_id | string | ✅ | Nama dokumen (Indonesia) |
| name_en | string | ❌ | Nama dokumen (Inggris) |
| template_file | file | ✅ | File .docx template |

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

### PUT /api/templates/:id
**Deskripsi:** Update template (ganti nama atau upload file baru)

**Request:** `multipart/form-data`

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| name_id | string | ✅ | Nama dokumen (Indonesia) |
| name_en | string | ❌ | Nama dokumen (Inggris) |
| template_file | file | ❌ | File .docx baru (opsional) |

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/templates/:id
**Deskripsi:** Hapus template (file dan semua field ikut terhapus)

**Response:**
```json
{
  "success": true
}
```

---

## 📝 Admin - Field Endpoints

### GET /api/templates/:id/fields
**Deskripsi:** Ambil semua field dari template

**Response:**
```json
[
  {
    "id": 1,
    "template_id": 1,
    "field_name": "nama_mahasiswa",
    "label": "Nama Mahasiswa",
    "field_type": "text",
    "data_source": "MANUAL",
    "source_key": null,
    "field_order": 1
  }
]
```

### POST /api/fields
**Deskripsi:** Buat field baru

**Request Body:**
```json
{
  "template_id": 1,
  "field_name": "nama_mahasiswa",
  "label": "Nama Mahasiswa",
  "field_type": "text",
  "data_source": "MANUAL",
  "source_key": null,
  "field_order": 1
}
```

**Data Source Values:**
| Value | Deskripsi |
|-------|-----------|
| `MANUAL` | User mengisi sendiri |
| `AUTO_KRS` | Auto dari database (NIM, nama, prodi) |
| `SYSTEM` | Auto generate (tanggal, nomor surat) |
| `MASTER_SIGNATURE` | Tanda tangan dari master_signature |

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

### PUT /api/fields/:id
**Deskripsi:** Update field

**Response:**
```json
{
  "success": true
}
```

### DELETE /api/fields/:id
**Deskripsi:** Hapus field

**Response:**
```json
{
  "success": true
}
```

---

## 🎨 Admin - Layout Endpoints (V2)

### GET /api/templates/:id/layout
**Deskripsi:** Ambil layout template V2 (posisi field/QR)

**Response:**
```json
[
  {
    "id": 1,
    "template_id": 1,
    "type": "field",
    "field_name": "nama_mahasiswa",
    "label": "Nama Mahasiswa",
    "signature_id": null,
    "qr_url": null,
    "image_url": null,
    "x": 100,
    "y": 200,
    "width": 180,
    "height": 40
  },
  {
    "id": 2,
    "template_id": 1,
    "type": "qr",
    "label": "Verifikasi",
    "signature_id": 1,
    "qr_url": "https://...",
    "x": 600,
    "y": 800,
    "width": 100,
    "height": 100
  }
]
```

**Type Values:**
| Type | Deskripsi |
|------|-----------|
| `field` | Field teks biasa |
| `qr` | QR Code verifikasi |
| `signature` | Gambar tanda tangan |

### POST /api/templates/:id/layout
**Deskripsi:** Simpan layout template V2

**Request Body:**
```json
{
  "layout": [
    {
      "type": "field",
      "field_name": "nama_mahasiswa",
      "label": "Nama Mahasiswa",
      "x": 100,
      "y": 200,
      "width": 180,
      "height": 40
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

---

## ✍️ Admin - Signature Endpoints

### GET /api/signatures
**Deskripsi:** Ambil semua tanda tangan dosen

**Response:**
```json
[
  {
    "id": 1,
    "nama_dosen": "Dr. Ahmad Suryadi",
    "nip": "197001012005011001",
    "jabatan": "Dekan",
    "signature_image": "/assets/images/signatures/signature_123.png",
    "is_active": 1,
    "keterangan": null
  }
]
```

### POST /api/signatures
**Deskripsi:** Upload tanda tangan dosen baru

**Request:** `multipart/form-data`

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| nama_dosen | string | ✅ | Nama lengkap dosen |
| nip | string | ✅ | NIP dosen |
| jabatan | string | ✅ | Jabatan (Dekan, Kaprodi, dll) |
| signature_image | file | ✅ | Gambar tanda tangan (.png/.jpg) |
| is_active | boolean | ❌ | Default 1 |
| keterangan | string | ❌ | Catatan tambahan |

**Response:**
```json
{
  "success": true,
  "id": 1
}
```

### DELETE /api/signatures/:id
**Deskripsi:** Hapus tanda tangan

**Response:**
```json
{
  "success": true
}
```

---

## 📊 Admin - Print Logs Endpoints

### GET /api/print-logs
**Deskripsi:** Ambil riwayat cetak (support filter)

**Query Parameters:**
| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| start_date | string | Filter tanggal mulai (YYYY-MM-DD) |
| end_date | string | Filter tanggal akhir (YYYY-MM-DD) |
| user_id | integer | Filter berdasarkan user |
| document_type_id | integer | Filter berdasarkan jenis dokumen |

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "document_type_id": 1,
    "printed_at": "2025-01-15 10:30:00",
    "user_name": "Andi Granityo",
    "nim": "20220140055",
    "document_name": "Surat Aktif Kuliah"
  }
]
```

### GET /api/print-stats
**Deskripsi:** Statistik cetak (support filter)

**Query Parameters:** sama dengan `/api/print-logs`

**Response:**
```json
{
  "today_prints": 5,
  "week_prints": 32,
  "total_prints": 150,
  "by_document_type": [
    { "name": "Surat Aktif Kuliah", "count": 45 },
    { "name": "Transkrip Nilai", "count": 30 }
  ],
  "by_hour": [
    { "hour": "09", "count": 12 },
    { "hour": "10", "count": 25 }
  ]
}
```

### GET /api/users
**Deskripsi:** Ambil daftar user yang pernah mencetak

**Response:**
```json
{
  "total_active_users": 3,
  "active_users": [
    {
      "id": 2,
      "nim": "20220140055",
      "name": "Andi Granityo",
      "role": "user",
      "total_prints": 5
    }
  ]
}
```

---

## 🔧 Admin - Maintenance Endpoints

### GET /api/maintenance
**Deskripsi:** Ambil setting maintenance

**Response:**
```json
{
  "id": 1,
  "paper_stock": 450,
  "paper_threshold": 100,
  "ink_level": 70,
  "ink_threshold": 20,
  "printer_name": "EPSON L3110 Series",
  "last_maintenance": null
}
```

### PUT /api/maintenance
**Deskripsi:** Update setting maintenance

**Request Body:**
```json
{
  "paper_stock": 500,
  "ink_level": 75
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/printers
**Deskripsi:** Ambil daftar printer yang terinstall di server

**Response:**
```json
[
  { "name": "EPSON L3110 Series", "isDefault": true },
  { "name": "Microsoft Print to PDF", "isDefault": false }
]
```

### PUT /api/settings/printer
**Deskripsi:** Set default printer

**Request Body:**
```json
{
  "printer_name": "EPSON L3110 Series"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/print-test
**Deskripsi:** Test print ke printer default

**Response:**
```json
{
  "success": true,
  "message": "Test print berhasil"
}
```

---

## 👤 User Endpoints

*Endpoint ini memerlukan login (user atau admin).*

### GET /api/user/templates
**Deskripsi:** Ambil template untuk user (hanya informasi dasar)

**Response:**
```json
[
  {
    "id": 1,
    "name_id": "Surat Aktif Kuliah",
    "name_en": "Certificate of Enrollment",
    "file_path": "templates/template_123.docx",
    "created_at": "2025-01-15 10:00:00"
  }
]
```

### GET /api/user/templates/:id
**Deskripsi:** Ambil detail template untuk user

**Response:**
```json
{
  "id": 1,
  "name_id": "Surat Aktif Kuliah",
  "name_en": "Certificate of Enrollment",
  "file_path": "templates/template_123.docx"
}
```

### GET /api/user/templates/:id/fields
**Deskripsi:** Ambil field untuk user (hanya yang perlu diisi)

**Response:**
```json
[
  {
    "id": 1,
    "field_name": "nama_mahasiswa",
    "label": "Nama Mahasiswa",
    "field_type": "text",
    "data_source": "MANUAL",
    "field_order": 1
  }
]
```

### GET /api/user/signatures
**Deskripsi:** Ambil daftar tanda tangan aktif (untuk user)

**Response:**
```json
[
  {
    "id": 1,
    "nama_dosen": "Dr. Ahmad Suryadi",
    "jabatan": "Dekan",
    "signature_image": "/assets/images/signatures/signature_123.png"
  }
]
```

---

## 🖨️ Generate & Print Endpoints

### POST /api/generate-pdf
**Deskripsi:** Generate PDF preview (V1 - placeholder based)

**Request Body:**
```json
{
  "templateId": 1,
  "allData": {
    "nama_mahasiswa": "Andi Granityo",
    "nim": "20220140055"
  },
  "fields": []
}
```

**Response:**
```json
{
  "success": true,
  "pdfBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

### POST /api/print-to-printer
**Deskripsi:** Cetak dokumen ke printer fisik (V1)

**Request Body:**
```json
{
  "templateId": 1,
  "allData": {
    "nama_mahasiswa": "Andi Granityo",
    "nim": "20220140055"
  },
  "document_type_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dokumen berhasil dicetak",
  "verifyUrl": "http://localhost:3000/verify.html?doc=OTP-xxx-xxx"
}
```

### POST /api/v2/generate-pdf
**Deskripsi:** Generate PDF preview (V2 - layout based)

### POST /api/v2/print
**Deskripsi:** Cetak dokumen ke printer fisik (V2)

### GET /api/preview-pdf/:templateId
**Deskripsi:** Preview PDF untuk admin (tanpa data user)

**Response:** File PDF

---

## ✅ Verification Endpoint

### GET /api/verify/:uuid
**Deskripsi:** Verifikasi dokumen via QR Code (public endpoint)

**Parameter:**
| Nama | Tipe | Deskripsi |
|------|------|-----------|
| uuid | string | Doc UUID (format: OTP-xxx-xxx) |

**Response (Valid):**
```json
{
  "valid": true,
  "doc_uuid": "OTP-MK5J9X-3f4k2a",
  "document_name": "Surat Aktif Kuliah",
  "user_name": "Andi Granityo",
  "user_nim": "20220140055",
  "printed_at": "2025-01-15 10:30:00",
  "verified_count": 1,
  "metadata": {}
}
```

**Response (Tidak Valid):**
```json
{
  "valid": false,
  "message": "Dokumen tidak ditemukan dalam sistem"
}
```

**Response (Dicabut):**
```json
{
  "valid": false,
  "message": "Dokumen ini telah dicabut status keabsahannya"
}
```

---

## 🔒 Error Codes

| HTTP Code | Keterangan |
|-----------|------------|
| 200 | Success |
| 400 | Bad Request (parameter tidak lengkap atau invalid) |
| 401 | Unauthorized (belum login atau session expired) |
| 403 | Forbidden (role tidak memiliki akses) |
| 404 | Not Found (resource tidak ditemukan) |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "error": "Pesan error deskriptif"
}
```

---

## 📝 Contoh Request/Response

### Login (Curl)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"nim":"20220140055","password":"user123"}'
```

### Ambil Template (Curl)
```bash
curl -X GET http://localhost:3000/api/templates \
  -H "Cookie: connect.sid=s%3Axxx"
```

### Generate PDF (Curl)
```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "allData": {
      "nama_mahasiswa": "Andi Granityo",
      "nim": "20220140055"
    }
  }'
```

### Verifikasi Dokumen (Curl)
```bash
curl -X GET http://localhost:3000/api/verify/OTP-MK5J9X-3f4k2a
```

### Export Log Cetak (Curl)
```bash
curl -X GET "http://localhost:3000/api/print-logs?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Cookie: connect.sid=s%3Axxx"
```

---

## 📦 Library Dependencies

| Library | Fungsi dalam API |
|---------|------------------|
| express | Web framework, routing |
| express-session | Session management |
| sqlite3 | Database query |
| multer | File upload handling |
| pdf-lib | Manipulasi PDF (overlay teks/gambar) |
| qrcode | Generate QR Code |
| pdf-to-printer | Cetak ke printer fisik |
| docxtemplater | Manipulasi file .docx |

---

**© 2025 Tim Capstone UMY**
```