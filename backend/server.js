const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os'); 
const { exec } = require('child_process');
const JSZip = require('jszip');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const { convertDocxToPdf, generateEmptyPreview, generatePdfWithLayout } = require('./pdfGenerator');

const app = express();
const PORT = 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');
console.log('Frontend path:', frontendPath);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware harus dipasang SEBELUM static files dan route handlers
app.use(session({
    secret: 'otoprint-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }
}));

app.use(express.static(frontendPath));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/admin/insight.html');
        } else {
            return res.redirect('/pages/dashboard.html');
        }
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Setup multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const templatesDir = path.join(__dirname, '../frontend/templates');
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }
        cb(null, templatesDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `template_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Create tables
db.serialize(() => {

    // Tabel master_signature (untuk tanda tangan dosen)
    db.run(`CREATE TABLE IF NOT EXISTS master_signature (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_dosen TEXT NOT NULL,
        nip TEXT NOT NULL UNIQUE,
        jabatan TEXT NOT NULL,
        signature_image TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        keterangan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nim TEXT UNIQUE,
        name TEXT,
        role TEXT DEFAULT 'user',
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_id TEXT NOT NULL,
        name_en TEXT NOT NULL,
        filename TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL,
        data_source TEXT NOT NULL,
        source_key TEXT,
        field_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
        UNIQUE(template_id, field_name)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS print_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        document_type_id INTEGER,
        printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS maintenance_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        paper_stock INTEGER DEFAULT 500,
        paper_threshold INTEGER DEFAULT 100,
        ink_level INTEGER DEFAULT 75,
        ink_threshold INTEGER DEFAULT 20,
        last_maintenance DATETIME,
        updated_at DATETIME
    )`);

    // Insert default users
    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        if (err) return;
        if (row.count === 0) {
            db.run(`INSERT INTO users (nim, name, role, password) VALUES 
                ('20220140027', 'Ahmad Ilman', 'admin', 'admin123'),
                ('20220140055', 'Andi Granityo', 'user', 'user123'),
                ('20220140079', 'Muhammad Zharfan', 'user', 'user123'),
                ('20220140107', 'Muhammad Ikram', 'user', 'user123')`);
        }
    });

    // Insert default maintenance settings
    db.get(`SELECT COUNT(*) as count FROM maintenance_settings`, (err, row) => {
        if (err) return;
        if (row.count === 0) {
            db.run(`INSERT INTO maintenance_settings (id, paper_stock, ink_level) VALUES (1, 500, 75)`);
        }
    });

    // Tabel verifikasi dokumen (untuk QR authentication)
    db.run(`CREATE TABLE IF NOT EXISTS document_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_uuid TEXT UNIQUE NOT NULL,
        template_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT,
        user_nim TEXT,
        document_name TEXT,
        printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        status TEXT DEFAULT 'active',
        verified_count INTEGER DEFAULT 0,
        last_verified_at DATETIME
    )`);
});

// ============ API ENDPOINTS ============

// Test
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Login
app.post('/api/login', (req, res) => {
    const { nim, password } = req.body;
    db.get(`SELECT * FROM users WHERE nim = ? AND password = ?`, [nim, password], (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: 'NIM atau password salah' });
        }
        req.session.user = { id: user.id, nim: user.nim, name: user.name, role: user.role };
        res.json({ success: true, role: user.role, redirect: user.role === 'admin' ? '/admin/insight.html' : '/pages/dashboard.html' });
    });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/me', (req, res) => {
    if (req.session.user) {
        // Ambil data lengkap dari database
        db.get(`SELECT * FROM users WHERE id = ?`, [req.session.user.id], (err, user) => {
            if (err || !user) {
                return res.json({ success: true, user: req.session.user });
            }
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    nim: user.nim,
                    name: user.name,
                    role: user.role,
                    prodi: user.prodi,
                    fakultas: user.fakultas,
                    ipk: user.ipk,
                    sks: user.sks,
                    semester: user.semester,
                    tempat_lahir: user.tempat_lahir,
                    tgl_lahir: user.tgl_lahir
                }
            });
        });
    } else {
        res.json({ success: false });
    }
});


// ============ PUBLIC ENDPOINTS (TIDAK PERLU LOGIN) ============

// Get all templates for public homepage (tanpa auth)
app.get('/api/public/templates', (req, res) => {
    db.all(`SELECT id, name_id, name_en, created_at FROM templates ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get single template for public preview (tanpa auth)
app.get('/api/public/templates/:id', (req, res) => {
    db.get(`SELECT id, name_id, name_en FROM templates WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Template not found' });
        res.json(row);
    });
});

// ============ TEMPLATE ENDPOINTS ============

// Get all templates (admin)
app.get('/api/templates', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.all(`SELECT * FROM templates ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get single template (admin)
app.get('/api/templates/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.get(`SELECT * FROM templates WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Template not found' });
        res.json(row);
    });
});

// Create template (with file upload)
app.post('/api/templates', (req, res) => {
    upload.single('template_file')(req, res, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Upload error: ' + err.message });
        }
        
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { name_id, name_en } = req.body;
        const file = req.file;
        
        if (!name_id || !name_id.trim()) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
        }
        
        if (!file) {
            return res.status(400).json({ error: 'File template wajib diupload' });
        }
        
        const file_path = `templates/${file.filename}`;
        
        db.run(`INSERT INTO templates (name_id, name_en, filename, file_path) VALUES (?, ?, ?, ?)`,
            [name_id.trim(), name_en?.trim() || '', file.originalname, file_path],
            function(err) {
                if (err) {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, id: this.lastID });
            });
    });
});

// Update template
app.put('/api/templates/:id', (req, res) => {
    upload.single('template_file')(req, res, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Upload error: ' + err.message });
        }
        
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { name_id, name_en } = req.body;
        const file = req.file;
        
        if (!name_id || !name_id.trim()) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Nama dokumen wajib diisi' });
        }
        
        db.get(`SELECT * FROM templates WHERE id = ?`, [req.params.id], (err, template) => {
            if (err) {
                if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ error: err.message });
            }
            if (!template) {
                if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(404).json({ error: 'Template not found' });
            }
            
            let updateQuery = `UPDATE templates SET name_id = ?, name_en = ?, updated_at = CURRENT_TIMESTAMP`;
            let params = [name_id.trim(), name_en?.trim() || ''];
            
           if (file) {
                const oldFilePath = path.join(__dirname, '../frontend', template.file_path);
                const newFilePath = path.join(__dirname, '../frontend', `templates/${file.filename}`);
                
                // Hanya hapus jika file lama BERBEDA dengan file baru
                // dan bukan file yang sedang aktif dipakai preview
                if (oldFilePath !== newFilePath && fs.existsSync(oldFilePath)) {
                    setTimeout(() => {
                        try { 
                            fs.unlinkSync(oldFilePath);
                            console.log('✅ File lama dihapus:', oldFilePath);
                        } catch(e) { 
                            console.warn('⚠️ File lama tidak bisa dihapus:', e.message);
                        }
                    }, 3000); // tunggu 3 detik agar LibreOffice selesai
                }
                
                updateQuery += `, filename = ?, file_path = ?`;
                params.push(file.originalname, `templates/${file.filename}`);
            }
            
            updateQuery += ` WHERE id = ?`;
            params.push(req.params.id);
            
            db.run(updateQuery, params, function(err) {
                if (err) {
                    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true });
            });
        });
    });
});

