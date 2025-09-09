const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const tesseractOCR = require('node-tesseract-ocr');
const sharp = require('sharp');
const advancedOCR = require('./advancedOCR');

/**
 * Ensemble OCR System
 * Combines multiple OCR engines for maximum accuracy
 */
class EnsembleOCR {
  constructor() {
    this.engines = [
      { name: 'tesseract-js', weight: 0.4, enabled: true },
      { name: 'node-tesseract', weight: 0.3, enabled: true },
      { name: 'advanced-ocr', weight: 0.3, enabled: true }
    ];
    this.results = [];
    this.votingThreshold = 0.6; // Minimum agreement for consensus
  }

  /**
   * Process image with ensemble OCR
   */
  async processImage(filePath) {
    try {
      console.log('Starting ensemble OCR processing...');
      const startTime = Date.now();
      
      // Run all enabled OCR engines in parallel
      const promises = this.engines
        .filter(engine => engine.enabled)
        .map(engine => this.runEngine(engine, filePath));
      
      const results = await Promise.allSettled(promises);
      
      // Process results - include failed engines with empty results
      this.results = results
        .map((result, index) => ({
          engine: this.engines.filter(e => e.enabled)[index],
          result: result.status === 'fulfilled' ? result.value : {
            text: '',
            confidence: 0,
            engine: this.engines.filter(e => e.enabled)[index].name,
            error: result.reason?.message || 'Engine failed'
          },
          error: result.status === 'rejected' ? result.reason : null
        }));
      
      // Combine results using ensemble voting
      const ensembleResult = this.combineResults();
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        text: ensembleResult.text,
        confidence: ensembleResult.confidence,
        technique: 'ensemble',
        processingTime,
        engineResults: this.results.map(r => ({
          engine: r.engine.name,
          confidence: r.result.confidence,
          textLength: r.result.text.length
        })),
        consensus: ensembleResult.consensus,
        votingDetails: ensembleResult.votingDetails
      };
    } catch (error) {
      console.error('Ensemble OCR error:', error);
      return {
        success: false,
        error: error.message,
        text: '',
        confidence: 0
      };
    }
  }

  /**
   * Run individual OCR engine
   */
  async runEngine(engine, filePath) {
    try {
      switch (engine.name) {
        case 'tesseract-js':
          return await this.runTesseractJS(filePath);
        case 'node-tesseract':
          return await this.runNodeTesseract(filePath);
        case 'advanced-ocr':
          return await this.runAdvancedOCR(filePath);
        default:
          throw new Error(`Unknown engine: ${engine.name}`);
      }
    } catch (error) {
      console.error(`Engine ${engine.name} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run Tesseract.js engine
   */
  async runTesseractJS(filePath) {
    const { data: { text, confidence } } = await Tesseract.recognize(
      filePath,
      'eng+por+spa+fra+deu+ita+jpn+chi_sim+chi_tra+ara+rus',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract.js Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    return {
      text: text.trim(),
      confidence: confidence / 100,
      engine: 'tesseract-js'
    };
  }

  /**
   * Run node-tesseract-ocr engine
   */
  async runNodeTesseract(filePath) {
    try {
      const config = {
        lang: 'eng+por+spa+fra+deu+ita+jpn+chi_sim+chi_tra+ara+rus',
        oem: 3,
        psm: 6,
        preserve_interword_spaces: 1
      };
      
      const text = await tesseractOCR.recognize(filePath, config);
      
      return {
        text: text.trim(),
        confidence: 0.7, // node-tesseract-ocr doesn't provide confidence
        engine: 'node-tesseract'
      };
    } catch (error) {
      console.error('Engine node-tesseract failed:', error.message);
      // Return empty result instead of throwing to allow other engines to work
      return {
        text: '',
        confidence: 0,
        engine: 'node-tesseract',
        error: error.message
      };
    }
  }

  /**
   * Run Advanced OCR engine
   */
  async runAdvancedOCR(filePath) {
    const result = await advancedOCR.extractTextMultiTechnique(filePath);
    
    return {
      text: result.text,
      confidence: result.confidence,
      engine: 'advanced-ocr',
      technique: result.technique
    };
  }

  /**
   * Combine results using ensemble voting
   */
  combineResults() {
    if (this.results.length === 0) {
      return {
        text: '',
        confidence: 0,
        consensus: 0,
        votingDetails: {
          method: 'no_results',
          agreement: 0
        }
      };
    }

    // Filter out failed results
    const validResults = this.results.filter(item => 
      item.result && 
      item.result.text && 
      item.result.text.trim().length > 0 &&
      !item.result.error
    );

    if (validResults.length === 0) {
      return {
        text: '',
        confidence: 0,
        consensus: 0,
        votingDetails: {
          method: 'all_failed',
          agreement: 0
        }
      };
    }

    if (validResults.length === 1) {
      return {
        text: validResults[0].result.text,
        confidence: validResults[0].result.confidence,
        consensus: 1.0,
        votingDetails: {
          method: 'single_result',
          agreement: 1.0
        }
      };
    }

    // Calculate weighted average confidence
    const weightedConfidence = validResults.reduce((sum, item) => {
      return sum + ((item.result.confidence || 0) * item.engine.weight);
    }, 0);

    // Text similarity voting
    const textSimilarity = this.calculateTextSimilarity();
    
    // Length-based voting (longer text usually better)
    const lengthVoting = this.calculateLengthVoting();
    
    // Confidence-based voting
    const confidenceVoting = this.calculateConfidenceVoting();
    
    // Final voting score
    const finalScore = (textSimilarity * 0.4) + (lengthVoting * 0.3) + (confidenceVoting * 0.3);
    
    // Select best result based on voting
    const bestResult = this.selectBestResultByVoting();
    
    return {
      text: bestResult.text,
      confidence: Math.min(weightedConfidence, 0.95), // Cap at 95%
      consensus: finalScore,
      votingDetails: {
        method: 'ensemble_voting',
        textSimilarity,
        lengthVoting,
        confidenceVoting,
        finalScore,
        agreement: finalScore
      }
    };
  }

  /**
   * Calculate text similarity between results
   */
  calculateTextSimilarity() {
    const validResults = this.results.filter(item => 
      item.result && 
      item.result.text && 
      item.result.text.trim().length > 0 &&
      !item.result.error
    );
    
    if (validResults.length < 2) return 1.0;
    
    const texts = validResults.map(r => r.result.text.toLowerCase());
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = this.calculateStringSimilarity(texts[i], texts[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Calculate string similarity using Jaccard index
   */
  calculateStringSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate length-based voting
   */
  calculateLengthVoting() {
    const validResults = this.results.filter(item => 
      item.result && 
      item.result.text && 
      item.result.text.trim().length > 0 &&
      !item.result.error
    );
    
    if (validResults.length === 0) return 0;
    
    const lengths = validResults.map(r => r.result.text.length);
    const maxLength = Math.max(...lengths);
    const minLength = Math.min(...lengths);
    
    if (maxLength === minLength) return 1.0;
    
    // Prefer longer text (more content extracted)
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    return Math.min(avgLength / maxLength, 1.0);
  }

  /**
   * Calculate confidence-based voting
   */
  calculateConfidenceVoting() {
    const validResults = this.results.filter(item => 
      item.result && 
      item.result.text && 
      item.result.text.trim().length > 0 &&
      !item.result.error
    );
    
    if (validResults.length === 0) return 0;
    
    const confidences = validResults.map(r => r.result.confidence || 0);
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return avgConfidence;
  }

  /**
   * Select best result based on voting criteria
   */
  selectBestResultByVoting() {
    // Filter out results with no text or failed engines
    const validResults = this.results.filter(item => 
      item.result && 
      item.result.text && 
      item.result.text.trim().length > 0 &&
      !item.result.error
    );
    
    // If no valid results, return empty result
    if (validResults.length === 0) {
      return {
        text: '',
        confidence: 0,
        engine: 'none'
      };
    }
    
    // Score each valid result
    const scoredResults = validResults.map(item => {
      const result = item.result;
      const text = result.text.toLowerCase();
      
      // Length score (prefer longer text)
      const lengthScore = Math.min(result.text.length / 1000, 0.3);
      
      // Confidence score
      const confidenceScore = (result.confidence || 0) * 0.4;
      
      // Content quality score (receipt keywords)
      const keywordScore = this.calculateKeywordScore(text) * 0.3;
      
      const totalScore = lengthScore + confidenceScore + keywordScore;
      
      return {
        ...item,
        score: totalScore
      };
    });
    
    // Return result with highest score
    return scoredResults.reduce((best, current) => 
      current.score > best.score ? current.result : best.result
    );
  }

  /**
   * Calculate keyword score for receipt content
   */
  calculateKeywordScore(text) {
    const receiptKeywords = [
      'total', 'amount', 'price', 'invoice', 'receipt', 'bill',
      'total', 'valor', 'preço', 'nota', 'cupom', 'fatura',
      'date', 'data', 'time', 'hora', 'store', 'loja',
      'payment', 'pagamento', 'card', 'cartão', 'cash', 'dinheiro',
      'item', 'produto', 'quantity', 'quantidade', 'subtotal'
    ];

    const keywordCount = receiptKeywords.filter(keyword => 
      text.includes(keyword)
    ).length;

    return Math.min(keywordCount / receiptKeywords.length, 1.0);
  }

  /**
   * Get engine status
   */
  getEngineStatus() {
    return this.engines.map(engine => ({
      name: engine.name,
      enabled: engine.enabled,
      weight: engine.weight
    }));
  }

  /**
   * Enable/disable specific engine
   */
  setEngineStatus(engineName, enabled) {
    const engine = this.engines.find(e => e.name === engineName);
    if (engine) {
      engine.enabled = enabled;
    }
  }

  /**
   * Set engine weights
   */
  setEngineWeights(weights) {
    Object.keys(weights).forEach(engineName => {
      const engine = this.engines.find(e => e.name === engineName);
      if (engine) {
        engine.weight = weights[engineName];
      }
    });
  }
}

module.exports = new EnsembleOCR();