// pdfGenerator.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

// Cek LibreOffice path
function getLibreOfficePath() {
    const possiblePaths = [
        'D:\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('✅ LibreOffice ditemukan di:', p);
            return p;
        }
    }
    return null;
}

async function convertDocxToPdf(docxPath) {
    // Cek file input
    if (!fs.existsSync(docxPath)) {
        throw new Error(`File DOCX tidak ditemukan: ${docxPath}`);
    }
    
    // Cek LibreOffice
    const libreOfficePath = getLibreOfficePath();
    if (!libreOfficePath) {
        console.warn('⚠️ LibreOffice tidak ditemukan, preview tidak tersedia');
        // Return dummy PDF (kosong) agar tidak error
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        page.drawText('Preview tidak tersedia - LibreOffice tidak ditemukan', {
            x: 50, y: 400, size: 14, color: rgb(0.8, 0, 0)
        });
        return await pdfDoc.save();
    }
    
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `convert_${Date.now()}.pdf`);
    
    console.log('📄 Konversi DOCX:', docxPath);
    console.log('📁 Output:', tempPdfPath);
    
    return new Promise((resolve, reject) => {
        const cmd = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${tempDir}" "${docxPath}"`;
        console.log('▶️ Running:', cmd);
        
        exec(cmd, { timeout: 60000 }, async (error, stdout, stderr) => {
            if (error) {
                console.error('LibreOffice error:', error.message);
                console.error('Stderr:', stderr);
                
                // Fallback: buat PDF dummy
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([595, 842]);
                page.drawText(`Preview gagal: ${error.message.substring(0, 50)}`, {
                    x: 50, y: 400, size: 12, color: rgb(0.8, 0, 0)
                });
                const pdfBuffer = await pdfDoc.save();
                resolve(pdfBuffer);
                return;
            }
            
            // Cek hasil konversi
            const inputFilename = path.basename(docxPath);
            const outputFilename = inputFilename.replace(/\.docx$/i, '.pdf');
            const generatedPdf = path.join(tempDir, outputFilename);
            
            console.log('Expected PDF:', generatedPdf);
            console.log('File exists?', fs.existsSync(generatedPdf));
            
            if (!fs.existsSync(generatedPdf)) {
                // Cari file PDF lain di tempDir
                const files = fs.readdirSync(tempDir);
                const pdfFiles = files.filter(f => f.endsWith('.pdf') && f.includes('convert_'));
                if (pdfFiles.length > 0) {
                    const foundPdf = path.join(tempDir, pdfFiles[0]);
                    console.log('Found alternative:', foundPdf);
                    fs.renameSync(foundPdf, tempPdfPath);
                } else {
                    // Fallback: buat PDF dummy
                    const pdfDoc = await PDFDocument.create();
                    const page = pdfDoc.addPage([595, 842]);
                    page.drawText('Preview tidak tersedia - Konversi gagal', {
                        x: 50, y: 400, size: 14, color: rgb(0.8, 0, 0)
                    });
                    const pdfBuffer = await pdfDoc.save();
                    resolve(pdfBuffer);
                    return;
                }
            } else {
                fs.renameSync(generatedPdf, tempPdfPath);
            }
            
            const pdfBuffer = fs.readFileSync(tempPdfPath);
            fs.unlinkSync(tempPdfPath);
            resolve(pdfBuffer);
        });
    });
}

async function generateEmptyPreview(docxPath) {
    return await convertDocxToPdf(docxPath);
}

async function generatePdfBuffer(templatePath, allData = {}) {
    return await convertDocxToPdf(templatePath);
}

async function generatePdfWithLayout(templatePath, allData, layoutFields, signatureImages) {
    // Sementara gunakan convert biasa
    return await convertDocxToPdf(templatePath);
}

module.exports = {
    convertDocxToPdf,
    generateEmptyPreview,
    generatePdfBuffer,
    generatePdfWithLayout
};