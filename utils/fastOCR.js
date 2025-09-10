const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');

/**
 * Fast OCR Parser for Receipt Scanning
 * Simple, lightweight implementation focused on speed
 * Uses basic Tesseract.js with minimal preprocessing
 */
class FastOCR {
  constructor() {
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Validate file format and size
   */
  validateFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes. Maximum allowed: ${this.maxFileSize} bytes`);
    }

    return true;
  }

  /**
   * Fast text extraction with minimal preprocessing
   */
  async extractText(filePath) {
    try {
      this.validateFile(filePath);
      
      const startTime = Date.now();
      const ext = path.extname(filePath).toLowerCase();
      
      let extractedText = '';
      let confidence = 0;
      
      if (ext === '.pdf') {
        // Handle PDF files
        const result = await this.extractTextFromPDF(filePath);
        extractedText = result.text;
        confidence = result.confidence;
      } else {
        // Handle image files with minimal preprocessing
        const result = await this.extractTextFromImage(filePath);
        extractedText = result.text;
        confidence = result.confidence;
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        text: extractedText,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error('Fast OCR extraction error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        confidence: 0
      };
    }
  }

  /**
   * Extract text from PDF files
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return {
        text: data.text,
        confidence: 0.95 // PDF text extraction is highly reliable
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image files using basic Tesseract.js
   */
  async extractTextFromImage(filePath) {
    try {
      // Minimal preprocessing - just convert to grayscale for speed
      const processedImagePath = await this.preprocessImageFast(filePath);
      
      // Perform OCR with basic settings for speed
      const { data: { text, confidence } } = await Tesseract.recognize(
        processedImagePath,
        'eng+por', // Only English and Portuguese for speed
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`Fast OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      // Clean up processed image if it's different from original
      if (processedImagePath !== filePath && fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }
      
      return {
        text: text.trim(),
        confidence: confidence / 100 // Convert to 0-1 scale
      };
    } catch (error) {
      throw new Error(`Image OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Fast image preprocessing - minimal operations for speed
   */
  async preprocessImageFast(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const processedPath = filePath.replace(ext, '_fast_processed.png');
      
      // Only convert to grayscale - no other processing for speed
      await sharp(filePath)
        .greyscale()
        .png()
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      console.warn('Fast preprocessing failed, using original:', error.message);
      return filePath; // Return original if preprocessing fails
    }
  }

  /**
   * Fast receipt parsing with basic patterns
   */
  parseReceiptData(extractedText) {
    try {
      const parsedData = this.extractReceiptFields(extractedText);
      
      return {
        success: true,
        data: parsedData,
        confidence: parsedData.confidence
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Extract receipt fields using simple regex patterns
   */
  extractReceiptFields(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract basic fields
    const invoiceNumber = this.extractInvoiceNumber(text);
    const date = this.extractDate(text);
    const amountResult = this.extractAmount(text);
    const storeName = this.extractStoreName(lines);
    const paymentMethod = this.extractPaymentMethod(text);
    
    // Calculate confidence based on extracted fields
    const extractedFields = [invoiceNumber, date, amountResult.amount, storeName, paymentMethod];
    const validFields = extractedFields.filter(field => field && field !== 'unknown' && field !== 'UNKNOWN' && field > 0);
    const confidence = validFields.length / extractedFields.length;
    
    return {
      invoiceNumber: invoiceNumber || 'UNKNOWN',
      storeName: storeName || 'Unknown Store',
      amount: amountResult.amount || 0,
      currency: amountResult.currency || 'BRL',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'unknown',
      confidence: Math.max(confidence, 0.1) // Minimum 10% confidence
    };
  }

  /**
   * Extract invoice number from text
   */
  extractInvoiceNumber(text) {
    const patterns = [
      /(?:NOTA|CUPOM|NF|NFCe|Nº|Numero|Number)[\s:]*(\d+)/i,
      /(?:Invoice|Bill|Receipt)[\s#:]*(\d+)/i,
      /#(\d{6,})/i,
      /(\d{8,})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Extract date from text
   */
  extractDate(text) {
    const datePatterns = [
      /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.parseDate(match[1]);
      }
    }
    
    return new Date();
  }

  /**
   * Extract total amount from text
   */
  extractAmount(text) {
    const currencyPatterns = [
      // Brazilian Real
      { pattern: /(?:TOTAL|TOTAL FINAL|VALOR TOTAL|Total)[\s:]*R\$\s*(\d+[,.]?\d*)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|FINAL)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d{1,3}(?:[,.]?\d{3})*[,.]?\d{2})/, currency: 'BRL' },
      
      // US Dollar
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*\$\s*(\d+[,.]?\d*)/i, currency: 'USD' },
      { pattern: /\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'USD' },
      
      // Euro
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*€\s*(\d+[,.]?\d*)/i, currency: 'EUR' },
      { pattern: /€\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'EUR' },
      
      // Generic patterns
      { pattern: /(?:Total|Amount)[\s:]*(\d+[,.]?\d*)/i, currency: 'UNKNOWN' }
    ];
    
    for (const { pattern, currency } of currencyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const amountStr = match[1].replace(',', '.');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          return { amount, currency };
        }
      }
    }
    
    return { amount: 0, currency: 'BRL' };
  }

  /**
   * Extract store name from text
   */
  extractStoreName(lines) {
    // Store name is usually in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines that look like addresses, CNPJ, or other metadata
      if (line.match(/(?:CNPJ|CPF|Rua|Av|Avenida|CEP|\d{2}\.\d{3}\.\d{3}\/\d{4})/i)) {
        continue;
      }
      
      // Skip very short lines or lines with only numbers
      if (line.length < 3 || /^\d+$/.test(line)) {
        continue;
      }
      
      // Return the first meaningful line as store name
      return line;
    }
    
    return null;
  }

  /**
   * Extract payment method from text
   */
  extractPaymentMethod(text) {
    const paymentPatterns = [
      { pattern: /(?:CARTÃO|CARD|CREDIT|DEBIT)/i, value: 'card' },
      { pattern: /(?:DINHEIRO|CASH|MOEDA)/i, value: 'cash' },
      { pattern: /PIX/i, value: 'pix' },
      { pattern: /(?:BOLETO|BANK SLIP)/i, value: 'boleto' },
      { pattern: /(?:TRANSFER|TRANSFERÊNCIA)/i, value: 'bank_transfer' }
    ];
    
    for (const { pattern, value } of paymentPatterns) {
      const match = text.match(pattern);
      if (match) {
        return value;
      }
    }
    
    return 'unknown';
  }

  /**
   * Complete fast OCR and parsing workflow
   */
  async processReceipt(filePath) {
    try {
      // Step 1: Extract text using fast OCR
      const ocrResult = await this.extractText(filePath);
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: `Fast OCR failed: ${ocrResult.error}`,
          extractedText: '',
          parsedData: null
        };
      }

      // Step 2: Parse receipt data from extracted text
      const parseResult = this.parseReceiptData(ocrResult.text);
      
      return {
        success: true,
        extractedText: ocrResult.text,
        parsedData: parseResult.data,
        confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
        processingTime: ocrResult.processingTime,
        extractionMethod: 'fast'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        extractedText: '',
        parsedData: null
      };
    }
  }

  /**
   * Parse date string to Date object
   */
  parseDate(dateString) {
    try {
      // Handle Brazilian date format (DD/MM/YYYY)
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
      
      // Handle ISO format
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize() {
    return this.maxFileSize;
  }

  /**
   * Validate extracted data
   */
  validateExtractedData(data) {
    const errors = [];
    const warnings = [];
    
    // Check if this looks like a receipt
    const isLikelyReceipt = this.isLikelyReceiptContent(data);
    
    if (!isLikelyReceipt) {
      errors.push('This does not appear to be a receipt. Please upload an image of an actual purchase receipt, invoice, or bill.');
    }
    
    // Check amount
    if (!data.amount || data.amount <= 0) {
      errors.push('Amount not found or invalid - this is required for processing');
    }
    
    // Check confidence level
    if (data.confidence < 0.3) {
      warnings.push('Low confidence in extracted data - manual verification recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if the extracted data looks like a receipt
   */
  isLikelyReceiptContent(data) {
    const receiptIndicators = [
      data.amount && data.amount > 0,
      data.storeName && data.storeName !== 'Unknown Store',
      data.confidence > 0.2,
      data.currency && data.currency !== 'UNKNOWN'
    ];
    
    const indicatorCount = receiptIndicators.filter(Boolean).length;
    return indicatorCount >= 2;
  }
}

module.exports = new FastOCR();