// Delete template
app.delete('/api/templates/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.get(`SELECT file_path FROM templates WHERE id = ?`, [req.params.id], (err, template) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (template && template.file_path) {
            const filePath = path.join(__dirname, '../frontend', template.file_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        db.run(`DELETE FROM templates WHERE id = ?`, [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// ============ FIELDS ENDPOINTS ============

// Get fields by template
app.get('/api/templates/:id/fields', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.all(`SELECT * FROM fields WHERE template_id = ? ORDER BY field_order`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Create field
app.post('/api/fields', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { 
        template_id, field_name, label, field_type, data_source, 
        source_key, field_order, display_type, pos_x, pos_y, width, height 
    } = req.body;
    
    db.run(`INSERT INTO fields (
        template_id, field_name, label, field_type, data_source, 
        source_key, field_order, display_type, pos_x, pos_y, width, height
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            template_id, field_name, label, field_type, data_source, 
            source_key, field_order || 0, display_type || 'image', 
            pos_x || 600, pos_y || 700, width || 100, height || 100
        ],
        function(err) {
            if (err) {
                console.error('Create field error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update field
app.put('/api/fields/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { 
        field_name, label, field_type, data_source, source_key, 
        field_order, display_type, pos_x, pos_y, width, height 
    } = req.body;
    
    db.run(`UPDATE fields SET 
        field_name = ?, label = ?, field_type = ?, data_source = ?, 
        source_key = ?, field_order = ?, display_type = ?, 
        pos_x = ?, pos_y = ?, width = ?, height = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [
            field_name, label, field_type, data_source, source_key, 
            field_order, display_type || 'image', 
            pos_x || 600, pos_y || 700, width || 100, height || 100, 
            req.params.id
        ],
        function(err) {
            if (err) {
                console.error('Update field error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Delete field
app.delete('/api/fields/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.run(`DELETE FROM fields WHERE id = ?`, [req.params.id], function(err) {
     if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ============ USER ENDPOINTS ============

// Get templates for user
app.get('/api/user/templates', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.all(`SELECT id, name_id, name_en, file_path, created_at FROM templates ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get single template for user
app.get('/api/user/templates/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.get(`SELECT id, name_id, name_en, file_path FROM templates WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Template not found' });
        // Langsung return row, bukan { template: row }
        res.json(row);
    });
});

// Get fields for user
app.get('/api/user/templates/:id/fields', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.all(`SELECT * FROM fields WHERE template_id = ? ORDER BY field_order`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get total users who have ever printed (bukan semua user di database)
app.get('/api/users', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Hitung user yang PERNAH mencetak (berdasarkan print_logs)
    db.get(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM print_logs
    `, (err, row) => {
        if (err) {
            console.error('Error fetching active users:', err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // Juga kembalikan detail user yang aktif untuk ditampilkan (opsional)
        db.all(`
            SELECT DISTINCT u.id, u.nim, u.name, u.role, COUNT(pl.id) as total_prints
            FROM users u
            JOIN print_logs pl ON u.id = pl.user_id
            GROUP BY u.id
            ORDER BY total_prints DESC
        `, (err, activeUsers) => {
            if (err) {
                console.error('Error fetching active users detail:', err.message);
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                total_active_users: row?.count || 0,
                active_users: activeUsers || []
            });
        });
    });
});

// ============ PRINT LOGS & MAINTENANCE ============

// Get all print logs (riwayat cetak)
app.get('/api/print-logs', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { start_date, end_date, user_id, document_type_id } = req.query;
    let query = `
        SELECT 
            pl.*, 
            u.name as user_name, 
            u.nim,
            t.name_id as document_name
        FROM print_logs pl
        JOIN users u ON pl.user_id = u.id
        JOIN templates t ON pl.document_type_id = t.id
        WHERE 1=1
    `;
    const params = [];
    
    // Filter dengan WIB
    if (start_date) {
        query += ` AND DATE(datetime(pl.printed_at, '+7 hours')) >= DATE(?)`;
        params.push(start_date);
    }
    if (end_date) {
        query += ` AND DATE(datetime(pl.printed_at, '+7 hours')) <= DATE(?)`;
        params.push(end_date);
    }
    if (user_id) {
        query += ` AND pl.user_id = ?`;
        params.push(user_id);
    }
    if (document_type_id) {
        query += ` AND pl.document_type_id = ?`;
        params.push(document_type_id);
    }
    
    query += ` ORDER BY pl.printed_at DESC LIMIT 500`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching print logs:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get print statistics (with date filter)
app.get('/api/print-stats', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { start_date, end_date } = req.query;
    
    // Dapatkan tanggal lokal hari ini
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('Today local date:', todayStr);
    
    // Build WHERE clause
    let whereClause = '';
    const params = [];
    
    if (start_date && end_date) {
        whereClause = `WHERE DATE(printed_at) BETWEEN DATE(?) AND DATE(?)`;
        params.push(start_date, end_date);
    } else if (start_date) {
        whereClause = `WHERE DATE(printed_at) >= DATE(?)`;
        params.push(start_date);
    } else if (end_date) {
        whereClause = `WHERE DATE(printed_at) <= DATE(?)`;
        params.push(end_date);
    }
    
    const stats = {};
    
    // Total prints today
    db.get(`SELECT COUNT(*) as count FROM print_logs WHERE DATE(printed_at) = ?`, [todayStr], (err, row) => {
        stats.today_prints = row?.count || 0;
        
        // Total prints this week
        db.get(`SELECT COUNT(*) as count FROM print_logs WHERE strftime('%W', printed_at) = strftime('%W', 'now')`, (err, row) => {
            stats.week_prints = row?.count || 0;
            
            // Total prints with filter
            let totalQuery = `SELECT COUNT(*) as count FROM print_logs`;
            if (whereClause) {
                totalQuery += ` ${whereClause}`;
            } else {
                totalQuery += ` WHERE 1=1`;
            }
            
            db.get(totalQuery, params, (err, row) => {
                stats.total_prints = row?.count || 0;
                
                // Prints by document type
                let docQuery = `
                    SELECT t.name_id as name, COUNT(*) as count 
                    FROM print_logs pl
                    JOIN templates t ON pl.document_type_id = t.id
                `;
                if (whereClause) {
                    docQuery += ` ${whereClause}`;
                } else {
                    docQuery += ` WHERE 1=1`;
                }
                docQuery += ` GROUP BY pl.document_type_id`;
                
                db.all(docQuery, params, (err, rows) => {
                    stats.by_document_type = rows || [];
                    
                    // Prints by hour
                    let hourQuery = `
                        SELECT 
                            strftime('%H', printed_at) as hour, 
                            COUNT(*) as count 
                        FROM print_logs
                    `;
                    if (whereClause) {
                        hourQuery += ` ${whereClause}`;
                    } else {
                        hourQuery += ` WHERE 1=1`;
                    }
                    hourQuery += ` GROUP BY hour ORDER BY hour`;
                    
                    db.all(hourQuery, params, (err, rows) => {
                        stats.by_hour = rows || [];
                        
                        console.log('Stats sent - today:', stats.today_prints, 'total:', stats.total_prints);
                        res.json(stats);
                    });
                });
            });
        });
    });
});

// Get maintenance settings
app.get('/api/maintenance', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    db.get(`SELECT * FROM maintenance_settings WHERE id = 1`, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { paper_stock: 500, ink_level: 75 });
    });
});

// Update maintenance settings
app.put('/api/maintenance', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { paper_stock, ink_level } = req.body;
    db.run(`UPDATE maintenance_settings SET paper_stock = ?, ink_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [paper_stock, ink_level], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Record print
app.post('/api/print', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { document_type_id } = req.body;
    
    // Gunakan waktu lokal komputer
    function getLocalTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    const localTime = getLocalTime();
    console.log('Saving print log with local time:', localTime);
    
    // Kurangi stok kertas
    db.run(`UPDATE maintenance_settings SET paper_stock = paper_stock - 1 WHERE id = 1 AND paper_stock > 0`, function(err) {
        if (err) console.error('Error reducing paper stock:', err);
    });
    
    db.run(`INSERT INTO print_logs (user_id, document_type_id, printed_at) VALUES (?, ?, ?)`,
        [req.session.user.id, document_type_id, localTime],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ============ PRINTER MANAGEMENT ============

const { getPrinters } = require('pdf-to-printer');

// Get list of installed printers
app.get('/api/printers', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const printers = await getPrinters();
        res.json(printers);
    } catch (error) {
        console.error('Error getting printers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update default printer setting
app.put('/api/settings/printer', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { printer_name } = req.body;
    
    db.run(`UPDATE maintenance_settings SET printer_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [printer_name || ''], 
        function(err) {
            if (err) {
                console.error('Error saving printer setting:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        });
});

// Test print endpoint
app.get('/api/print-test', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        // Ambil printer dari database
        const setting = await new Promise((resolve) => {
            db.get(`SELECT printer_name FROM maintenance_settings WHERE id = 1`, (err, row) => {
                resolve(row);
            });
        });
        
        const printerName = setting?.printer_name || undefined;
        
        // Buat test page sederhana (PDF sederhana)
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([400, 200]);
        page.drawText('Test Print OtoPrint', { x: 50, y: 100, size: 16 });
        page.drawText(`Waktu: ${new Date().toLocaleString()}`, { x: 50, y: 70, size: 10 });
        const pdfBytes = await pdfDoc.save();
        
        // Simpan ke file temporary
        const tempPdfPath = path.join(os.tmpdir(), `test_print_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, pdfBytes);
        
        // Cetak
        await print(tempPdfPath, { printer: printerName });
        
        // Hapus file temporary
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        
        res.json({ success: true, message: 'Test print berhasil' });
    } catch (error) {
        console.error('Test print error:', error);
        res.status(500).json({ error: error.message });
    }
});


// ============ PRINT TO PRINTER (DENGAN INJECT SIGNATURE KE DOCX) ============
const { injectSignaturesToDocx } = require('./signatureInjector');
const { print } = require('pdf-to-printer');

app.post('/api/print-to-printer', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { templateId, allData, document_type_id } = req.body;

    if (!templateId) {
        return res.status(400).json({ error: 'templateId wajib diisi' });
    }

    let finalDocxPath = null;
    let tempPdfPath   = null;
    let pdfWithQrBuffer = null;

    try {
        // ── 1. Ambil template ──────────────────────────────────────────
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        if (!template?.file_path) throw new Error('Template tidak ditemukan');

        const templatePath = path.join(__dirname, '../frontend', template.file_path);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`File template tidak ada: ${templatePath}`);
        }

        // ── 2. Ambil signature fields ──────────────────────────────────
        const signatureFields = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM fields WHERE template_id = ? AND data_source = 'MASTER_SIGNATURE'`,
                [templateId],
                (err, rows) => { if (err) reject(err); else resolve(rows || []); }
            );
        });

        // ── 3. Load path gambar signature ─────────────────────────────
        const signatureImages = {};
        for (const field of signatureFields) {
            const sig = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT signature_image FROM master_signature WHERE id = ?`,
                    [field.source_key],
                    (err, row) => { if (err) reject(err); else resolve(row); }
                );
            });

            if (sig?.signature_image) {
                const imgPath = path.join(__dirname, '../frontend', sig.signature_image);
                if (fs.existsSync(imgPath)) {
                    signatureImages[field.field_name] = imgPath;
                    console.log(`✅ Signature: ${field.field_name} → ${imgPath}`);
                }
            }
        }

        // ── 4. Siapkan renderData ──────────────────────────────────────
        const renderData = { ...allData };
        for (const key of Object.keys(signatureImages)) {
            renderData[key] = key;
        }

        console.log('📦 renderData keys:', Object.keys(renderData));

        // ── 5. Inject teks + signature ke DOCX ────────────────────────
        finalDocxPath = path.join(os.tmpdir(), `print_${Date.now()}.docx`);
        tempPdfPath   = path.join(os.tmpdir(), `print_${Date.now()}.pdf`);

        try {
            const injectedBuffer = await injectSignaturesToDocx(
                templatePath,
                renderData,
                signatureImages
            );
            fs.writeFileSync(finalDocxPath, injectedBuffer);
            console.log('✅ Injection berhasil');
        } catch (injectError) {
            console.error('❌ Injection gagal:', injectError.message);
            fs.copyFileSync(templatePath, finalDocxPath);
        }

        // ── 6. Konversi DOCX → PDF via LibreOffice ────────────────────
        const libreOfficePath = 'D:\\LibreOffice\\program\\soffice.exe';
        if (!fs.existsSync(libreOfficePath)) {
            throw new Error('LibreOffice tidak ditemukan');
        }

        await new Promise((resolve, reject) => {
            const cmd = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${path.dirname(tempPdfPath)}" "${finalDocxPath}"`;
            console.log('▶️  Running:', cmd);

            exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('LibreOffice error: ' + (stderr || error.message)));
                } else {
                    console.log('✅ LibreOffice selesai');
                    resolve();
                }
            });
        });

        const generatedPdf = finalDocxPath.replace(/\.docx$/i, '.pdf');
        if (!fs.existsSync(generatedPdf)) {
            throw new Error('PDF tidak terbuat setelah konversi');
        }
        fs.renameSync(generatedPdf, tempPdfPath);
        
        // Baca PDF buffer untuk ditambah QR
        let pdfBuffer = fs.readFileSync(tempPdfPath);

        // ═══════════════════════════════════════════════════════════════
        // 🔐 TAMBAHKAN QR VERIFIKASI (pojok kanan bawah)
        // ═══════════════════════════════════════════════════════════════
        
        // Generate UUID unik untuk dokumen
        const docUuid = generateDocUuid();

        // Buat URL verifikasi
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify-signature.html?doc=${docUuid}`;
        
        console.log('🔐 QR Verifikasi URL:', verifyUrl);
        
        // Helper function untuk overlay QR ke PDF dengan koordinat dari DB
        async function addVerificationQrToPdf(pdfBuffer, verifyUrl) {
            const { PDFDocument } = require('pdf-lib');
            const QRCode = require('qrcode');
            
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const pageHeight = firstPage.getHeight();

            // Ambil field QR signature dari signatureFields yang sudah di-query di atas
            const qrField = signatureFields.find(f => f.display_type === 'qr');

            // Gunakan koordinat dari DB jika ada, fallback ke default pojok kanan bawah
            const qrSize   = qrField?.width  ?? qrField?.height ?? 100;
            const posX     = qrField?.pos_x  ?? (firstPage.getWidth() - qrSize - 20);
            const posY     = qrField?.pos_y  ?? 20;

            // Generate QR code dengan ukuran dari DB
            const qrBuffer = await QRCode.toBuffer(verifyUrl, {
                width: qrSize,
                margin: 1,
                errorCorrectionLevel: 'M'
            });
            const qrImage = await pdfDoc.embedPng(qrBuffer);

            // Konversi koordinat: sistem kita top-left, pdf-lib bottom-left
            const pdfX = posX;
            const pdfY = pageHeight - posY - qrSize;

            console.log(`🔐 QR overlay: x=${pdfX}, y=${pdfY}, size=${qrSize} (dari DB: pos_x=${posX}, pos_y=${posY})`);

            firstPage.drawImage(qrImage, {
                x: pdfX,
                y: pdfY,
                width: qrSize,
                height: qrSize
            });
            
            return await pdfDoc.save();
        }

        // Overlay QR ke PDF
        pdfWithQrBuffer = await addVerificationQrToPdf(pdfBuffer, verifyUrl);
        
        // Simpan data verifikasi ke database
        const user = req.session.user;
        const templateName = template.name_id || 'Dokumen';

        // Ambil source_key dosen dari qrField agar verify bisa tampilkan info dosen
        const qrField = signatureFields.find(f => f.display_type === 'qr');
        const signatureIdForVerify = qrField?.source_key || null;

        db.run(`
            INSERT INTO document_verifications 
            (doc_uuid, template_id, user_id, user_name, user_nim, document_name, metadata, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
            docUuid,
            templateId,
            user.id,
            user.name || user.nim,
            user.nim || '-',
            templateName,
            JSON.stringify({ signature_id: signatureIdForVerify, ...allData })
        ], (err) => {
            if (err) {
                console.error('❌ Gagal simpan verifikasi:', err.message);
            } else {
                console.log('✅ Verifikasi tersimpan, UUID:', docUuid);
            }
        });

        // Gunakan PDF yang sudah ada QR untuk dicetak
        const finalPdfBuffer = pdfWithQrBuffer;
        
        // Simpan PDF sementara dengan QR untuk dicetak
        const tempPdfWithQrPath = path.join(os.tmpdir(), `print_with_qr_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfWithQrPath, finalPdfBuffer);

        // ── 7. Cetak ke printer ────────────────────────────────────────
        const printerSetting = await new Promise((resolve) => {
            db.get(`SELECT printer_name FROM maintenance_settings WHERE id = 1`, (err, row) => {
                resolve(row);
            });
        });

        const printerName = printerSetting?.printer_name || undefined;
        console.log('🖨️  Mencetak ke:', printerName || 'Default');

        const { print } = require('pdf-to-printer');
        await print(tempPdfWithQrPath, { printer: printerName });
        console.log('✅ Print berhasil');

        // ── 8. Simpan log cetak ────────────────────────────────────────
        const now = new Date();
        const localTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

        db.run(
            `INSERT INTO print_logs (user_id, document_type_id, printed_at) VALUES (?, ?, ?)`,
            [req.session.user.id, document_type_id || templateId, localTime],
            err => { if (err) console.error('Log error:', err); }
        );

        db.run(
            `UPDATE maintenance_settings SET paper_stock = paper_stock - 1 WHERE id = 1 AND paper_stock > 0`,
            err => { if (err) console.error('Stock error:', err); }
        );

        // Hapus file temp PDF dengan QR
        if (fs.existsSync(tempPdfWithQrPath)) {
            try { fs.unlinkSync(tempPdfWithQrPath); } catch(_) {}
        }

        res.json({ success: true, message: 'Dokumen berhasil dicetak', verifyUrl: verifyUrl });

    } catch (error) {
        console.error('❌ Print error:', error.message);
        res.status(500).json({ error: error.message || 'Gagal mencetak' });

    } finally {
        for (const p of [finalDocxPath, tempPdfPath]) {
            if (p && fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (_) {}
            }
        }
    }
});
// ============ MASTER SIGNATURE ENDPOINTS ============

// Get all signatures
app.get('/api/signatures', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.all(`SELECT * FROM master_signature ORDER BY created_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get signature by ID
app.get('/api/signatures/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.get(`SELECT * FROM master_signature WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Signature not found' });
        res.json(row);
    });
});

// Create signature (upload image)
const signatureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const signatureDir = path.join(__dirname, '../frontend/assets/images/signatures');
        if (!fs.existsSync(signatureDir)) {
            fs.mkdirSync(signatureDir, { recursive: true });
        }
        cb(null, signatureDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `signature_${uniqueSuffix}${ext}`);
    }
});
const uploadSignature = multer({ storage: signatureStorage, limits: { fileSize: 2 * 1024 * 1024 } }); // max 2MB

