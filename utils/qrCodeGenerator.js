const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * QR Code Generator Utility
 * Generates QR codes for invoices and receipts
 */
class QRCodeGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../uploads/qr-codes');
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate QR code for store number
   * @param {string} storeNumber - Store number to encode
   * @param {Object} options - QR code options
   * @returns {Promise<Object>} QR code data and file path
   */
  async generateStoreQRCode(storeNumber, options = {}) {
    try {
      const defaultOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200,
        ...options
      };

      // Generate QR code data URL
      const qrDataURL = await QRCode.toDataURL(storeNumber, defaultOptions);
      
      // Generate unique filename
      const filename = `qr-${storeNumber}-${Date.now()}.png`;
      const filePath = path.join(this.outputDir, filename);
      
      // Save QR code as file
      const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');

      return {
        success: true,
        dataURL: qrDataURL,
        filePath: filePath,
        filename: filename,
        storeNumber: storeNumber,
        size: defaultOptions.width
      };
    } catch (error) {
      console.error('QR code generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate QR code for invoice data
   * @param {Object} invoiceData - Invoice data to encode
   * @param {Object} options - QR code options
   * @returns {Promise<Object>} QR code data and file path
   */
  async generateInvoiceQRCode(invoiceData, options = {}) {
    try {
      // Create QR code data object
      const qrData = {
        invoiceId: invoiceData.invoiceId || invoiceData.saleId,
        storeNumber: invoiceData.storeNumber,
        storeNumberHash: invoiceData.storeNumberHash,
        amount: invoiceData.amount,
        liters: invoiceData.litersPurchased,
        date: invoiceData.dateGenerated,
        dateFormatted: invoiceData.dateGeneratedFormatted || new Date(invoiceData.dateGenerated).toLocaleDateString('en-GB') + ' - ' + new Date(invoiceData.dateGenerated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        purchaser: invoiceData.purchaserName
      };

      // Convert to JSON string for QR code
      const qrString = JSON.stringify(qrData);

      const defaultOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300,
        ...options
      };

      // Generate QR code data URL
      const qrDataURL = await QRCode.toDataURL(qrString, defaultOptions);
      
      // Generate unique filename
      const filename = `invoice-qr-${invoiceData.invoiceId || 'unknown'}-${Date.now()}.png`;
      const filePath = path.join(this.outputDir, filename);
      
      // Save QR code as file
      const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');

      return {
        success: true,
        dataURL: qrDataURL,
        filePath: filePath,
        filename: filename,
        qrData: qrData,
        size: defaultOptions.width
      };
    } catch (error) {
      console.error('Invoice QR code generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse QR code data from string
   * @param {string} qrString - QR code string to parse
   * @returns {Object} Parsed QR code data
   */
  parseQRCodeData(qrString) {
    try {
      const qrData = JSON.parse(qrString);
      return {
        success: true,
        data: qrData
      };
    } catch (error) {
      console.error('QR code parsing error:', error);
      return {
        success: false,
        error: 'Invalid QR code data format',
        originalString: qrString
      };
    }
  }

  /**
   * Generate QR code for receipt verification
   * @param {Object} receiptData - Receipt data to encode
   * @param {Object} options - QR code options
   * @returns {Promise<Object>} QR code data and file path
   */
  async generateReceiptQRCode(receiptData, options = {}) {
    try {
      const qrData = {
        receiptId: receiptData.receiptId || Date.now(),
        storeNumber: receiptData.storeNumber,
        amount: receiptData.amount,
        date: receiptData.date || new Date().toISOString(),
        verificationCode: this.generateVerificationCode()
      };

      const qrString = JSON.stringify(qrData);

      const defaultOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200,
        ...options
      };

      const qrDataURL = await QRCode.toDataURL(qrString, defaultOptions);
      
      const filename = `receipt-qr-${qrData.receiptId}-${Date.now()}.png`;
      const filePath = path.join(this.outputDir, filename);
      
      const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(filePath, base64Data, 'base64');

      return {
        success: true,
        dataURL: qrDataURL,
        filePath: filePath,
        filename: filename,
        qrData: qrData,
        size: defaultOptions.width
      };
    } catch (error) {
      console.error('Receipt QR code generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate verification code for receipts
   * @returns {string} Verification code
   */
  generateVerificationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up old QR code files
   * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
   */
  cleanOldFiles(maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old QR code file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up QR code files:', error);
    }
  }

  /**
   * Generate complete invoice as image (JPG/PNG)
   * @param {Object} invoiceData - Invoice data
   * @param {Object} options - Image generation options
   * @returns {Promise<Object>} Invoice image data and file path
   */
  async generateInvoiceImage(invoiceData, options = {}) {
    try {
      const defaultOptions = {
        format: 'png', // 'png' or 'jpg'
        width: 900,
        height: 1600,
        quality: 0.9,
        ...options
      };

      // Create canvas
      const canvas = createCanvas(defaultOptions.width, defaultOptions.height);
      const ctx = canvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, defaultOptions.width, defaultOptions.height);

      // ===== HEADER SECTION =====
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, defaultOptions.width, 100);
      
      // Company name - original size to prevent overlap
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ÁGUA TWEZAH', defaultOptions.width / 2, 45);
      
      // Invoice title - original size
      ctx.font = 'bold 28px Arial';
      ctx.fillText('INVOICE / NOTA FISCAL', defaultOptions.width / 2, 80);

      // ===== BODY SECTION =====
      let yPos = 150;

      // Generate QR code - 1.3x larger than previous 300px (390px)
      const qrResult = await this.generateInvoiceQRCode(invoiceData, { width: 390 });
      if (!qrResult.success) {
        throw new Error('Failed to generate QR code: ' + qrResult.error);
      }

      // Load QR code image
      const qrImage = await loadImage(qrResult.filePath);

      // QR Code Section - Centered in body
      const qrSize = 390;
      const qrX = (defaultOptions.width - qrSize) / 2;
      const qrY = yPos;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // QR code label
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Scan for verification', defaultOptions.width / 2, qrY + qrSize + 40);

      // Text Content Section - Below QR code with proper formatting
      yPos = qrY + qrSize + 100;
      
      // Invoice details section header
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Invoice Details', defaultOptions.width / 2, yPos);
      yPos += 60;

      // Invoice information with field labels on left, values on right
      const leftMargin = 100;
      const labelWidth = 200; // Fixed width for all labels to align colons
      const rightMargin = leftMargin + labelWidth + 20; // Values start after label width + spacing
      const lineHeight = 50;
      
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      
      // Combined Invoice Details (includes all information)
      const invoiceDetails = [
        { label: 'Invoice ID:', value: invoiceData.invoiceId || 'N/A' },
        { label: 'Date:', value: invoiceData.dateGeneratedFormatted || (new Date(invoiceData.dateGenerated || Date.now()).toLocaleDateString('en-GB') + ' - ' + new Date(invoiceData.dateGenerated || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })) },
        { label: 'Store:', value: invoiceData.storeNumber || 'N/A' },
        { label: 'Customer:', value: invoiceData.purchaserName || 'N/A' },
        { label: 'Phone:', value: invoiceData.phoneNumber || 'N/A' },
        { label: 'Email:', value: invoiceData.email || 'N/A' },
        { label: 'Liters:', value: `${invoiceData.litersPurchased || 0}L` },
        { label: 'Amount:', value: `R$ ${(invoiceData.amount || 0).toFixed(2)}` },
        { label: 'Payment:', value: invoiceData.paymentMethod || 'Cash' },
        { label: 'QR Code Hash:', value: invoiceData.storeNumberHash || 'N/A' }
      ];

      invoiceDetails.forEach(detail => {
        // Field label on the left with fixed width
        ctx.fillStyle = '#2C3E50';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(detail.label, leftMargin, yPos);
        
        // Value on the right at consistent position
        ctx.fillStyle = '#34495E';
        ctx.font = '24px Arial';
        ctx.fillText(detail.value, rightMargin, yPos);
        
        yPos += lineHeight;
      });

      // ===== BOTTOM SECTION =====
      yPos = defaultOptions.height - 120;
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Thank you for choosing ÁGUA TWEZAH', defaultOptions.width / 2, yPos);
      ctx.fillText('This invoice was generated electronically', defaultOptions.width / 2, yPos + 30);
      ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, defaultOptions.width / 2, yPos + 60);

      // Generate filename and save
      const filename = `invoice-${invoiceData.invoiceId || 'unknown'}-${Date.now()}.${defaultOptions.format}`;
      const filePath = path.join(this.outputDir, filename);
      
      // Convert canvas to buffer
      let buffer;
      if (defaultOptions.format === 'jpg' || defaultOptions.format === 'jpeg') {
        buffer = canvas.toBuffer('image/jpeg', { quality: defaultOptions.quality });
      } else {
        buffer = canvas.toBuffer(`image/${defaultOptions.format}`);
      }
      fs.writeFileSync(filePath, buffer);

      return {
        success: true,
        filePath: filePath,
        filename: filename,
        format: defaultOptions.format,
        width: defaultOptions.width,
        height: defaultOptions.height,
        qrCode: qrResult
      };
    } catch (error) {
      console.error('Invoice image generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get QR code file info
   * @param {string} filename - QR code filename
   * @returns {Object} File information
   */
  getFileInfo(filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        success: true,
        filename: filename,
        filePath: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        success: false,
        error: 'File not found'
      };
    }
  }
}

module.exports = new QRCodeGenerator();