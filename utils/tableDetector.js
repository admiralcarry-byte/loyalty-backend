const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Table and Structured Data Detection System
 * Detects tables, lists, and structured data in receipt images
 */
class TableDetector {
  constructor() {
    this.tablePatterns = [
      // Table row patterns
      /^[\s]*[\d\w]+[\s]+[\d\w\s]+[\s]+[\d,\.]+[\s]*$/,
      /^[\s]*[\d]+[\s]+[^0-9]+[\s]+[\d,\.]+[\s]*$/,
      
      // List patterns
      /^[\s]*[\d]+[\s]*[\.\)][\s]+[^0-9]+[\s]*$/,
      /^[\s]*[\-\*][\s]+[^0-9]+[\s]*$/,
      
      // Price patterns
      /^[\s]*[^0-9]+[\s]+[\d,\.]+[\s]*$/,
      /^[\s]*[\d,\.]+[\s]*$/,
      
      // Item patterns
      /^[\s]*[\d]+[\s]+[^0-9]+[\s]+[\d,\.]+[\s]*$/,
      /^[\s]*[^0-9]+[\s]+[\d]+[\s]+[\d,\.]+[\s]*$/
    ];
    
    this.structureTypes = {
      TABLE: 'table',
      LIST: 'list',
      ITEMS: 'items',
      PRICES: 'prices',
      MIXED: 'mixed'
    };
  }

  /**
   * Detect tables and structured data in text
   */
  detectStructures(extractedText) {
    try {
      const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      const structures = {
        tables: [],
        lists: [],
        items: [],
        prices: [],
        mixed: []
      };
      
      // Analyze each line for structure patterns
      const analyzedLines = lines.map((line, index) => {
        const analysis = this.analyzeLine(line, index);
        return { line, index, ...analysis };
      });
      
      // Group lines by structure type
      const groupedStructures = this.groupStructures(analyzedLines);
      
      // Extract structured data
      structures.tables = this.extractTables(groupedStructures.tableLines);
      structures.lists = this.extractLists(groupedStructures.listLines);
      structures.items = this.extractItems(groupedStructures.itemLines);
      structures.prices = this.extractPrices(groupedStructures.priceLines);
      structures.mixed = this.extractMixed(groupedStructures.mixedLines);
      
      return {
        success: true,
        structures,
        summary: this.generateStructureSummary(structures),
        confidence: this.calculateStructureConfidence(structures)
      };
    } catch (error) {
      console.error('Structure detection error:', error);
      return {
        success: false,
        error: error.message,
        structures: null
      };
    }
  }

  /**
   * Analyze individual line for structure patterns
   */
  analyzeLine(line, index) {
    const analysis = {
      type: 'unknown',
      confidence: 0,
      patterns: [],
      fields: {}
    };
    
    // Test against table patterns
    for (let i = 0; i < this.tablePatterns.length; i++) {
      const pattern = this.tablePatterns[i];
      if (pattern.test(line)) {
        analysis.patterns.push(`table_${i}`);
        analysis.confidence += 0.2;
      }
    }
    
    // Detect specific field types
    analysis.fields = this.detectFields(line);
    
    // Determine structure type
    if (analysis.fields.quantity && analysis.fields.description && analysis.fields.price) {
      analysis.type = 'item';
      analysis.confidence += 0.4;
    } else if (analysis.fields.price && analysis.fields.description) {
      analysis.type = 'price';
      analysis.confidence += 0.3;
    } else if (analysis.fields.quantity && analysis.fields.description) {
      analysis.type = 'list';
      analysis.confidence += 0.2;
    } else if (analysis.patterns.length > 0) {
      analysis.type = 'table';
      analysis.confidence += 0.1;
    }
    
    return analysis;
  }

  /**
   * Detect fields in a line
   */
  detectFields(line) {
    const fields = {};
    
    // Detect quantity (numbers at start)
    const quantityMatch = line.match(/^[\s]*(\d+)[\s]+/);
    if (quantityMatch) {
      fields.quantity = parseInt(quantityMatch[1]);
    }
    
    // Detect price (numbers with decimal/comma at end)
    const priceMatch = line.match(/[\s]+([\d,\.]+)[\s]*$/);
    if (priceMatch) {
      fields.price = parseFloat(priceMatch[1].replace(',', '.'));
    }
    
    // Detect description (middle text)
    const descriptionMatch = line.match(/^[\s]*[\d]*[\s]+([^0-9,\.]+)[\s]+[\d,\.]*[\s]*$/);
    if (descriptionMatch) {
      fields.description = descriptionMatch[1].trim();
    }
    
    // Detect currency symbols
    const currencyMatch = line.match(/[R\$€£¥]/);
    if (currencyMatch) {
      fields.currency = currencyMatch[0];
    }
    
    return fields;
  }

  /**
   * Group lines by structure type
   */
  groupStructures(analyzedLines) {
    const groups = {
      tableLines: [],
      listLines: [],
      itemLines: [],
      priceLines: [],
      mixedLines: []
    };
    
    analyzedLines.forEach(analyzedLine => {
      switch (analyzedLine.type) {
        case 'table':
          groups.tableLines.push(analyzedLine);
          break;
        case 'list':
          groups.listLines.push(analyzedLine);
          break;
        case 'item':
          groups.itemLines.push(analyzedLine);
          break;
        case 'price':
          groups.priceLines.push(analyzedLine);
          break;
        default:
          groups.mixedLines.push(analyzedLine);
      }
    });
    
    return groups;
  }

  /**
   * Extract table data
   */
  extractTables(tableLines) {
    if (tableLines.length === 0) return [];
    
    const tables = [];
    let currentTable = [];
    
    tableLines.forEach(line => {
      if (this.isTableRow(line.line)) {
        currentTable.push({
          row: line.index,
          content: line.line,
          fields: line.fields
        });
      } else {
        if (currentTable.length > 0) {
          tables.push({
            type: 'table',
            rows: currentTable,
            columnCount: this.detectColumnCount(currentTable),
            confidence: this.calculateTableConfidence(currentTable)
          });
          currentTable = [];
        }
      }
    });
    
    // Add final table if exists
    if (currentTable.length > 0) {
      tables.push({
        type: 'table',
        rows: currentTable,
        columnCount: this.detectColumnCount(currentTable),
        confidence: this.calculateTableConfidence(currentTable)
      });
    }
    
    return tables;
  }

  /**
   * Extract list data
   */
  extractLists(listLines) {
    return listLines.map(line => ({
      type: 'list_item',
      row: line.index,
      content: line.line,
      fields: line.fields,
      confidence: line.confidence
    }));
  }

  /**
   * Extract item data
   */
  extractItems(itemLines) {
    return itemLines.map(line => ({
      type: 'item',
      row: line.index,
      quantity: line.fields.quantity || 1,
      description: line.fields.description || line.line,
      price: line.fields.price || 0,
      currency: line.fields.currency || 'AOA',
      confidence: line.confidence
    }));
  }

  /**
   * Extract price data
   */
  extractPrices(priceLines) {
    return priceLines.map(line => ({
      type: 'price',
      row: line.index,
      description: line.fields.description || line.line,
      amount: line.fields.price || 0,
      currency: line.fields.currency || 'AOA',
      confidence: line.confidence
    }));
  }

  /**
   * Extract mixed structure data
   */
  extractMixed(mixedLines) {
    return mixedLines.map(line => ({
      type: 'mixed',
      row: line.index,
      content: line.line,
      fields: line.fields,
      confidence: line.confidence
    }));
  }

  /**
   * Check if line is a table row
   */
  isTableRow(line) {
    // Check for multiple columns separated by spaces
    const parts = line.split(/\s+/);
    return parts.length >= 3 && parts.some(part => /^\d+$/.test(part)) && parts.some(part => /^[\d,\.]+$/.test(part));
  }

  /**
   * Detect column count in table
   */
  detectColumnCount(tableRows) {
    if (tableRows.length === 0) return 0;
    
    const columnCounts = tableRows.map(row => {
      const parts = row.content.split(/\s+/);
      return parts.length;
    });
    
    // Return most common column count
    const counts = {};
    columnCounts.forEach(count => {
      counts[count] = (counts[count] || 0) + 1;
    });
    
    return parseInt(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
  }

  /**
   * Calculate table confidence
   */
  calculateTableConfidence(tableRows) {
    if (tableRows.length === 0) return 0;
    
    const avgConfidence = tableRows.reduce((sum, row) => sum + (row.fields ? 0.8 : 0.3), 0) / tableRows.length;
    const consistencyBonus = tableRows.length > 2 ? 0.1 : 0;
    
    return Math.min(avgConfidence + consistencyBonus, 1.0);
  }

  /**
   * Generate structure summary
   */
  generateStructureSummary(structures) {
    const summary = {
      totalStructures: 0,
      structureTypes: {},
      itemCount: 0,
      totalValue: 0,
        currency: 'AOA'
    };
    
    // Count structures by type
    Object.keys(structures).forEach(type => {
      if (Array.isArray(structures[type])) {
        summary.structureTypes[type] = structures[type].length;
        summary.totalStructures += structures[type].length;
        
        // Calculate totals for items
        if (type === 'items') {
          structures[type].forEach(item => {
            summary.itemCount += item.quantity || 1;
            summary.totalValue += (item.price || 0) * (item.quantity || 1);
            if (item.currency) summary.currency = item.currency;
          });
        }
      }
    });
    
    return summary;
  }

  /**
   * Calculate overall structure confidence
   */
  calculateStructureConfidence(structures) {
    let totalConfidence = 0;
    let totalStructures = 0;
    
    Object.keys(structures).forEach(type => {
      if (Array.isArray(structures[type])) {
        structures[type].forEach(structure => {
          if (structure.confidence !== undefined) {
            totalConfidence += structure.confidence;
            totalStructures++;
          }
        });
      }
    });
    
    return totalStructures > 0 ? totalConfidence / totalStructures : 0;
  }

  /**
   * Enhanced receipt parsing with structure detection
   */
  parseReceiptWithStructures(extractedText) {
    try {
      // First, detect structures
      const structureResult = this.detectStructures(extractedText);
      
      if (!structureResult.success) {
        return {
          success: false,
          error: structureResult.error,
          data: null
        };
      }
      
      // Extract basic receipt data
      const basicData = this.extractBasicReceiptData(extractedText);
      
      // Combine with structured data
      const enhancedData = {
        ...basicData,
        structures: structureResult.structures,
        structureSummary: structureResult.summary,
        structureConfidence: structureResult.confidence,
        extractionMethod: 'structured'
      };
      
      return {
        success: true,
        data: enhancedData,
        confidence: Math.min(basicData.confidence + structureResult.confidence * 0.2, 1.0)
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
   * Extract basic receipt data (fallback)
   */
  extractBasicReceiptData(text) {
    // Simple extraction for non-structured receipts
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract amount
    const amountMatch = text.match(/R\$\s*(\d+[,.]?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
    
    // Extract date
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();
    
    // Extract store name (first meaningful line)
    const storeName = lines.find(line => 
      line.length > 3 && 
      !line.match(/^\d+$/) && 
      !line.match(/R\$\s*\d+/) &&
      !line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
    ) || 'Unknown Store';
    
    return {
      invoiceNumber: 'UNKNOWN',
      storeName,
      amount,
        currency: 'AOA',
      date,
      paymentMethod: 'unknown',
      items: [],
      taxInfo: {},
      confidence: 0.5
    };
  }
}

module.exports = new TableDetector();