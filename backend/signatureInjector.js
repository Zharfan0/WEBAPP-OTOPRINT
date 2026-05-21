const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');

/**
 * Render DOCX template dengan teks + gambar signature.
 * Template harus pakai:
 *   {field}   → teks biasa
 *   {%field}  → gambar (image module)
 *
 * @param {string} templatePath   - Path absolut file .docx template
 * @param {object} data           - { nama: '...', nim: '...', ttd: 'ttd', ... }
 * @param {object} signatureImages - { ttd: '/abs/path/to/image.png' }
 * @returns {Promise<Buffer>}
 */
async function injectSignaturesToDocx(templatePath, data, signatureImages) {
    return new Promise((resolve, reject) => {
        try {
            const content = fs.readFileSync(templatePath, 'binary');
            const zip = new PizZip(content);

            const imageModule = new ImageModule({
                centered: false,
                fileType: 'docx',

                getImage(tagValue, tagName) {
                    console.log(`🖼️  getImage dipanggil → tagName: "${tagName}"`);

                    const imgPath = signatureImages[tagName];
                    if (!imgPath) {
                        console.warn(`⚠️  Tidak ada path untuk tag: "${tagName}"`);
                        return null;
                    }
                    if (!fs.existsSync(imgPath)) {
                        console.warn(`⚠️  File tidak ditemukan: ${imgPath}`);
                        return null;
                    }

                    const buffer = fs.readFileSync(imgPath);
                    console.log(`✅ Gambar dimuat: ${imgPath} (${buffer.length} bytes)`);
                    return buffer;
                },

                getSize(img, tagValue, tagName) {
                    if (!img) return [1, 1]; // ukuran minimal agar tidak crash
                    // Sesuaikan per field jika perlu
                    return [150, 60];
                }
            });

            const doc = new Docxtemplater(zip, {
                modules: [imageModule],
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(data);

            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            console.log(`✅ DOCX rendered, buffer: ${buffer.length} bytes`);
            resolve(buffer);

        } catch (error) {
            // Tampilkan error detail dari docxtemplater
            if (error.properties?.errors?.length) {
                error.properties.errors.forEach(e => {
                    console.error(
                        `❌ Tag error: "${e.properties?.tag}" — ${e.message}`
                    );
                });
            } else {
                console.error('❌ Injection error:', error.message);
            }
            reject(error);
        }
    });
}

module.exports = { injectSignaturesToDocx };