app.post('/api/signatures', uploadSignature.single('signature_image'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { nama_dosen, nip, jabatan, is_active, keterangan } = req.body;
    const file = req.file;
    
    if (!nama_dosen || !nip || !jabatan) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Nama Dosen, NIP, dan Jabatan wajib diisi' });
    }
    
    if (!file) {
        return res.status(400).json({ error: 'File tanda tangan wajib diupload' });
    }
    
    const signature_path = `/assets/images/signatures/${file.filename}`;
    const is_active_int = is_active === 'true' || is_active === '1' ? 1 : 0;
    
    db.run(`INSERT INTO master_signature (nama_dosen, nip, jabatan, signature_image, is_active, keterangan) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [nama_dosen, nip, jabatan, signature_path, is_active_int, keterangan || ''],
        function(err) {
            if (err) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        });
});

// Update signature
app.put('/api/signatures/:id', uploadSignature.single('signature_image'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { nama_dosen, nip, jabatan, is_active, keterangan } = req.body;
    const file = req.file;
    
    if (!nama_dosen || !nip || !jabatan) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Nama Dosen, NIP, dan Jabatan wajib diisi' });
    }
    
    db.get(`SELECT * FROM master_signature WHERE id = ?`, [req.params.id], (err, signature) => {
        if (err) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(500).json({ error: err.message });
        }
        if (!signature) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(404).json({ error: 'Signature not found' });
        }
        
        let updateQuery = `UPDATE master_signature SET nama_dosen = ?, nip = ?, jabatan = ?, is_active = ?, keterangan = ?, updated_at = CURRENT_TIMESTAMP`;
        let params = [nama_dosen, nip, jabatan, is_active === 'true' || is_active === '1' ? 1 : 0, keterangan || ''];
        
        if (file) {
            // Hapus file lama
            const oldFilePath = path.join(__dirname, '../frontend', signature.signature_image);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
            updateQuery += `, signature_image = ?`;
            params.push(`/assets/images/signatures/${file.filename}`);
        }
        
        updateQuery += ` WHERE id = ?`;
        params.push(req.params.id);
        
        db.run(updateQuery, params, function(err) {
            if (err) {
                if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        });
    });
});

// Delete signature (soft delete - hapus file juga)
app.delete('/api/signatures/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.get(`SELECT signature_image FROM master_signature WHERE id = ?`, [req.params.id], (err, signature) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (signature && signature.signature_image) {
            const filePath = path.join(__dirname, '../frontend', signature.signature_image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        db.run(`DELETE FROM master_signature WHERE id = ?`, [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// ============ USER SIGNATURE ENDPOINT (Read Only) ============

// Get signature by ID untuk user (preview & cetak)
app.get('/api/user/signatures/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.get(`SELECT id, nama_dosen, jabatan, signature_image FROM master_signature WHERE id = ? AND is_active = 1`, 
        [req.params.id], 
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Signature not found' });
            res.json(row);
        });
});

// Get all active signatures untuk user (opsional, untuk dropdown di form)
app.get('/api/user/signatures', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.all(`SELECT id, nama_dosen, jabatan, signature_image FROM master_signature WHERE is_active = 1 ORDER BY nama_dosen`, 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        });
});

// ============ CONVERT DOCX TO PDF ============

app.post('/api/convert-docx-to-pdf', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { docxBuffer } = req.body;
    
    if (!docxBuffer) {
        return res.status(400).json({ error: 'No file provided' });
    }
    
    let tempDocxPath = null;
    let tempPdfPath = null;
    
    try {
        const buffer = Buffer.from(docxBuffer, 'base64');
        
        tempDocxPath = path.join(os.tmpdir(), `convert_${Date.now()}.docx`);
        tempPdfPath = path.join(os.tmpdir(), `convert_${Date.now()}.pdf`);
        
        fs.writeFileSync(tempDocxPath, buffer);
        console.log('Temp DOCX:', tempDocxPath);
        
        // Konversi dengan LibreOffice
        const libreOfficePath = '"D:\\LibreOffice\\program\\soffice.exe"';
        
        if (!fs.existsSync('D:\\LibreOffice\\program\\soffice.exe')) {
            throw new Error('LibreOffice tidak ditemukan di D:\\LibreOffice\\program\\soffice.exe');
        }
        
        await new Promise((resolve, reject) => {
            const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${path.dirname(tempPdfPath)}" "${tempDocxPath}"`;
            console.log('Running:', command);
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('LibreOffice error:', error);
                    reject(error);
                } else {
                    console.log('LibreOffice success');
                    resolve();
                }
            });
        });
        
        // Rename hasil konversi
        const autoPdfPath = tempDocxPath.replace('.docx', '.pdf');
        if (fs.existsSync(autoPdfPath)) {
            fs.renameSync(autoPdfPath, tempPdfPath);
        }
        
        console.log('PDF created:', tempPdfPath);
        
        // Baca PDF dan kirim sebagai base64
        const pdfBuffer = fs.readFileSync(tempPdfPath);
        
        const pdfBase64 = pdfBuffer.toString('base64');  // ✅ tambahkan baris ini
        res.json({ success: true, pdfBase64: pdfBase64 });
        
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (tempDocxPath && fs.existsSync(tempDocxPath)) {
            try { fs.unlinkSync(tempDocxPath); } catch(e) {}
        }
        if (tempPdfPath && fs.existsSync(tempPdfPath)) {
            try { fs.unlinkSync(tempPdfPath); } catch(e) {}
        }
    }
});

