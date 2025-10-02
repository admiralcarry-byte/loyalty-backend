const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');

/**
 * OCR Parser Utility for Receipt Scanning
 * Real implementation using Tesseract.js for OCR processing
 * Supports image files (JPG, PNG, TIFF, BMP) and PDF files
 */

class OCRParser {
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
   * Extract text from image/PDF using OCR
   * Real implementation using Tesseract.js
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
        // Handle image files
        const result = await this.extractTextFromImage(filePath);
        extractedText = result.text;
        confidence = result.confidence;
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        extractedText,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        error: error.message,
        extractedText: '',
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
        confidence: 0.9 // PDF text extraction is generally reliable
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image files using Tesseract.js
   */
  async extractTextFromImage(filePath) {
    try {
      // Preprocess image for better OCR results
      const processedImagePath = await this.preprocessImage(filePath);
      
      // Perform OCR with Tesseract.js - Universal language support
      const { data: { text, confidence } } = await Tesseract.recognize(
        processedImagePath,
        'eng+por+spa+fra+deu+ita+jpn+chi_sim+chi_tra+ara+rus', // Multiple languages for universal support
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
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
   * Preprocess image for better OCR results
   */
  async preprocessImage(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const processedPath = filePath.replace(ext, '_processed.png');
      
      // Use Sharp to enhance image for OCR
      await sharp(filePath)
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen edges
        .png() // Convert to PNG for better OCR
        .toFile(processedPath);
      
      return processedPath;
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error.message);
      return filePath; // Return original if preprocessing fails
    }
  }

  /**
   * Parse receipt data from extracted text
   * Real implementation using regex patterns for Brazilian receipts
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
   * Extract receipt fields using regex patterns
   */
  extractReceiptFields(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract invoice number
    const invoiceNumber = this.extractInvoiceNumber(text);
    
    // Extract date
    const date = this.extractDate(text);
    
    // Extract total amount
    const amountResult = this.extractAmount(text);
    
    // Extract store name
    const storeName = this.extractStoreName(lines);
    
    // Extract payment method
    const paymentMethod = this.extractPaymentMethod(text);
    
    // Extract cashback
    const cashback = this.extractCashback(text);
    
    // Calculate confidence based on how many fields were successfully extracted
    const extractedFields = [invoiceNumber, date, amountResult.amount, storeName, paymentMethod];
    const validFields = extractedFields.filter(field => field && field !== 'unknown' && field !== 'UNKNOWN' && field > 0);
    const confidence = validFields.length / extractedFields.length;
    
    return {
      invoiceNumber: invoiceNumber || 'UNKNOWN',
      storeName: storeName || 'Unknown Store',
      amount: amountResult.amount || 0,
      currency: amountResult.currency || 'AOA',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'unknown',
      cashback: cashback || 0,
      confidence: Math.max(confidence, 0.1) // Minimum 10% confidence
    };
  }

  /**
   * Extract invoice number from text
   */
  extractInvoiceNumber(text) {
    // Common patterns for invoice numbers in Brazilian receipts
    const patterns = [
      /(?:NOTA|CUPOM|NF|NFCe|Nº|Numero|Number)[\s:]*(\d+)/i,
      /(?:Invoice|Bill|Receipt)[\s#:]*(\d+)/i,
      /(?:Número|Número da Nota)[\s:]*(\d+)/i,
      /#(\d{6,})/i, // 6+ digit numbers with #
      /(\d{8,})/ // 8+ digit numbers (common for Brazilian invoices)
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
   * Extract date from text - Universal date format support
   */
  extractDate(text) {
    // Universal date patterns
    const datePatterns = [
      // Brazilian format (DD/MM/YYYY)
      { pattern: /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i, format: 'DD/MM/YYYY' },
      { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})/, format: 'DD/MM/YYYY' },
      
      // US format (MM/DD/YYYY)
      { pattern: /(?:Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i, format: 'MM/DD/YYYY' },
      
      // ISO format (YYYY-MM-DD)
      { pattern: /(\d{4}-\d{1,2}-\d{1,2})/, format: 'YYYY-MM-DD' },
      
      // European format (DD-MM-YYYY)
      { pattern: /(\d{1,2}-\d{1,2}-\d{2,4})/, format: 'DD-MM-YYYY' },
      
      // Generic patterns
      { pattern: /(\d{1,2}\.\d{1,2}\.\d{2,4})/, format: 'DD.MM.YYYY' },
      { pattern: /(\d{4}\/\d{1,2}\/\d{1,2})/, format: 'YYYY/MM/DD' }
    ];
    
    for (const { pattern, format } of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.parseUniversalDate(match[1], format);
      }
    }
    
    return new Date();
  }

  /**
   * Extract total amount from text - Universal currency support
   */
  extractAmount(text) {
    // Universal currency patterns
    const currencyPatterns = [
      // Angolan Kwanza (Kz)
      { pattern: /(?:TOTAL|TOTAL FINAL|VALOR TOTAL|Total)[\s:]*Kz\s*(\d+[,.]?\d*)/i, currency: 'AOA' },
      { pattern: /Kz\s*(\d+[,.]?\d*)\s*(?:TOTAL|FINAL)/i, currency: 'AOA' },
      { pattern: /Kz\s*(\d{1,3}(?:[,.]?\d{3})*[,.]?\d{2})/, currency: 'AOA' },
      { pattern: /AOA\s*(\d+[,.]?\d*)/i, currency: 'AOA' },
      
      // Brazilian Real (for compatibility)
      { pattern: /(?:TOTAL|TOTAL FINAL|VALOR TOTAL|Total)[\s:]*R\$\s*(\d+[,.]?\d*)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|FINAL)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d{1,3}(?:[,.]?\d{3})*[,.]?\d{2})/, currency: 'BRL' },
      
      // US Dollar
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*\$\s*(\d+[,.]?\d*)/i, currency: 'USD' },
      { pattern: /\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'USD' },
      { pattern: /USD\s*(\d+[,.]?\d*)/i, currency: 'USD' },
      
      // Euro
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*€\s*(\d+[,.]?\d*)/i, currency: 'EUR' },
      { pattern: /€\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'EUR' },
      { pattern: /EUR\s*(\d+[,.]?\d*)/i, currency: 'EUR' },
      
