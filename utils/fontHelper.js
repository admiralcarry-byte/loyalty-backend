const fs = require('fs');
const path = require('path');

/**
 * Font Helper Utility
 * Detects available fonts and provides fallbacks for Railway deployment
 */
class FontHelper {
  constructor() {
    this.availableFonts = [];
    this.fontPaths = [
      '/usr/share/fonts',
      '/usr/share/fonts/truetype',
      '/usr/share/fonts/opentype',
      '/usr/share/fonts/Type1',
      '/usr/share/fonts/OTF',
      '/usr/share/fonts/TTF'
    ];
  }

  /**
   * Detect available fonts in the system
   */
  async detectAvailableFonts() {
    try {
      const fonts = new Set();
      
      for (const fontPath of this.fontPaths) {
        if (fs.existsSync(fontPath)) {
          const fontFiles = this.findFontFiles(fontPath);
          fontFiles.forEach(font => fonts.add(font));
        }
      }
      
      this.availableFonts = Array.from(fonts);
      console.log('Available fonts:', this.availableFonts);
      
      return this.availableFonts;
    } catch (error) {
      console.error('Font detection error:', error);
      return [];
    }
  }

  /**
   * Find font files recursively
   */
  findFontFiles(dir, fonts = []) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.findFontFiles(filePath, fonts);
        } else if (this.isFontFile(file)) {
          const fontName = this.extractFontName(file);
          if (fontName) {
            fonts.push(fontName);
          }
        }
      }
      
      return fonts;
    } catch (error) {
      console.error('Error scanning font directory:', error);
      return fonts;
    }
  }

  /**
   * Check if file is a font file
   */
  isFontFile(filename) {
    const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot'];
    const ext = path.extname(filename).toLowerCase();
    return fontExtensions.includes(ext);
  }

  /**
   * Extract font name from filename
   */
  extractFontName(filename) {
    const name = path.basename(filename, path.extname(filename));
    
    // Clean up font name
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * Get best available font for text rendering
   */
  getBestFont(preferredFonts = []) {
    const defaultFonts = [
      'DejaVu Sans',
      'Liberation Sans',
      'Open Sans',
      'Noto Sans',
      'Arial',
      'Helvetica',
      'sans-serif'
    ];
    
    const fontsToTry = [...preferredFonts, ...defaultFonts];
    
    for (const font of fontsToTry) {
      if (this.availableFonts.some(available => 
        available.toLowerCase().includes(font.toLowerCase())
      )) {
        return font;
      }
    }
    
    return 'sans-serif'; // Ultimate fallback
  }

  /**
   * Generate font CSS string
   */
  generateFontCSS(weight = 'normal', size = '16px', preferredFonts = []) {
    const bestFont = this.getBestFont(preferredFonts);
    return `${weight} ${size} "${bestFont}", sans-serif`;
  }

  /**
   * Check if we're in a Railway environment
   */
  isRailwayEnvironment() {
    return process.env.RAILWAY_ENVIRONMENT === 'production' || 
           process.env.NODE_ENV === 'production' ||
           process.env.PORT; // Railway sets PORT
  }

  /**
   * Initialize font detection
   */
  async initialize() {
    if (this.isRailwayEnvironment()) {
      console.log('Railway environment detected, initializing font detection...');
      await this.detectAvailableFonts();
    }
  }
}

// Export singleton instance
const fontHelper = new FontHelper();
module.exports = fontHelper;