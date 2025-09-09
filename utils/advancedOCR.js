const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const ocrConfig = require('../config/ocrConfig');

/**
 * Advanced OCR Parser with Enhanced Features
 * High-performance OCR with multiple processing techniques
 */
class AdvancedOCR {
  constructor() {
    this.supportedFormats = ocrConfig.files.supportedFormats;
    this.maxFileSize = ocrConfig.files.maxFileSize;
    this.cache = new Map(); // Simple in-memory cache
    this.workerPool = []; // Worker pool for parallel processing
    this.maxWorkers = ocrConfig.performance.maxWorkers;
    this.config = ocrConfig;
  }

  /**
   * Initialize worker pool for parallel processing
   */
  async initializeWorkers() {
    if (this.workerPool.length === 0) {
      for (let i = 0; i < this.maxWorkers; i++) {
        try {
          const worker = await Tesseract.createWorker(
            this.config.tesseract.languages, 
            this.config.tesseract.oem, 
            {
              logger: m => {
                if (this.config.logging.logOCRProgress && m.status === 'recognizing text') {
                  console.log(`Worker ${i} OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
              },
              // Suppress language file warnings
              errorHandler: (err) => {
                if (err.message && err.message.includes('special-words')) {
                  // Ignore missing special-words file warnings
                  return;
                }
                console.warn(`Worker ${i} warning:`, err.message);
              }
            }
          );
          
          // Only set parameters that can be set after initialization
          const safeOptions = {
            preserve_interword_spaces: '1',
            textord_min_linesize: '2.0',
            textord_force_make_prop_words: 'F'
          };
          
          try {
            await worker.setParameters(safeOptions);
          } catch (paramError) {
            console.warn(`Failed to set some parameters for worker ${i}:`, paramError.message);
          }
          
          this.workerPool.push(worker);
        } catch (error) {
          console.error(`Failed to initialize worker ${i}:`, error.message);
          // Continue with other workers
        }
      }
    }
  }

  /**
   * Get available worker from pool
   */
  async getWorker() {
    await this.initializeWorkers();
    return this.workerPool[Math.floor(Math.random() * this.workerPool.length)];
  }

  /**
   * Enhanced image preprocessing with multiple techniques
   */
  async preprocessImageAdvanced(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const processedPaths = [];
      
      // Technique 1: Standard preprocessing
      const standardPath = filePath.replace(ext, '_standard.png');
      await sharp(filePath)
        .greyscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(standardPath);
      processedPaths.push({ path: standardPath, technique: 'standard' });

      // Technique 2: High contrast preprocessing
      const contrastPath = filePath.replace(ext, '_contrast.png');
      await sharp(filePath)
        .greyscale()
        .normalize({ lower: 10, upper: 100 })
        .linear(1.2, -(128 * 0.2))
        .sharpen({ sigma: 1.5, m1: 0.5, m2: 2.0 })
        .png()
        .toFile(contrastPath);
      processedPaths.push({ path: contrastPath, technique: 'contrast' });

      // Technique 3: Denoised preprocessing
      const denoisedPath = filePath.replace(ext, '_denoised.png');
      await sharp(filePath)
        .greyscale()
        .normalize()
        .convolve({
          width: 3,
          height: 3,
          kernel: [
            -1, -1, -1,
            -1,  9, -1,
            -1, -1, -1
          ]
        })
        .png()
        .toFile(denoisedPath);
      processedPaths.push({ path: denoisedPath, technique: 'denoised' });

      // Technique 4: Upscaled preprocessing for small text
      const upscaledPath = filePath.replace(ext, '_upscaled.png');
      await sharp(filePath)
        .greyscale()
        .resize(null, null, { kernel: sharp.kernel.lanczos3 })
        .normalize()
        .sharpen()
        .png()
        .toFile(upscaledPath);
      processedPaths.push({ path: upscaledPath, technique: 'upscaled' });

      return processedPaths;
    } catch (error) {
      console.warn('Advanced preprocessing failed, using original:', error.message);
      return [{ path: filePath, technique: 'original' }];
    }
  }

  /**
   * Multi-technique OCR processing
   */
  async extractTextMultiTechnique(filePath) {
    try {
      const processedImages = await this.preprocessImageAdvanced(filePath);
      const results = [];

      // Process each preprocessed image
      for (const { path: imagePath, technique } of processedImages) {
        try {
          const worker = await this.getWorker();
          const { data: { text, confidence } } = await worker.recognize(imagePath);
          
          results.push({
            technique,
            text: text.trim(),
            confidence: confidence / 100,
            imagePath
          });
        } catch (error) {
          console.warn(`OCR failed for technique ${technique}:`, error.message);
        }
      }

      // Clean up processed images
      for (const { imagePath } of processedImages) {
        if (imagePath !== filePath && fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Select best result based on confidence and text length
      const bestResult = this.selectBestResult(results);
      
      return {
        success: true,
        text: bestResult.text,
        confidence: bestResult.confidence,
        technique: bestResult.technique,
        allResults: results
      };
    } catch (error) {
      throw new Error(`Multi-technique OCR failed: ${error.message}`);
    }
  }

  /**
   * Select best OCR result from multiple techniques
   */
  selectBestResult(results) {
    if (results.length === 0) {
      throw new Error('No OCR results available');
    }

    // Score each result based on confidence and text quality
    const scoredResults = results.map(result => {
      const textLength = result.text.length;
      const confidence = result.confidence;
      
      // Bonus for longer text (more content extracted)
      const lengthBonus = Math.min(textLength / 100, 0.2);
      
      // Penalty for very short text
      const lengthPenalty = textLength < 10 ? -0.3 : 0;
      
      // Bonus for specific receipt keywords
      const keywordBonus = this.calculateKeywordBonus(result.text);
      
      const score = confidence + lengthBonus + lengthPenalty + keywordBonus;
      
      return {
        ...result,
        score
      };
    });

    // Return result with highest score
    return scoredResults.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Calculate bonus score based on receipt keywords
   */
  calculateKeywordBonus(text) {
    const receiptKeywords = [
      'total', 'amount', 'price', 'invoice', 'receipt', 'bill',
      'total', 'valor', 'preço', 'nota', 'cupom', 'fatura',
      'date', 'data', 'time', 'hora', 'store', 'loja',
      'payment', 'pagamento', 'card', 'cartão', 'cash', 'dinheiro'
    ];

    const textLower = text.toLowerCase();
    const keywordCount = receiptKeywords.filter(keyword => 
      textLower.includes(keyword)
    ).length;

    return Math.min(keywordCount * 0.05, 0.2); // Max 0.2 bonus
  }

  /**
   * Enhanced text extraction with caching
   */
  async extractText(filePath) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(filePath);
      if (this.cache.has(cacheKey)) {
        console.log('Using cached OCR result');
        return this.cache.get(cacheKey);
      }

      this.validateFile(filePath);
      
      const startTime = Date.now();
      const ext = path.extname(filePath).toLowerCase();
      
      let result;
      
      if (ext === '.pdf') {
        result = await this.extractTextFromPDF(filePath);
      } else {
        result = await this.extractTextMultiTechnique(filePath);
      }
      
      const processingTime = Date.now() - startTime;
      
      const finalResult = {
        ...result,
        processingTime,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, finalResult);
      
      return finalResult;
    } catch (error) {
      console.error('Advanced OCR extraction error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        confidence: 0
      };
    }
  }

  /**
   * Enhanced PDF text extraction
   */
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer, {
        // Enhanced PDF parsing options
        max: 0, // No page limit
        version: 'v1.10.100' // Latest version
      });
      
      return {
        success: true,
        text: data.text,
        confidence: 0.95, // PDF text extraction is highly reliable
        technique: 'pdf_parse',
        pageCount: data.numpages,
        info: data.info
      };
    } catch (error) {
      throw new Error(`Enhanced PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Generate cache key for file
   */
  getCacheKey(filePath) {
    const stats = fs.statSync(filePath);
    return `${filePath}_${stats.mtime.getTime()}_${stats.size}`;
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
   * Enhanced receipt parsing with AI-like pattern recognition
   */
  parseReceiptDataAdvanced(extractedText) {
    try {
      const parsedData = this.extractReceiptFieldsAdvanced(extractedText);
      
      return {
        success: true,
        data: parsedData,
        confidence: parsedData.confidence,
        extractionMethod: 'advanced'
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
   * Advanced receipt field extraction with machine learning-like patterns
   */
  extractReceiptFieldsAdvanced(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Enhanced field extraction
    const invoiceNumber = this.extractInvoiceNumberAdvanced(text);
    const date = this.extractDateAdvanced(text);
    const amountResult = this.extractAmountAdvanced(text);
    const storeName = this.extractStoreNameAdvanced(lines);
    const paymentMethod = this.extractPaymentMethodAdvanced(text);
    const items = this.extractItemsAdvanced(text);
    const taxInfo = this.extractTaxInfoAdvanced(text);
    
    // Calculate advanced confidence scoring
    const confidence = this.calculateAdvancedConfidence({
      invoiceNumber, date, amountResult, storeName, paymentMethod, items, taxInfo
    });
    
    return {
      invoiceNumber: invoiceNumber || 'UNKNOWN',
      storeName: storeName || 'Unknown Store',
      amount: amountResult.amount || 0,
      currency: amountResult.currency || 'UNKNOWN',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'unknown',
      items: items || [],
      taxInfo: taxInfo || {},
      confidence: Math.max(confidence, 0.1),
      extractionMethod: 'advanced'
    };
  }

  /**
   * Advanced invoice number extraction with multiple patterns
   */
  extractInvoiceNumberAdvanced(text) {
    const patterns = [
      // Brazilian patterns
      /(?:NOTA|CUPOM|NF|NFCe|Nº|Numero|Number)[\s:]*(\d+)/i,
      /(?:Invoice|Bill|Receipt)[\s#:]*(\d+)/i,
      /(?:Número|Número da Nota)[\s:]*(\d+)/i,
      /#(\d{6,})/i,
      /(\d{8,})/,
      
      // Enhanced patterns for various formats
      /(?:Doc|Document|Documento)[\s:]*(\d+)/i,
      /(?:Ref|Reference|Referência)[\s:]*(\d+)/i,
      /(?:ID|Identificador)[\s:]*(\d+)/i,
      /(?:Trans|Transaction|Transação)[\s:]*(\d+)/i,
      
      // Pattern for alphanumeric invoice numbers
      /(?:NOTA|CUPOM|NF)[\s:]*([A-Z0-9]{6,})/i,
      /(?:Invoice|Bill)[\s:]*([A-Z0-9]{6,})/i
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
   * Advanced date extraction with timezone awareness
   */
  extractDateAdvanced(text) {
    const datePatterns = [
      // Brazilian format with time
      { pattern: /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2})/i, format: 'DD/MM/YYYY HH:mm' },
      { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2})/, format: 'DD/MM/YYYY HH:mm' },
      
      // Standard Brazilian format
      { pattern: /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i, format: 'DD/MM/YYYY' },
      { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})/, format: 'DD/MM/YYYY' },
      
      // US format
      { pattern: /(?:Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i, format: 'MM/DD/YYYY' },
      
      // ISO format
      { pattern: /(\d{4}-\d{1,2}-\d{1,2})/, format: 'YYYY-MM-DD' },
      
      // European format
      { pattern: /(\d{1,2}-\d{1,2}-\d{2,4})/, format: 'DD-MM-YYYY' },
      
      // Generic patterns
      { pattern: /(\d{1,2}\.\d{1,2}\.\d{2,4})/, format: 'DD.MM.YYYY' },
      { pattern: /(\d{4}\/\d{1,2}\/\d{1,2})/, format: 'YYYY/MM/DD' }
    ];
    
    for (const { pattern, format } of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.parseUniversalDateAdvanced(match[1], format, match[2]);
      }
    }
    
    return new Date();
  }

  /**
   * Advanced amount extraction with multiple currencies and formats
   */
  extractAmountAdvanced(text) {
    const currencyPatterns = [
      // Brazilian Real with various formats
      { pattern: /(?:TOTAL|TOTAL FINAL|VALOR TOTAL|Total|Valor)[\s:]*R\$\s*(\d+[,.]?\d*)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|FINAL|Total)/i, currency: 'BRL' },
      { pattern: /R\$\s*(\d{1,3}(?:[,.]?\d{3})*[,.]?\d{2})/, currency: 'BRL' },
      { pattern: /(?:Real|BRL)[\s:]*(\d+[,.]?\d*)/i, currency: 'BRL' },
      
      // US Dollar
      { pattern: /(?:TOTAL|Total|Amount|Sum)[\s:]*\$\s*(\d+[,.]?\d*)/i, currency: 'USD' },
      { pattern: /\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total|Amount)/i, currency: 'USD' },
      { pattern: /USD\s*(\d+[,.]?\d*)/i, currency: 'USD' },
      { pattern: /(?:Dollar|Dollars)[\s:]*(\d+[,.]?\d*)/i, currency: 'USD' },
      
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
      
      // Generic patterns
      { pattern: /(?:Total|Amount|Sum)[\s:]*(\d+[,.]?\d*)/i, currency: 'UNKNOWN' },
      { pattern: /(\d+[,.]?\d*)\s*(?:TOTAL|Total|Amount)/i, currency: 'UNKNOWN' }
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
    
    return { amount: 0, currency: 'UNKNOWN' };
  }

  /**
   * Advanced store name extraction
   */
  extractStoreNameAdvanced(lines) {
    // Look for store name in first few lines with enhanced filtering
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines that look like addresses, CNPJ, or other metadata
      if (line.match(/(?:CNPJ|CPF|Rua|Av|Avenida|CEP|\d{2}\.\d{3}\.\d{3}\/\d{4}|Phone|Tel|Telefone)/i)) {
        continue;
      }
      
      // Skip very short lines or lines with only numbers
      if (line.length < 3 || /^\d+$/.test(line)) {
        continue;
      }
      
      // Skip common receipt headers
      if (line.match(/(?:NOTA|CUPOM|RECEIPT|INVOICE|BILL)/i)) {
        continue;
      }
      
      // Return the first meaningful line as store name
      return line;
    }
    
    return null;
  }

  /**
   * Advanced payment method extraction
   */
  extractPaymentMethodAdvanced(text) {
    const paymentPatterns = [
      { pattern: /(?:PAGAMENTO|FORMA DE PAGAMENTO|Payment|Payment Method)[\s:]*([^\n]+)/i, group: 1 },
      { pattern: /(?:CARTÃO|CARD|CREDIT|DEBIT|CRÉDITO|DÉBITO)/i, value: 'card' },
      { pattern: /(?:DINHEIRO|CASH|MOEDA|MONEY)/i, value: 'cash' },
      { pattern: /PIX/i, value: 'pix' },
      { pattern: /(?:BOLETO|BANK SLIP|BANKING BILLET)/i, value: 'boleto' },
      { pattern: /(?:TRANSFER|TRANSFERÊNCIA|BANK TRANSFER)/i, value: 'bank_transfer' },
      { pattern: /(?:VALE|VOUCHER|TICKET)/i, value: 'voucher' },
      { pattern: /(?:CHEQUE|CHECK)/i, value: 'check' }
    ];
    
    for (const { pattern, group, value } of paymentPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (value) {
          return value;
        } else if (group && match[group]) {
          return this.normalizePaymentMethodAdvanced(match[group]);
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * Extract individual items from receipt
   */
  extractItemsAdvanced(text) {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Look for item patterns (quantity, description, price)
      const itemPattern = /(\d+)\s+(.+?)\s+(\d+[,.]?\d*)/;
      const match = line.match(itemPattern);
      
      if (match) {
        items.push({
          quantity: parseInt(match[1]),
          description: match[2].trim(),
          price: parseFloat(match[3].replace(',', '.'))
        });
      }
    }
    
    return items;
  }

  /**
   * Extract tax information
   */
  extractTaxInfoAdvanced(text) {
    const taxInfo = {};
    
    // Look for tax patterns
    const taxPatterns = [
      { pattern: /(?:ICMS|Tax|Imposto)[\s:]*(\d+[,.]?\d*)/i, key: 'icms' },
      { pattern: /(?:IPI|Tax|Imposto)[\s:]*(\d+[,.]?\d*)/i, key: 'ipi' },
      { pattern: /(?:ISS|Tax|Imposto)[\s:]*(\d+[,.]?\d*)/i, key: 'iss' },
      { pattern: /(?:VAT|IVA|Tax)[\s:]*(\d+[,.]?\d*)/i, key: 'vat' }
    ];
    
    for (const { pattern, key } of taxPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        taxInfo[key] = parseFloat(match[1].replace(',', '.'));
      }
    }
    
    return taxInfo;
  }

  /**
   * Calculate advanced confidence score
   */
  calculateAdvancedConfidence(fields) {
    let score = 0;
    let totalFields = 0;
    
    // Score each field
    if (fields.invoiceNumber && fields.invoiceNumber !== 'UNKNOWN') {
      score += 0.2;
    }
    totalFields++;
    
    if (fields.date && !isNaN(new Date(fields.date).getTime())) {
      score += 0.2;
    }
    totalFields++;
    
    if (fields.amountResult.amount && fields.amountResult.amount > 0) {
      score += 0.3;
    }
    totalFields++;
    
    if (fields.storeName && fields.storeName !== 'Unknown Store') {
      score += 0.15;
    }
    totalFields++;
    
    if (fields.paymentMethod && fields.paymentMethod !== 'unknown') {
      score += 0.1;
    }
    totalFields++;
    
    if (fields.items && fields.items.length > 0) {
      score += 0.05;
    }
    totalFields++;
    
    return Math.min(score, 1.0);
  }

  /**
   * Parse universal date formats with time support
   */
  parseUniversalDateAdvanced(dateString, format, timeString = null) {
    try {
      let year, month, day, hours = 0, minutes = 0;
      
      switch (format) {
        case 'DD/MM/YYYY HH:mm':
          const parts1 = dateString.split('/');
          day = parseInt(parts1[0]);
          month = parseInt(parts1[1]) - 1;
          year = parseInt(parts1[2]);
          if (timeString) {
            const timeParts = timeString.split(':');
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
          }
          break;
          
        case 'DD/MM/YYYY':
          const parts2 = dateString.split('/');
          day = parseInt(parts2[0]);
          month = parseInt(parts2[1]) - 1;
          year = parseInt(parts2[2]);
          break;
          
        case 'MM/DD/YYYY':
          const parts3 = dateString.split('/');
          month = parseInt(parts3[0]) - 1;
          day = parseInt(parts3[1]);
          year = parseInt(parts3[2]);
          break;
          
        case 'YYYY-MM-DD':
          const parts4 = dateString.split('-');
          year = parseInt(parts4[0]);
          month = parseInt(parts4[1]) - 1;
          day = parseInt(parts4[2]);
          break;
          
        case 'DD-MM-YYYY':
          const parts5 = dateString.split('-');
          day = parseInt(parts5[0]);
          month = parseInt(parts5[1]) - 1;
          year = parseInt(parts5[2]);
          break;
          
        case 'DD.MM.YYYY':
          const parts6 = dateString.split('.');
          day = parseInt(parts6[0]);
          month = parseInt(parts6[1]) - 1;
          year = parseInt(parts6[2]);
          break;
          
        case 'YYYY/MM/DD':
          const parts7 = dateString.split('/');
          year = parseInt(parts7[0]);
          month = parseInt(parts7[1]) - 1;
          day = parseInt(parts7[2]);
          break;
          
        default:
          return new Date(dateString);
      }
      
      const date = new Date(year, month, day, hours, minutes);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Normalize payment method with advanced patterns
   */
  normalizePaymentMethodAdvanced(method) {
    const normalized = method.toLowerCase();
    
    if (normalized.includes('cartão') || normalized.includes('card') || normalized.includes('credit') || normalized.includes('debit')) {
      return 'card';
    } else if (normalized.includes('dinheiro') || normalized.includes('cash') || normalized.includes('money')) {
      return 'cash';
    } else if (normalized.includes('pix')) {
      return 'pix';
    } else if (normalized.includes('boleto') || normalized.includes('bank slip')) {
      return 'boleto';
    } else if (normalized.includes('transfer') || normalized.includes('transferência')) {
      return 'bank_transfer';
    } else if (normalized.includes('vale') || normalized.includes('voucher')) {
      return 'voucher';
    } else if (normalized.includes('cheque') || normalized.includes('check')) {
      return 'check';
    } else {
      return 'unknown';
    }
  }

  /**
   * Complete advanced OCR and parsing workflow
   */
  async processReceipt(filePath) {
    try {
      // Step 1: Extract text using advanced OCR
      const ocrResult = await this.extractText(filePath);
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: `Advanced OCR failed: ${ocrResult.error}`,
          extractedText: '',
          parsedData: null
        };
      }

      // Step 2: Parse receipt data using advanced parsing
      const parseResult = this.parseReceiptDataAdvanced(ocrResult.text);
      
      return {
        success: true,
        extractedText: ocrResult.text,
        parsedData: parseResult.data,
        confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
        processingTime: ocrResult.processingTime,
        technique: ocrResult.technique,
        extractionMethod: 'advanced'
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
   * Clean up resources
   */
  async cleanup() {
    for (const worker of this.workerPool) {
      await worker.terminate();
    }
    this.workerPool = [];
    this.cache.clear();
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
   * Advanced validation for extracted data
   */
  validateAdvancedExtractedData(data) {
    const errors = [];
    const warnings = [];
    
    // Check if this looks like a receipt vs other content
    const isLikelyReceipt = this.isLikelyReceiptContentAdvanced(data);
    
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
    } else if (data.amount < 0.01) {
      warnings.push('Amount seems unusually low - please verify');
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
      } else if (daysDiff > 30) {
        warnings.push('Receipt date is more than a month old');
      }
    }
    
    // Check store name
    if (!data.storeName || data.storeName === 'Unknown Store') {
      warnings.push('Store name not found - this may affect store matching');
    }
    
    // Check confidence level
    if (data.confidence < 0.3) {
      warnings.push('Low confidence in extracted data - manual verification recommended');
    } else if (data.confidence < 0.6) {
      warnings.push('Medium confidence in extracted data - review recommended');
    }
    
    // Check for items
    if (data.items && data.items.length === 0) {
      warnings.push('No individual items detected - this may be normal for some receipt types');
    }
    
    // Check currency
    if (!data.currency || data.currency === 'UNKNOWN') {
      warnings.push('Currency not detected - assuming local currency');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Advanced check if the extracted data looks like a receipt
   */
  isLikelyReceiptContentAdvanced(data) {
    // Check for receipt-like patterns with enhanced criteria
    const receiptIndicators = [
      // Has a valid amount
      data.amount && data.amount > 0,
      
      // Has a reasonable store name (not generic app terms)
      data.storeName && 
      data.storeName !== 'Unknown Store' && 
      !data.storeName.toLowerCase().includes('update') &&
      !data.storeName.toLowerCase().includes('notification') &&
      !data.storeName.toLowerCase().includes('reward') &&
      !data.storeName.toLowerCase().includes('level') &&
      !data.storeName.toLowerCase().includes('app') &&
      !data.storeName.toLowerCase().includes('system'),
      
      // Has reasonable confidence
      data.confidence > 0.2,
      
      // Currency is not unknown
      data.currency && data.currency !== 'UNKNOWN',
      
      // Has items (bonus indicator)
      data.items && data.items.length > 0,
      
      // Has payment method
      data.paymentMethod && data.paymentMethod !== 'unknown'
    ];
    
    // Count how many indicators are present
    const indicatorCount = receiptIndicators.filter(Boolean).length;
    
    // Consider it a receipt if at least 3 out of 6 indicators are present (more strict)
    return indicatorCount >= 3;
  }
}

module.exports = new AdvancedOCR();