// ============ PREVIEW QR POSITION (UNTUK KALIBRASI ADMIN) ============
app.post('/api/preview-qr-position', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { templateId, x, y, width, height } = req.body;

    if (!templateId) {
        return res.status(400).json({ error: 'templateId wajib diisi' });
    }

    // Validasi koordinat dan ukuran
    const posX = typeof x === 'number' ? x : 400;
    const posY = typeof y === 'number' ? y : 500;
    const qrWidth = typeof width === 'number' ? width : 100;
    const qrHeight = typeof height === 'number' ? height : 100;

    let tempPdfPath = null;
    let finalDocxPath = null;

    try {
        // 1. Ambil template dari database
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!template?.file_path) {
            throw new Error('Template tidak ditemukan');
        }

        const templatePath = path.join(__dirname, '../frontend', template.file_path);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`File template tidak ada: ${templatePath}`);
        }

        // 2. Konversi DOCX ke PDF (tanpa injection data)
        finalDocxPath = path.join(os.tmpdir(), `preview_calibrate_${Date.now()}.docx`);
        tempPdfPath = path.join(os.tmpdir(), `preview_calibrate_${Date.now()}.pdf`);

        // Copy template asli ke file sementara (tidak perlu injection)
        fs.copyFileSync(templatePath, finalDocxPath);

        // 3. Konversi DOCX ke PDF via LibreOffice
        const libreOfficePath = 'D:\\LibreOffice\\program\\soffice.exe';
        if (!fs.existsSync(libreOfficePath)) {
            throw new Error('LibreOffice tidak ditemukan');
        }

        const outDir = path.dirname(tempPdfPath);
        await new Promise((resolve, reject) => {
            const cmd = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outDir}" "${finalDocxPath}"`;
            console.log('▶️ Preview calibrate:', cmd);
            exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('Konversi PDF gagal: ' + (stderr || error.message)));
                } else {
                    resolve();
                }
            });
        });

        const generatedPdf = finalDocxPath.replace(/\.docx$/i, '.pdf');
        if (!fs.existsSync(generatedPdf)) {
            throw new Error('PDF tidak terbuat setelah konversi');
        }
        fs.renameSync(generatedPdf, tempPdfPath);

        // 4. Load PDF dan overlay kotak dummy di posisi yang diminta
        const pdfBuffer = fs.readFileSync(tempPdfPath);
        const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
        
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const pageHeight = firstPage.getHeight();

        // Koordinat: (x, y) dihitung dari TOP-LEFT, konversi ke pdf-lib (bottom-left)
        const pdfX = posX;
        const pdfY = pageHeight - posY - qrHeight;

        // Gambar kotak merah dengan border putus-putus (opsional, pakai solid dulu)
        firstPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: qrWidth,
            height: qrHeight,
            borderColor: rgb(1, 0, 0),      // merah
            borderWidth: 2,
            color: rgb(1, 0.8, 0.8),        // background merah muda transparan
            opacity: 0.3
        });

        // Tambahkan teks kecil "QR POSITION" di tengah kotak
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const text = "QR";
        const textWidth = font.widthOfTextAtSize(text, 12);
        firstPage.drawText(text, {
            x: pdfX + (qrWidth / 2) - (textWidth / 2),
            y: pdfY + (qrHeight / 2) - 6,
            size: 12,
            font: font,
            color: rgb(1, 0, 0)
        });

        // 5. Simpan PDF final dengan overlay
        const finalPdfBuffer = await pdfDoc.save();

        // Pastikan buffer valid sebelum encode
        const safeBuffer = Buffer.isBuffer(finalPdfBuffer) ? finalPdfBuffer : Buffer.from(finalPdfBuffer);
        const rawBase64 = safeBuffer.toString('base64');

        // Hapus semua karakter yang tidak valid untuk base64 (hanya izinkan A-Z a-z 0-9 + / =)
        const cleanBase64 = rawBase64.replace(/[^A-Za-z0-9+/=]/g, '');

        console.log('✅ preview-qr-position base64 length:', cleanBase64.length, '| valid chars only');
        res.json({ success: true, pdfBase64: cleanBase64 });

    } catch (error) {
        console.error('❌ Preview QR position error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        // Bersihkan file temporary
        for (const p of [tempPdfPath, finalDocxPath]) {
            if (p && fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (_) {}
            }
        }
        // Hapus juga file PDF hasil konversi jika berbeda
        const autoPdf = finalDocxPath?.replace(/\.docx$/i, '.pdf');
        if (autoPdf && fs.existsSync(autoPdf)) {
            try { fs.unlinkSync(autoPdf); } catch (_) {}
        }
    }
});

