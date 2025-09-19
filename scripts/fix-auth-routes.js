const fs = require('fs');
const path = require('path');

// List of route files to fix
const routeFiles = [
  'routes/users.js',
  'routes/stores.js', 
  'routes/sales.js',
  'routes/reports.js',
  'routes/purchases.js',
  'routes/points.js',
  'routes/payoutRequests.js',
  'routes/online-purchases.js',
  'routes/notifications.js',
  'routes/dashboard.js',
  'routes/commissionSettings.js',
  'routes/commissions.js',
  'routes/commissionRules.js',
  'routes/campaigns.js',
  'routes/billing.js'
];

function fixAuthRoutes() {
  console.log('🔧 Fixing authentication routes...');
  
  routeFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace commented out authentication middleware
      content = content.replace(
        /\/\/ verifyToken,\s*\/\/ Temporarily disabled for testing/g,
        'verifyToken,  // Re-enabled authentication'
      );
      
      content = content.replace(
        /\/\/ requireManager,\s*\/\/ Temporarily disabled for testing/g,
        'requireManager,  // Re-enabled authorization'
      );
      
      content = content.replace(
        /\/\/ requireAdmin,\s*\/\/ Temporarily disabled for testing/g,
        'requireAdmin,  // Re-enabled authorization'
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed authentication in ${filePath}`);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
  
  console.log('✅ Authentication routes fixed!');
}

// Run the fix
fixAuthRoutes();