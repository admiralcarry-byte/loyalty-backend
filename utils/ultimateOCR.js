const fs = require('fs');
const path = require('path');
const ensembleOCR = require('./ensembleOCR');
const tableDetector = require('./tableDetector');
const advancedOCR = require('./advancedOCR');
const ocrConfig = require('../config/ocrConfig');

/**
 * Ultimate OCR System
 * Combines Ensemble OCR + Table Detection + Advanced Processing
 */
class UltimateOCR {
  constructor() {
    this.ensembleOCR = ensembleOCR;
    this.tableDetector = tableDetector;
    this.advancedOCR = advancedOCR;
    this.config = ocrConfig;
    this.processingModes = {
      FAST: 'fast',           // Single engine, basic processing
      BALANCED: 'balanced',   // Ensemble OCR, no table detection
      ACCURATE: 'accurate',   // Ensemble OCR + table detection
      MAXIMUM: 'maximum'      // All features enabled
    };
  }

  /**
   * Process receipt with ultimate OCR capabilities
   */
  async processReceipt(filePath, mode = 'balanced') {
    try {
      console.log(`Starting Ultimate OCR processing in ${mode} mode...`);
      const startTime = Date.now();
      
      let result;
      
      switch (mode) {
        case this.processingModes.FAST:
          result = await this.processFast(filePath);
          break;
        case this.processingModes.BALANCED:
          result = await this.processBalanced(filePath);
          break;
        case this.processingModes.ACCURATE:
          result = await this.processAccurate(filePath);
          break;
        case this.processingModes.MAXIMUM:
          result = await this.processMaximum(filePath);
          break;
        default:
          result = await this.processBalanced(filePath);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        processingTime,
        mode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Ultimate OCR error:', error);
      return {
        success: false,
        error: error.message,
        extractedText: '',
        parsedData: null,
        mode,
        processingTime: 0
      };
    }
  }

  /**
   * Fast processing mode - single engine, basic processing
   */
  async processFast(filePath) {
    console.log('Fast mode: Using single OCR engine...');
    
    const ocrResult = await this.advancedOCR.extractTextMultiTechnique(filePath);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: `Fast OCR failed: ${ocrResult.error}`,
        extractedText: '',
        parsedData: null
      };
    }
    
    // Basic parsing without structure detection
    const parseResult = this.advancedOCR.parseReceiptDataAdvanced(ocrResult.text);
    