// ============ GENERATE PDF (UNTUK PREVIEW) ============

app.post('/api/generate-pdf', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { templateId, allData } = req.body;

    if (!templateId) {
        return res.status(400). json({ error: 'Template ID required' });
    }

    let tempDocxPath = null;
    let tempPdfPath = null;
    let finalDocxPath = null;

    try {
        // ── 1. Ambil template dari DB ──────────────────────────────────
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });

        if (!template?.file_path) throw new Error('Template tidak ditemukan');

        const templatePath = path.join(__dirname, '../frontend', template.file_path);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`File template tidak ada: ${templatePath}`);
        }

        // ── 2. Helper functions ─────────────────────────────────────────
        function getCurrentSemester() {
            const month = new Date().getMonth() + 1;
            if ((month >= 8 && month <= 12) || month === 1) return 'Ganjil';
            return 'Genap';
        }

        function generateDocUuid() {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 8);
            return `OTP-${timestamp}-${random}`.toUpperCase();
        }

        // ── 3. System Data ──────────────────────────────────────────────
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${year}`;

        let tahunAkademik;
        if (month >= 7) {
            tahunAkademik = `${year}/${year + 1}`;
        } else {
            tahunAkademik = `${year - 1}/${year}`;
        }

        let semester;
        if ((month >= 8 && month <= 12) || month === 1) {
            semester = 'Ganjil';
        } else {
            semester = 'Genap';
        }

        const systemData = {
            tanggal: formattedDate,
            tanggal_surat: formattedDate,
            nomor_surat: `OTP/${year}/${Math.floor(Math.random() * 1000)}`,
            qr_code: `OTOPRINT-${Date.now()}`,
            tahun_akademik: tahunAkademik,
            semester: semester
        };

        // ── 4. Ambil semua field template ───────────────────────────────
        const fields = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM fields WHERE template_id = ?`, [templateId], (err, rows) => {
                if (err) reject(err); else resolve(rows || []);
            });
        });

        // Update allData dengan SYSTEM data
        for (const field of fields) {
            if (field.data_source === 'SYSTEM') {
                const sourceKey = field.source_key || field.field_name;
                allData[field.field_name] = systemData[sourceKey] || '';
            }
        }

        // ── 5. Ambil field MASTER_SIGNATURE ─────────────────────────────
        const signatureFields = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM fields WHERE template_id = ? AND data_source = 'MASTER_SIGNATURE'`,
                [templateId],
                (err, rows) => { if (err) reject(err); else resolve(rows || []); }
            );
        });

        console.log('📋 Signature fields detail:');
        signatureFields.forEach(f => {
            console.log(`   ID: ${f.id}, Name: ${f.field_name}, display_type: ${f.display_type || 'image (default)'}`);
        });

        // ── 6. Pisahkan: image signature vs qr signature ─────────────────
        const imageSignatureFields = signatureFields.filter(f => !f.display_type || f.display_type === 'image');
        const qrSignatureFields = signatureFields.filter(f => f.display_type === 'qr');

        // ── 7. Load path gambar signature (hanya untuk image) ────────────
        const signatureImages = {};
        for (const field of imageSignatureFields) {
            const sig = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT signature_image FROM master_signature WHERE id = ?`,
                    [field.source_key],
                    (err, row) => { if (err) reject(err); else resolve(row); }
                );
            });

            if (sig?.signature_image) {
                const imgPath = path.join(__dirname, '../frontend', sig.signature_image);
                if (fs.existsSync(imgPath)) {
                    signatureImages[field.field_name] = imgPath;
                    console.log(`✅ Signature image: ${field.field_name} → ${imgPath}`);
                }
            }
        }

        // ── 8. Siapkan renderData untuk image signature ─────────────────
        const renderData = { ...allData };
        for (const key of Object.keys(signatureImages)) {
            renderData[key] = key;
        }

        // ── 9. Inject teks + gambar signature ke DOCX ───────────────────
        const { injectSignaturesToDocx } = require('./signatureInjector');

        tempDocxPath = path.join(os.tmpdir(), `temp_${Date.now()}.docx`);
        tempPdfPath = path.join(os.tmpdir(), `pdf_${Date.now()}.pdf`);
        finalDocxPath = path.join(os.tmpdir(), `final_${Date.now()}.docx`);

        try {
            const injectedBuffer = await injectSignaturesToDocx(
                templatePath,
                renderData,
                signatureImages
            );
            fs.writeFileSync(finalDocxPath, injectedBuffer);
            console.log('✅ Injection berhasil');
        } catch (injectError) {
            console.error('❌ Injection gagal:', injectError.message);
            fs.copyFileSync(templatePath, finalDocxPath);
        }

        // ── 10. Konversi DOCX → PDF via LibreOffice ─────────────────────
        const libreOfficePath = 'D:\\LibreOffice\\program\\soffice.exe';
        if (!fs.existsSync(libreOfficePath)) {
            throw new Error(`LibreOffice tidak ditemukan di: ${libreOfficePath}`);
        }

        const outDir = path.dirname(tempPdfPath);
        await new Promise((resolve, reject) => {
            const cmd = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${outDir}" "${finalDocxPath}"`;
            console.log('▶️ Running:', cmd);
            exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('Konversi PDF gagal: ' + (stderr || error.message)));
                } else {
                    console.log('✅ LibreOffice selesai');
                    resolve();
                }
            });
        });

        const generatedPdf = finalDocxPath.replace(/\.docx$/i, '.pdf');
        if (!fs.existsSync(generatedPdf)) {
            throw new Error(`PDF tidak terbuat. Cek LibreOffice. Path: ${generatedPdf}`);
        }
        fs.renameSync(generatedPdf, tempPdfPath);
        console.log('📄 PDF siap:', tempPdfPath);

        // ── 11. Load PDF untuk overlay QR signature ─────────────────────
        let finalPdfBuffer = fs.readFileSync(tempPdfPath); // initial buffer

        // Hanya proses overlay jika ada QR signature fields
        if (qrSignatureFields.length > 0) {
            const { PDFDocument } = require('pdf-lib');
            const QRCode = require('qrcode');
            
            const pdfDoc = await PDFDocument.load(finalPdfBuffer);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            for (const field of qrSignatureFields) {
                // QR signature mewakili TTD dosen (source_key = id dosen di master_signature)
                const docUuid  = generateDocUuid();
                const verifyUrl = `${req.protocol}://${req.get('host')}/verify-signature.html?doc=${docUuid}`;

                // Simpan ke document_verifications — sertakan signature_id agar halaman verifikasi bisa tampilkan info dosen
                db.run(`INSERT OR IGNORE INTO document_verifications 
                        (doc_uuid, template_id, user_id, user_name, user_nim, document_name, metadata, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
                    [docUuid, templateId,
                     req.session.user.id,
                     req.session.user.name || req.session.user.nim,
                     req.session.user.nim || '-',
                     template.name_id,
                     JSON.stringify({ signature_id: field.source_key || null, ...allData })],
                    (err) => { if (err) console.warn('⚠️ Simpan verifikasi gagal:', err.message); }
                );

                // Generate QR image
                const qrSize   = field.width || field.height || 100;
                const qrBuffer = await QRCode.toBuffer(verifyUrl, {
                    width: qrSize,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                });
                const qrImage = await pdfDoc.embedPng(qrBuffer);

                // Posisi QR — konversi dari top-left (sistem admin) ke bottom-left (pdf-lib)
                const posX    = field.pos_x || 460;
                const posY    = field.pos_y || 700;
                const pdfY    = firstPage.getHeight() - posY - qrSize;

                firstPage.drawImage(qrImage, {
                    x: posX,
                    y: pdfY,
                    width: qrSize,
                    height: qrSize
                });

                console.log(`✅ QR preview overlay: field=${field.field_name}, x=${posX}, pdfY=${pdfY}, size=${qrSize}`);
                console.log(`🔗 Verify URL: ${verifyUrl}`);
            }

            // Simpan PDF dengan QR
            finalPdfBuffer = await pdfDoc.save();
            console.log(`✅ PDF dengan QR berhasil dibuat, size: ${finalPdfBuffer.length} bytes`);
        } else {
            console.log('ℹ️ Tidak ada QR signature fields, PDF tetap asli.');
        }

                // ── 12. Kirim PDF base64 ke frontend ────────────────────────────
        // Pastikan finalPdfBuffer adalah Buffer
        let pdfBuffer = finalPdfBuffer;
        if (!Buffer.isBuffer(pdfBuffer)) {
            pdfBuffer = Buffer.from(pdfBuffer);
        }
        const pdfBase64 = pdfBuffer.toString('base64');

        console.log('✅ Base64 valid, length:', pdfBase64.length);
        res.json({ success: true, pdfBase64 });

    } catch (error) {
        console.error('❌ Generate PDF error:', error.message);
        res.status(500).json({ error: error.message });

    } finally {
        for (const p of [tempDocxPath, tempPdfPath, finalDocxPath]) {
            if (p && fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (_) {}
            }
        }
    }
});

// ============ VERIFIKASI SIGNATURE (QR TTD) ============
app.get('/api/verify-signature', (req, res) => {
    const { doc } = req.query;

    if (!doc) {
        return res.json({ valid: false, message: 'Parameter doc tidak ditemukan' });
    }

    db.get(`SELECT * FROM document_verifications WHERE doc_uuid = ?`, [doc], (err, docData) => {
        if (err || !docData) {
            return res.json({ valid: false, message: 'Dokumen tidak ditemukan dalam sistem' });
        }

        if (docData.status !== 'active') {
            return res.json({ valid: false, message: 'Dokumen ini telah dicabut status keabsahannya' });
        }

        let metadata = {};
        try { metadata = JSON.parse(docData.metadata || '{}'); } catch(e) {}

        const signatureId = metadata.signature_id || req.query.sig || null;

        const buildResponse = (sigData) => res.json({
            valid: true,
            doc_uuid: doc,
            document_name: docData.document_name,
            user_name: docData.user_name,
            user_nim: docData.user_nim,
            printed_at: docData.printed_at || docData.created_at,
            signature: sigData ? {
                nama_dosen: sigData.nama_dosen,
                nip: sigData.nip,
                jabatan: sigData.jabatan
            } : null
        });

        if (signatureId) {
            db.get(`SELECT * FROM master_signature WHERE id = ?`, [signatureId], (err2, sigData) => {
                buildResponse(sigData || null);
            });
        } else {
            buildResponse(null);
        }
    });
});

//==================== ENDPOINTS TEMPLATES V2 =============================
// Tabel layout untuk V2 (koordinat-based)
db.run(`CREATE TABLE IF NOT EXISTS template_layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    template_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    field_name TEXT,
    label TEXT,
    signature_id INTEGER,
    qr_url TEXT,
    image_url TEXT,
    x INTEGER,
    y INTEGER,
    width INTEGER,
    height INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
)`);

// Get layout
app.get('/api/templates/:id/layout', (req, res) => {
  db.all(`SELECT * FROM template_layouts WHERE template_id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Save layout
app.post('/api/templates/:id/layout', (req, res) => {
  const { layout } = req.body;
  db.run(`DELETE FROM template_layouts WHERE template_id = ?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const stmt = db.prepare(`INSERT INTO template_layouts (template_id, type, field_name, label, signature_id, qr_url, image_url, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const item of layout) {
      stmt.run([req.params.id, item.type, item.field_name, item.label, item.signature_id, item.qr_url, item.image_url, item.x, item.y, item.width, item.height]);
    }
    stmt.finalize();
    res.json({ success: true });
  });
});

// Preview PDF untuk admin (tanpa data)
app.get('/api/preview-pdf/:templateId', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { templateId } = req.params;
  
  try {
    const template = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    
    if (!template?.file_path) {
      return res.status(404).json({ error: 'Template tidak ditemukan' });
    }
    
    const templatePath = path.join(__dirname, '../frontend', template.file_path);
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'File template tidak ada' });
    }
    
    // Konversi DOCX ke PDF
    const pdfBuffer = await convertDocxToPdf(templatePath);
    const pdfBase64 = pdfBuffer.toString('base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ V2 ENDPOINTS ============
// 1. Preview PDF untuk editor (GET, langsung return PDF)
app.get('/api/v2/preview-pdf/:templateId', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { templateId } = req.params;
    
    try {
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });
        
        if (!template?.file_path) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }
        
        const templatePath = path.join(__dirname, '../frontend', template.file_path);
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: 'File template tidak ada' });
        }
        
        // Gunakan fungsi yang sudah di-export
        const pdfBuffer = await generateEmptyPreview(templatePath);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Generate PDF untuk user (POST, dengan data)