      // British Pound
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*£\s*(\d+[,.]?\d*)/i, currency: 'GBP' },
      { pattern: /£\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'GBP' },
      { pattern: /GBP\s*(\d+[,.]?\d*)/i, currency: 'GBP' },
      
      // Japanese Yen
      { pattern: /(?:TOTAL|Total|Amount)[\s:]*¥\s*(\d+[,.]?\d*)/i, currency: 'JPY' },
      { pattern: /¥\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'JPY' },
      { pattern: /JPY\s*(\d+[,.]?\d*)/i, currency: 'JPY' },
      
      // Generic patterns (fallback to AOA)
      { pattern: /(?:Total|Amount)[\s:]*(\d+[,.]?\d*)/i, currency: 'AOA' },
      { pattern: /(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'AOA' }
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
    
    return { amount: 0, currency: 'AOA' };
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
      { pattern: /(?:PAGAMENTO|FORMA DE PAGAMENTO|Payment)[\s:]*([^\\n]+)/i, group: 1 },
      { pattern: /(?:CARTÃO|CARD|CREDIT|DEBIT)/i, value: 'card' },
      { pattern: /(?:DINHEIRO|CASH|MOEDA)/i, value: 'cash' },
      { pattern: /PIX/i, value: 'pix' },
      { pattern: /(?:BOLETO|BANK SLIP)/i, value: 'boleto' },
      { pattern: /(?:TRANSFER|TRANSFERÊNCIA)/i, value: 'bank_transfer' }
    ];
    
    for (const { pattern, group, value } of paymentPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (value) {
          return value;
        } else if (group && match[group]) {
          return this.normalizePaymentMethod(match[group]);
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * Complete OCR and parsing workflow
   */
  async processReceipt(filePath) {
    try {
      // Step 1: Extract text using OCR
      const ocrResult = await this.extractText(filePath);
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: `OCR failed: ${ocrResult.error}`,
          extractedText: '',
          parsedData: null
        };
      }

      // Step 2: Parse receipt data from extracted text
      const parseResult = this.parseReceiptData(ocrResult.extractedText);
      
      return {
        success: true,
        extractedText: ocrResult.extractedText,
        parsedData: parseResult.data,
        confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
        processingTime: ocrResult.processingTime
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
   * Parse date string to Date object - Universal date format support
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
   * Parse universal date formats
   */
  parseUniversalDate(dateString, format) {
    try {
      let year, month, day;
      
      switch (format) {
        case 'DD/MM/YYYY':
          const parts1 = dateString.split('/');
          day = parseInt(parts1[0]);
          month = parseInt(parts1[1]) - 1;
          year = parseInt(parts1[2]);
          break;
          
        case 'MM/DD/YYYY':
          const parts2 = dateString.split('/');
          month = parseInt(parts2[0]) - 1;
          day = parseInt(parts2[1]);
          year = parseInt(parts2[2]);
          break;
          
        case 'YYYY-MM-DD':
          const parts3 = dateString.split('-');
          year = parseInt(parts3[0]);
          month = parseInt(parts3[1]) - 1;
          day = parseInt(parts3[2]);
          break;
          
        case 'DD-MM-YYYY':
          const parts4 = dateString.split('-');
          day = parseInt(parts4[0]);
          month = parseInt(parts4[1]) - 1;
          year = parseInt(parts4[2]);
          break;
          
        case 'DD.MM.YYYY':
          const parts5 = dateString.split('.');
          day = parseInt(parts5[0]);
          month = parseInt(parts5[1]) - 1;
          year = parseInt(parts5[2]);
          break;
          
        case 'YYYY/MM/DD':
          const parts6 = dateString.split('/');
          year = parseInt(parts6[0]);
          month = parseInt(parts6[1]) - 1;
          day = parseInt(parts6[2]);
          break;
          
        default:
          return new Date(dateString);
      }
      
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Normalize payment method
   */
  normalizePaymentMethod(method) {
    const normalized = method.toLowerCase();
    
    if (normalized.includes('cartão') || normalized.includes('card')) {
      return 'card';
    } else if (normalized.includes('dinheiro') || normalized.includes('cash')) {
      return 'cash';
    } else if (normalized.includes('pix')) {
      return 'pix';
    } else if (normalized.includes('boleto')) {
      return 'boleto';
    } else if (normalized.includes('transfer') || normalized.includes('transferência')) {
      return 'bank_transfer';
    } else {
      return 'unknown';
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
    
    // Check if this looks like a receipt vs other content
    const isLikelyReceipt = this.isLikelyReceiptContent(data);
    
    if (!isLikelyReceipt) {
      errors.push('This does not appear to be a receipt. Please upload an image of an actual purchase receipt, invoice, or bill.');
      errors.push('Make sure the image contains: store name, purchase amount, date, and item details.');
    }
    
    // Check invoice number
    if (!data.invoiceNumber || data.invoiceNumber === 'UNKNOWN') {
      warnings.push('Invoice number not found - this is common for some receipt types');
    }
    
    // Check amount
    if (!data.amount || data.amount <= 0) {
      errors.push('Amount not found or invalid - this is required for processing');
    } else if (data.amount > 10000) {
      warnings.push('Amount seems unusually high - please verify');
    }
    
    // Check date
    if (!data.date || isNaN(new Date(data.date).getTime())) {
      warnings.push('Date not found or invalid - using current date');
    } else {
      const receiptDate = new Date(data.date);
      const now = new Date();
      const daysDiff = Math.abs(now - receiptDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) {
        warnings.push('Receipt date is more than a year old');
      }
    }
    
    // Check store name
    if (!data.storeName || data.storeName === 'Unknown Store') {
      warnings.push('Store name not found - this may affect store matching');
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
    // Check for receipt-like patterns
    const receiptIndicators = [
      // Has a valid amount
      data.amount && data.amount > 0,
      
      // Has a reasonable store name (not generic app terms)
      data.storeName && 
      data.storeName !== 'Unknown Store' && 
      !data.storeName.toLowerCase().includes('update') &&
      !data.storeName.toLowerCase().includes('notification') &&
      !data.storeName.toLowerCase().includes('reward') &&
      !data.storeName.toLowerCase().includes('level'),
      
      // Has reasonable confidence
      data.confidence > 0.2,
      
      // Currency is not unknown
      data.currency && data.currency !== 'UNKNOWN'
    ];
    
    // Count how many indicators are present
    const indicatorCount = receiptIndicators.filter(Boolean).length;
    
    // Consider it a receipt if at least 2 out of 4 indicators are present
    return indicatorCount >= 2;
  }

  /**
   * Extract cashback amount from text
   */
  extractCashback(text) {
    try {
      // Look for cashback patterns in Brazilian Portuguese and English
      const cashbackPatterns = [
        /cashback[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        /cashback[:\s]*(\d+[.,]\d{2})/i,
        /cash.*back[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        /reembolso[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        /reembolso[:\s]*(\d+[.,]\d{2})/i,
        /devolução[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        /devolução[:\s]*(\d+[.,]\d{2})/i,
        /cb[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        /cb[:\s]*(\d+[.,]\d{2})/i
      ];

      for (const pattern of cashbackPatterns) {
        const match = text.match(pattern);
        if (match) {
          // Convert Brazilian decimal format (comma) to standard format (dot)
          const cashbackValue = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(cashbackValue) && cashbackValue > 0) {
            console.log('OCR Parser - Cashback extracted:', cashbackValue);
            return cashbackValue;
          }
        }
      }

      console.log('OCR Parser - No cashback found in text');
      return 0;
    } catch (error) {
      console.log('OCR Parser - Error extracting cashback:', error);
      return 0;
    }
  }
}

module.exports = new OCRParser();