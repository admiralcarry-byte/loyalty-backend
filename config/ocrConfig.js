/**
 * Advanced OCR Configuration
 * High-performance OCR settings for maximum accuracy
 */

module.exports = {
  // Tesseract.js Configuration
  tesseract: {
    // Language packs for maximum coverage
    languages: 'eng+por+spa+fra+deu+ita+jpn+chi_sim+chi_tra+ara+rus',
    
    // OCR Engine Mode (0-3, higher = more accurate but slower)
    oem: 3, // Default OCR Engine Mode
    
    // Page Segmentation Mode (0-13, higher = more complex analysis)
    psm: 6, // Uniform block of text
    
    // Advanced options for better accuracy
    options: {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:;!?@#$%&*()_+-=[]{}|\\/"\'<>~`',
      tessedit_pageseg_mode: '6',
      tessedit_ocr_engine_mode: '3',
      preserve_interword_spaces: '1',
      textord_min_linesize: '2.0',
      textord_old_baselines: '0',
      textord_old_xheight: '0',
      textord_min_xheight: '10',
      textord_force_make_prop_words: 'F',
      textord_old_metrics: '0',
      textord_old_baselines: '0',
      textord_old_xheight: '0',
      textord_min_xheight: '10',
      textord_force_make_prop_words: 'F',
      textord_old_metrics: '0'
    }
  },

  // Image Preprocessing Configuration
  preprocessing: {
    // Enable multiple preprocessing techniques
    enabled: true,
    
    // Techniques to use
    techniques: [
      'standard',    // Basic grayscale + normalize + sharpen
      'contrast',    // High contrast enhancement
      'denoised',    // Noise reduction + edge enhancement
      'upscaled'     // Upscaling for small text
    ],
    
    // Sharp image processing settings
    sharp: {
      // Standard preprocessing
      standard: {
        greyscale: true,
        normalize: true,
        sharpen: true,
        format: 'png'
      },
      
      // High contrast preprocessing
      contrast: {
        greyscale: true,
        normalize: { lower: 10, upper: 240 },
        linear: { multiplier: 1.2, offset: -(128 * 0.2) },
        sharpen: { sigma: 1.5, m1: 0.5, m2: 2.0 },
        format: 'png'
      },
      
      // Denoised preprocessing
      denoised: {
        greyscale: true,
        normalize: true,
        convolve: {
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1]
        },
        format: 'png'
      },
      
      // Upscaled preprocessing
      upscaled: {
        greyscale: true,
        resize: { kernel: 'lanczos3' },
        normalize: true,
        sharpen: true,
        format: 'png'
      }
    }
  },

  // Performance Configuration
  performance: {
    // Worker pool settings
    maxWorkers: 4,
    
    // Caching settings
    cache: {
      enabled: true,
      maxSize: 100, // Maximum cached results
      ttl: 3600000  // 1 hour TTL
    },
    
    // Timeout settings
    timeouts: {
      ocr: 300000,    // 5 minutes for OCR
      preprocessing: 60000, // 1 minute for preprocessing
      total: 600000   // 10 minutes total
    }
  },

  // File Configuration
  files: {
    // Supported formats
    supportedFormats: ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp', '.webp'],
    
    // File size limits
    maxFileSize: 50 * 1024 * 1024, // 50MB
    
    // Quality settings
    minImageSize: { width: 100, height: 100 },
    maxImageSize: { width: 8000, height: 8000 }
  },

  // Receipt Parsing Configuration
  parsing: {
    // Confidence thresholds
    confidence: {
      minimum: 0.1,
      warning: 0.3,
      good: 0.6,
      excellent: 0.8
    },
    
    // Field extraction patterns
    patterns: {
      // Invoice number patterns
      invoiceNumber: [
        /(?:NOTA|CUPOM|NF|NFCe|Nº|Numero|Number)[\s:]*(\d+)/i,
        /(?:Invoice|Bill|Receipt)[\s#:]*(\d+)/i,
        /(?:Número|Número da Nota)[\s:]*(\d+)/i,
        /#(\d{6,})/i,
        /(\d{8,})/,
        /(?:Doc|Document|Documento)[\s:]*(\d+)/i,
        /(?:Ref|Reference|Referência)[\s:]*(\d+)/i,
        /(?:ID|Identificador)[\s:]*(\d+)/i,
        /(?:Trans|Transaction|Transação)[\s:]*(\d+)/i,
        /(?:NOTA|CUPOM|NF)[\s:]*([A-Z0-9]{6,})/i,
        /(?:Invoice|Bill)[\s:]*([A-Z0-9]{6,})/i
      ],
      
      // Date patterns
      date: [
        { pattern: /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2})/i, format: 'DD/MM/YYYY HH:mm' },
        { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2})/, format: 'DD/MM/YYYY HH:mm' },
        { pattern: /(?:Data|Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i, format: 'DD/MM/YYYY' },
        { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})/, format: 'DD/MM/YYYY' },
        { pattern: /(?:Date)[\s:]*(\d{1,2}\/\d{1,2}\/\d{4})/i, format: 'MM/DD/YYYY' },
        { pattern: /(\d{4}-\d{1,2}-\d{1,2})/, format: 'YYYY-MM-DD' },
        { pattern: /(\d{1,2}-\d{1,2}-\d{2,4})/, format: 'DD-MM-YYYY' },
        { pattern: /(\d{1,2}\.\d{1,2}\.\d{2,4})/, format: 'DD.MM.YYYY' },
        { pattern: /(\d{4}\/\d{1,2}\/\d{1,2})/, format: 'YYYY/MM/DD' }
      ],
      
      // Amount patterns
      amount: [
        { pattern: /(?:TOTAL|TOTAL FINAL|VALOR TOTAL|Total|Valor)[\s:]*R\$\s*(\d+[,.]?\d*)/i, currency: 'BRL' },
        { pattern: /R\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|FINAL|Total)/i, currency: 'BRL' },
        { pattern: /R\$\s*(\d{1,3}(?:[,.]?\d{3})*[,.]?\d{2})/, currency: 'BRL' },
        { pattern: /(?:Real|BRL)[\s:]*(\d+[,.]?\d*)/i, currency: 'BRL' },
        { pattern: /(?:TOTAL|Total|Amount|Sum)[\s:]*\$\s*(\d+[,.]?\d*)/i, currency: 'USD' },
        { pattern: /\$\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total|Amount)/i, currency: 'USD' },
        { pattern: /USD\s*(\d+[,.]?\d*)/i, currency: 'USD' },
        { pattern: /(?:Dollar|Dollars)[\s:]*(\d+[,.]?\d*)/i, currency: 'USD' },
        { pattern: /(?:TOTAL|Total|Amount)[\s:]*€\s*(\d+[,.]?\d*)/i, currency: 'EUR' },
        { pattern: /€\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'EUR' },
        { pattern: /EUR\s*(\d+[,.]?\d*)/i, currency: 'EUR' },
        { pattern: /(?:TOTAL|Total|Amount)[\s:]*£\s*(\d+[,.]?\d*)/i, currency: 'GBP' },
        { pattern: /£\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'GBP' },
        { pattern: /GBP\s*(\d+[,.]?\d*)/i, currency: 'GBP' },
        { pattern: /(?:TOTAL|Total|Amount)[\s:]*¥\s*(\d+[,.]?\d*)/i, currency: 'JPY' },
        { pattern: /¥\s*(\d+[,.]?\d*)\s*(?:TOTAL|Total)/i, currency: 'JPY' },
        { pattern: /JPY\s*(\d+[,.]?\d*)/i, currency: 'JPY' },
        { pattern: /(?:Total|Amount|Sum)[\s:]*(\d+[,.]?\d*)/i, currency: 'UNKNOWN' },
        { pattern: /(\d+[,.]?\d*)\s*(?:TOTAL|Total|Amount)/i, currency: 'UNKNOWN' }
      ],
      
      // Payment method patterns
      paymentMethod: [
        { pattern: /(?:PAGAMENTO|FORMA DE PAGAMENTO|Payment|Payment Method)[\s:]*([^\n]+)/i, group: 1 },
        { pattern: /(?:CARTÃO|CARD|CREDIT|DEBIT|CRÉDITO|DÉBITO)/i, value: 'card' },
        { pattern: /(?:DINHEIRO|CASH|MOEDA|MONEY)/i, value: 'cash' },
        { pattern: /PIX/i, value: 'pix' },
        { pattern: /(?:BOLETO|BANK SLIP|BANKING BILLET)/i, value: 'boleto' },
        { pattern: /(?:TRANSFER|TRANSFERÊNCIA|BANK TRANSFER)/i, value: 'bank_transfer' },
        { pattern: /(?:VALE|VOUCHER|TICKET)/i, value: 'voucher' },
        { pattern: /(?:CHEQUE|CHECK)/i, value: 'check' }
      ]
    }
  },

  // Validation Configuration
  validation: {
    // Receipt validation criteria
    receiptIndicators: [
      'amount',      // Has valid amount
      'storeName',   // Has reasonable store name
      'confidence',  // Has reasonable confidence
      'currency',    // Currency is not unknown
      'items',       // Has items (bonus)
      'paymentMethod' // Has payment method
    ],
    
    // Minimum indicators required for valid receipt
    minIndicators: 3,
    
    // Amount validation
    amount: {
      min: 0.01,
      max: 10000,
      warningHigh: 1000,
      warningLow: 1.00
    },
    
    // Date validation
    date: {
      maxAgeDays: 365,
      warningAgeDays: 30
    }
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: 'info', // debug, info, warn, error
    logOCRProgress: true,
    logProcessingTime: true,
    logConfidence: true
  }
};