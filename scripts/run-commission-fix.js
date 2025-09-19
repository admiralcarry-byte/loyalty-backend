#!/usr/bin/env node

/**
 * Simple runner script for the commission fix
 */

const CommissionFixer = require('./fix-missing-commissions');

console.log('🔧 AGUA TWEZAH - Commission Fix Script');
console.log('=====================================\n');

const fixer = new CommissionFixer();
fixer.run().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});