app.post('/api/v2/generate-pdf', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { templateId, allData } = req.body;
    
    try {
        const template = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM templates WHERE id = ?`, [templateId], (err, row) => {
                if (err) reject(err); else resolve(row);
            });
        });
        
        if (!template?.file_path) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }
        
        const templatePath = path.join(__dirname, '../frontend', template.file_path);
        
        // Ambil layout fields untuk signature
        const layoutFields = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM template_layouts WHERE template_id = ? AND type IN ('qr', 'signature')`, 
                [templateId], (err, rows) => { if (err) reject(err); else resolve(rows || []); }
            );
        });
        
        // Proses signature images
        const signatureImages = {};
        for (const field of layoutFields) {
            if (field.signature_id) {
                const sig = await new Promise((resolve, reject) => {
                    db.get(`SELECT signature_image FROM master_signature WHERE id = ?`, 
                        [field.signature_id], (err, row) => { if (err) reject(err); else resolve(row); }
                    );
                });
                if (sig?.signature_image) {
                    signatureImages[`sig_${field.id}`] = path.join(__dirname, '../frontend', sig.signature_image);
                }
            }
        }
        
        // Generate PDF dengan data
        const { generatePdfWithLayout } = require('./pdfGenerator');
        const pdfBuffer = await generatePdfWithLayout(templatePath, allData, layoutFields, signatureImages);
        
        const pdfBase64 = pdfBuffer.toString('base64');
        res.json({ success: true, pdfBase64 });
        
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Print untuk user (POST)
app.post('/api/v2/print', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { templateId, allData, document_type_id } = req.body;
    
    try {
        // Sama seperti generate-pdf, tapi langsung cetak ke printer
        // ... (gunakan logika yang sama dengan /api/print-to-printer)
        
        const { printPdf } = require('./pdfGenerator');
        await printPdf(templateId, allData, req.session.user.id);
        
        res.json({ success: true, message: 'Dokumen berhasil dicetak' });
        
    } catch (error) {
        console.error('Print error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ VERIFIKASI DOKUMEN (PUBLIC) ============

// Endpoint verifikasi dokumen
app.get('/api/verify/:uuid', (req, res) => {
  const { uuid } = req.params;
  
  db.get(`SELECT * FROM document_verifications WHERE doc_uuid = ?`, [uuid], (err, doc) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!doc) {
      return res.json({ valid: false, message: 'Dokumen tidak ditemukan dalam sistem' });
    }
    
    if (doc.status !== 'active') {
      return res.json({ valid: false, message: 'Dokumen ini telah dicabut status keabsahannya' });
    }
    
    // Update verified_count
    db.run(`UPDATE document_verifications SET verified_count = verified_count + 1, last_verified_at = CURRENT_TIMESTAMP WHERE id = ?`, [doc.id]);
    
    // Parse metadata
    let metadata = {};
    try {
      metadata = JSON.parse(doc.metadata || '{}');
    } catch(e) {}
    
    res.json({
      valid: true,
      doc_uuid: doc.doc_uuid,
      document_name: doc.document_name,
      user_name: doc.user_name,
      user_nim: doc.user_nim,
      printed_at: doc.printed_at,
      verified_count: doc.verified_count + 1,
      metadata: metadata
    });
  });
});

// ============ QR VERIFIKASI HELPER FUNCTIONS ============

// Generate unique document UUID
function generateDocUuid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `OTP-${timestamp}-${random}`.toUpperCase();
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📁 Frontend path: ${frontendPath}`);
    console.log(`🔗 Login page: http://localhost:${PORT}/login.html`);
    console.log(`🔗 Home page: http://localhost:${PORT}/Index.html`);
});