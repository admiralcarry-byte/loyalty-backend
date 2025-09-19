const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const { createWorker } = require('tesseract.js');
const jsQR = require('jsqr');

/**
 * QR Code Reader Utility
 * Extracts QR code data from receipt images
 */
class QRCodeReader {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'];
  }

  /**
   * Extract QR code data from image file
   * @param {string} filePath - Path to the image file
   * @returns {Promise<Object>} QR code extraction result
   */
  async extractQRCodeData(filePath) {
    try {
      console.log('Starting QR code extraction...');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Check file format
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported file format: ${ext}`);
      }

      let qrData = null;
      let extractionMethod = 'none';

      // Try different QR code extraction methods
      if (ext === '.pdf') {
        // For PDFs, we need to convert to image first
        const imagePath = await this.convertPDFToImage(filePath);
        qrData = await this.extractQRFromImage(imagePath);
        extractionMethod = 'pdf-conversion';
        
        // Clean up temporary image
        if (imagePath !== filePath && fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } else {
        // For image files, try direct extraction
        qrData = await this.extractQRFromImage(filePath);
        extractionMethod = 'direct';
      }

      if (qrData) {
        console.log('QR code found and extracted successfully');
        return {
          success: true,
          qrData: qrData,
          extractionMethod: extractionMethod,
          confidence: 1.0
        };
      } else {
        console.log('No QR code found in image');
        return {
          success: false,
          qrData: null,
          extractionMethod: extractionMethod,
          error: 'No QR code detected in the image'
        };
      }
    } catch (error) {
      console.error('QR code extraction error:', error);
      return {
        success: false,
        qrData: null,
        extractionMethod: 'error',
        error: error.message
      };
    }
  }

  /**
   * Extract QR code from image using jsQR library
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object|null>} Extracted QR code data or null
   */
  async extractQRFromImage(imagePath) {
    try {
      // Load and process image with Jimp
      const image = await Jimp.read(imagePath);
      
      // Convert to grayscale for better QR detection
      image.greyscale();
      
      // Resize if image is too large (QR codes work better with moderate sizes)
      if (image.width > 1000 || image.height > 1000) {
        image.scaleToFit({ w: 1000, h: 1000 });
      }

      // Get image data for jsQR
      const { data, width, height } = image.bitmap;
      
      // Try to detect QR code
      const code = jsQR(data, width, height);
      
      if (code) {
        console.log('QR code detected:', code.data);
        
        // Try to parse the QR code data as JSON
        try {
          const parsedData = JSON.parse(code.data);
          return {
            rawData: code.data,
            parsedData: parsedData,
            location: code.location,
            version: code.version
          };
        } catch (parseError) {
          // If not JSON, return as raw text
          return {
            rawData: code.data,
            parsedData: null,
            location: code.location,
            version: code.version
          };
        }
      }

      // If no QR code found with jsQR, try with Tesseract as fallback
      return await this.extractQRWithTesseract(imagePath);
    } catch (error) {
      console.error('QR extraction from image failed:', error);
      return null;
    }
  }

  /**
   * Extract QR code using Tesseract as fallback method
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object|null>} Extracted QR code data or null
   */
  async extractQRWithTesseract(imagePath) {
    try {
      console.log('Trying Tesseract for QR code extraction...');
      
      const worker = await createWorker('eng');
      
      // Configure Tesseract for QR code detection
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{}[]":,.-_/\\',
        tessedit_pageseg_mode: '8' // Single word
      });

      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();

      // Look for JSON-like patterns in the extracted text
      const jsonPattern = /\{.*\}/s;
      const match = text.match(jsonPattern);
      
      if (match) {
        try {
          const parsedData = JSON.parse(match[0]);
          return {
            rawData: match[0],
            parsedData: parsedData,
            location: null,
            version: null,
            method: 'tesseract'
          };
        } catch (parseError) {
          // Return raw text if parsing fails
          return {
            rawData: match[0],
            parsedData: null,
            location: null,
            version: null,
            method: 'tesseract'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Tesseract QR extraction failed:', error);
      return null;
    }
  }

  /**
   * Convert PDF to image for QR code extraction
   * @param {string} pdfPath - Path to the PDF file
   * @returns {Promise<string>} Path to the converted image
   */
  async convertPDFToImage(pdfPath) {
    try {
      // For now, we'll use a simple approach
      // In production, you might want to use pdf-poppler or similar
      const imagePath = pdfPath.replace('.pdf', '_converted.png');
      
      // This is a placeholder - in a real implementation, you'd use a PDF to image converter
      // For now, we'll just return the original path and let the caller handle it
      console.log('PDF conversion not implemented - using original file');
      return pdfPath;
    } catch (error) {
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Parse QR code data and extract relevant fields
   * @param {Object} qrData - Raw QR code data
   * @returns {Object} Parsed and structured QR code data
   */
  parseQRCodeData(qrData) {
    try {
      if (!qrData) {
        return {
          success: false,
          error: 'No QR code data to parse',
          extractedFields: {}
        };
      }

      // Handle both parsed JSON data and raw text data
      let data = qrData.parsedData;
      const rawData = qrData.rawData;
      
      // If no parsed data, try to parse raw data as JSON
      if (!data && rawData) {
        try {
          data = JSON.parse(rawData);
        } catch (parseError) {
          // If not JSON, treat as raw text and try to extract fields
          data = this.extractFieldsFromText(rawData);
        }
      }

      if (!data) {
        return {
          success: false,
          error: 'No QR code data to parse',
          extractedFields: {}
        };
      }

      console.log('QR Code Data Structure:', JSON.stringify(data, null, 2));
      
      // Extract common fields from QR code data with more flexible mapping
      const extractedFields = {
        receiptId: this.extractField(data, ['receiptId', 'id', 'invoiceNumber', 'invoice', 'invoiceId', 'receipt_id', 'receipt_number']),
        storeNumber: this.extractField(data, ['storeNumber', 'storeId', 'store', 'store_id', 'store_number', 'location']),
        amount: this.extractField(data, ['amount', 'total', 'value', 'price', 'cost', 'sum']),
        date: this.extractField(data, ['dateFormatted', 'date', 'timestamp', 'createdAt', 'time', 'created_at', 'purchase_date']),
        verificationCode: this.extractField(data, ['verificationCode', 'code', 'verification', 'verify_code', 'verification_code', 'storeNumberHash']),
        customerName: this.extractField(data, ['customerName', 'customer', 'purchaser', 'buyer', 'clientName', 'userName', 'customerId', 'userId', 'user_id', 'customer_id', 'client_id']),
        transactionId: this.extractField(data, ['transactionId', 'txId', 'transaction', 'transaction_id', 'tx_id', 'payment_id']) || 'Cash',
        rawData: rawData
      };

      return {
        success: true,
        extractedFields: extractedFields,
        originalData: data
      };
    } catch (error) {
      console.error('QR code data parsing error:', error);
      return {
        success: false,
        error: error.message,
        extractedFields: {}
      };
    }
  }

  /**
   * Extract a field value using multiple possible keys
   * @param {Object} data - Data object to search
   * @param {Array} keys - Array of possible keys to try
   * @returns {*} The found value or null
   */
  extractField(data, keys) {
    for (const key of keys) {
      if (data && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        return data[key];
      }
    }
    return null;
  }

  /**
   * Extract fields from raw text data using pattern matching
   * @param {string} text - Raw text data
   * @returns {Object} Extracted fields object
   */
  extractFieldsFromText(text) {
    const fields = {};
    
    // Try to extract common patterns
    const patterns = {
      amount: /(?:amount|total|value|price)[\s:]*[\$R\$]?[\s]*([\d,]+\.?\d*)/i,
      store: /(?:store|location)[\s:]*[\#]?[\s]*(\d+)/i,
      date: /(?:date|time)[\s:]*([\d\-\/]+)/i,
      receipt: /(?:receipt|invoice)[\s:]*[\#]?[\s]*([A-Za-z0-9\-]+)/i,
      customer: /(?:customer|user)[\s:]*[\#]?[\s]*([A-Za-z0-9\-]+)/i
    };

    for (const [field, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        fields[field] = match[1];
      }
    }

    return fields;
  }

  /**
   * Complete QR code extraction and parsing workflow
   * @param {string} filePath - Path to the receipt file
   * @returns {Promise<Object>} Complete QR code processing result
   */
  async processReceiptQRCode(filePath) {
    try {
      // Step 1: Extract QR code data
      const qrResult = await this.extractQRCodeData(filePath);
      
      if (!qrResult.success) {
        return {
          success: false,
          error: qrResult.error,
          qrData: null,
          extractedFields: {}
        };
      }

      // Step 2: Parse the extracted QR code data
      const parseResult = this.parseQRCodeData(qrResult.qrData);
      
      // Step 3: Use QR code's own dateFormatted field (no OCR override needed)
      // The QR code already contains the correct formatted date in dateFormatted field
      console.log('Using QR code dateFormatted field:', parseResult.extractedFields.date);
      
      return {
        success: true,
        qrData: qrResult.qrData,
        extractedFields: parseResult.extractedFields,
        extractionMethod: qrResult.extractionMethod,
        confidence: qrResult.confidence,
        originalData: parseResult.originalData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        qrData: null,
        extractedFields: {}
      };
    }
  }
}

module.exports = new QRCodeReader();