    return {
      success: true,
      extractedText: ocrResult.text,
      parsedData: parseResult.data,
      confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
      technique: ocrResult.technique,
      extractionMethod: 'fast'
    };
  }

  /**
   * Balanced processing mode - ensemble OCR, no table detection
   */
  async processBalanced(filePath) {
    console.log('Balanced mode: Using ensemble OCR...');
    
    const ocrResult = await this.ensembleOCR.processImage(filePath);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: `Ensemble OCR failed: ${ocrResult.error}`,
        extractedText: '',
        parsedData: null
      };
    }
    
    // Advanced parsing without structure detection
    const parseResult = this.advancedOCR.parseReceiptDataAdvanced(ocrResult.text);
    
    return {
      success: true,
      extractedText: ocrResult.text,
      parsedData: parseResult.data,
      confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
      technique: ocrResult.technique,
      extractionMethod: 'balanced',
      ensembleDetails: {
        consensus: ocrResult.consensus,
        engineResults: ocrResult.engineResults,
        votingDetails: ocrResult.votingDetails
      }
    };
  }

  /**
   * Accurate processing mode - ensemble OCR + table detection
   */
  async processAccurate(filePath) {
    console.log('Accurate mode: Using ensemble OCR + table detection...');
    
    const ocrResult = await this.ensembleOCR.processImage(filePath);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: `Ensemble OCR failed: ${ocrResult.error}`,
        extractedText: '',
        parsedData: null
      };
    }
    
    // Structure detection
    const structureResult = this.tableDetector.detectStructures(ocrResult.text);
    
    // Enhanced parsing with structure detection
    const parseResult = this.tableDetector.parseReceiptWithStructures(ocrResult.text);
    
    if (!parseResult.success) {
      // Fallback to basic parsing
      const fallbackResult = this.advancedOCR.parseReceiptDataAdvanced(ocrResult.text);
      return {
        success: true,
        extractedText: ocrResult.text,
        parsedData: fallbackResult.data,
        confidence: Math.min(ocrResult.confidence, fallbackResult.confidence || 0.8),
        technique: ocrResult.technique,
        extractionMethod: 'accurate_fallback',
        ensembleDetails: {
          consensus: ocrResult.consensus,
          engineResults: ocrResult.engineResults
        }
      };
    }
    
    return {
      success: true,
      extractedText: ocrResult.text,
      parsedData: parseResult.data,
      confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
      technique: ocrResult.technique,
      extractionMethod: 'accurate',
      ensembleDetails: {
        consensus: ocrResult.consensus,
        engineResults: ocrResult.engineResults,
        votingDetails: ocrResult.votingDetails
      },
      structureDetails: {
        structures: structureResult.structures,
        summary: structureResult.summary,
        confidence: structureResult.confidence
      }
    };
  }

  /**
   * Maximum processing mode - all features enabled
   */
  async processMaximum(filePath) {
    console.log('Maximum mode: Using all OCR features...');
    
    // Run ensemble OCR
    const ocrResult = await this.ensembleOCR.processImage(filePath);
    
    if (!ocrResult.success) {
      return {
        success: false,
        error: `Ensemble OCR failed: ${ocrResult.error}`,
        extractedText: '',
        parsedData: null
      };
    }
    
    // Structure detection
    const structureResult = this.tableDetector.detectStructures(ocrResult.text);
    
    // Enhanced parsing with structure detection
    const parseResult = this.tableDetector.parseReceiptWithStructures(ocrResult.text);
    
    if (!parseResult.success) {
      // Fallback to advanced parsing
      const fallbackResult = this.advancedOCR.parseReceiptDataAdvanced(ocrResult.text);
      return {
        success: true,
        extractedText: ocrResult.text,
        parsedData: fallbackResult.data,
        confidence: Math.min(ocrResult.confidence, fallbackResult.confidence || 0.8),
        technique: ocrResult.technique,
        extractionMethod: 'maximum_fallback',
        ensembleDetails: {
          consensus: ocrResult.consensus,
          engineResults: ocrResult.engineResults
        }
      };
    }
    
    // Enhanced data with all features
    const enhancedData = this.enhanceDataWithAllFeatures(parseResult.data, structureResult);
    
    return {
      success: true,
      extractedText: ocrResult.text,
      parsedData: enhancedData,
      confidence: Math.min(ocrResult.confidence, parseResult.confidence || 0.8),
      technique: ocrResult.technique,
      extractionMethod: 'maximum',
      ensembleDetails: {
        consensus: ocrResult.consensus,
        engineResults: ocrResult.engineResults,
        votingDetails: ocrResult.votingDetails
      },
      structureDetails: {
        structures: structureResult.structures,
        summary: structureResult.summary,
        confidence: structureResult.confidence
      },
      processingDetails: {
        enginesUsed: ocrResult.engineResults.length,
        structuresDetected: Object.keys(structureResult.structures).length,
        totalStructures: structureResult.summary.totalStructures
      }
    };
  }

  /**
   * Enhance data with all available features
   */
  enhanceDataWithAllFeatures(basicData, structureResult) {
    const enhanced = { ...basicData };
    
    // Add structured items if detected
    if (structureResult.structures.items && structureResult.structures.items.length > 0) {
      enhanced.items = structureResult.structures.items.map(item => ({
        quantity: item.quantity,
        description: item.description,
        price: item.price,
        currency: item.currency,
        confidence: item.confidence,
        source: 'structure_detection'
      }));
    }
    
    // Add table data if detected
    if (structureResult.structures.tables && structureResult.structures.tables.length > 0) {
      enhanced.tables = structureResult.structures.tables.map(table => ({
        type: table.type,
        rows: table.rows.length,
        columns: table.columnCount,
        confidence: table.confidence,
        data: table.rows.map(row => ({
          content: row.content,
          fields: row.fields
        }))
      }));
    }
    
    // Add price breakdown if detected
    if (structureResult.structures.prices && structureResult.structures.prices.length > 0) {
      enhanced.priceBreakdown = structureResult.structures.prices.map(price => ({
        description: price.description,
        amount: price.amount,
        currency: price.currency,
        confidence: price.confidence
      }));
    }
    
    // Update confidence based on structure detection
    enhanced.confidence = Math.min(
      enhanced.confidence + (structureResult.confidence * 0.1),
      0.95
    );
    
    // Add structure metadata
    enhanced.structureMetadata = {
      hasTables: structureResult.structures.tables.length > 0,
      hasItems: structureResult.structures.items.length > 0,
      hasPrices: structureResult.structures.prices.length > 0,
      totalStructures: structureResult.summary.totalStructures,
      structureConfidence: structureResult.confidence
    };
    
    return enhanced;
  }

  /**
   * Get processing mode recommendations based on file characteristics
   */
  getRecommendedMode(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Large files or PDFs benefit from faster processing
      if (stats.size > 10 * 1024 * 1024 || ext === '.pdf') {
        return this.processingModes.FAST;
      }
      
      // High-resolution images benefit from maximum processing
      if (stats.size > 5 * 1024 * 1024) {
        return this.processingModes.MAXIMUM;
      }
      
      // Default to balanced for most cases
      return this.processingModes.BALANCED;
    } catch (error) {
      return this.processingModes.BALANCED;
    }
  }

  /**
   * Get system status and capabilities
   */
  getSystemStatus() {
    return {
      engines: this.ensembleOCR.getEngineStatus(),
      processingModes: Object.values(this.processingModes),
      capabilities: {
        ensembleOCR: true,
        tableDetection: true,
        structureAnalysis: true,
        multiLanguage: true,
        caching: true,
        parallelProcessing: true
      },
      performance: {
        maxWorkers: this.config.performance.maxWorkers,
        cacheEnabled: this.config.performance.cache.enabled,
        supportedFormats: this.config.files.supportedFormats,
        maxFileSize: this.config.files.maxFileSize
      }
    };
  }

  /**
   * Validate file for processing
   */
  validateFile(filePath) {
    return this.advancedOCR.validateFile(filePath);
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats() {
    return this.config.files.supportedFormats;
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize() {
    return this.config.files.maxFileSize;
  }
}

module.exports = new UltimateOCR();