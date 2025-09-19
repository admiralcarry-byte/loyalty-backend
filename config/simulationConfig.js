// Simulation Configuration for ÁGUA TWEZAH Admin Backend
// This file controls which features use simulation vs real APIs

const SIMULATION_CONFIG = {
  // Global simulation mode
  global: {
    enabled: false, // Set to false to use real APIs
    mode: 'production', // 'simulation' | 'hybrid' | 'production'
    environment: process.env.NODE_ENV || 'production'
  },

  // Feature-specific simulation settings
  features: {
    // User Management
    users: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/users',
      simulationDelay: 500
    },

    // Store Management
    stores: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/stores',
      simulationDelay: 600
    },

    // Campaign Management
    campaigns: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/campaigns',
      simulationDelay: 800
    },

    // Sales Management
    sales: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/sales',
      simulationDelay: 700
    },

    // Commission System
    commissions: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/commissions',
      simulationDelay: 1000
    },

    // Billing System
    billing: {
      enabled: true,
      useSimulation: false,
      realApiEndpoint: '/api/billing',
      simulationDelay: 1200
    },

    // Notification System
    notifications: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/notifications',
      simulationDelay: 400
    },

    // Reporting System
    reports: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/reports',
      simulationDelay: 1500
    },

    // Points System
    points: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/points',
      simulationDelay: 600
    },

    // Cashback System
    cashback: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/cashback',
      simulationDelay: 800
    },

    // Purchase Management
    purchases: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/purchases',
      simulationDelay: 1000
    },

    // Online Purchase System
    onlinePurchases: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/online-purchases',
      simulationDelay: 1200
    },

    // Wallet Integration
    wallets: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/wallets',
      simulationDelay: 1000,
      // External wallet providers (for future integration)
      externalProviders: {
        pix: {
          name: 'PIX',
          status: 'planned',
          apiUrl: 'https://api.pix.com',
          supportedCurrencies: ['BRL', 'USD']
        },
        mobileMoney: {
          name: 'Mobile Money',
          status: 'planned',
          apiUrl: 'https://api.mobilemoney.com',
          supportedCurrencies: ['AOA', 'USD']
        },
        bankTransfer: {
          name: 'Bank Transfer',
          status: 'planned',
          apiUrl: 'https://api.banktransfer.com',
          supportedCurrencies: ['AOA', 'USD', 'EUR']
        }
      }
    },

    // Influencer Management
    influencers: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/influencers',
      simulationDelay: 800
    },

    // Geolocation Services
    geolocation: {
      enabled: true,
      useSimulation: true,
      realApiEndpoint: '/api/geolocation',
      simulationDelay: 600,
      // External mapping services (for future integration)
      externalServices: {
        googleMaps: {
          name: 'Google Maps',
          status: 'planned',
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        },
        openStreetMap: {
          name: 'OpenStreetMap',
          status: 'planned',
          apiUrl: 'https://nominatim.openstreetmap.org'
        }
      }
    }
  },

  // Simulation behavior settings
  simulation: {
    // Error simulation
    errors: {
      enabled: true,
      rate: 0.05, // 5% error rate
      types: ['network', 'timeout', 'validation', 'server']
    },

    // Delay simulation
    delays: {
      enabled: true,
      default: 500,
      min: 200,
      max: 3000,
      randomize: true
    },

    // Data persistence
    persistence: {
      enabled: false, // Data resets on server restart
      type: 'memory', // 'memory' | 'file' | 'database'
      filePath: './data/simulation.json'
    },

    // Realistic data generation
    dataGeneration: {
      enabled: true,
      locale: 'pt-AO', // Portuguese Angola
      timezone: 'Africa/Luanda',
      currency: 'AOA'
    }
  },

  // External service integrations (for future use)
  externalServices: {
    // Payment gateways
    paymentGateways: {
      stripe: {
        enabled: false,
        apiKey: process.env.STRIPE_API_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      paypal: {
        enabled: false,
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET
      }
    },

    // Email services
    emailServices: {
      sendgrid: {
        enabled: false,
        apiKey: process.env.SENDGRID_API_KEY
      },
      mailgun: {
        enabled: false,
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN
      }
    },

    // SMS services
    smsServices: {
      twilio: {
        enabled: false,
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN
      }
    },

    // Analytics services
    analytics: {
      googleAnalytics: {
        enabled: false,
        trackingId: process.env.GA_TRACKING_ID
      },
      mixpanel: {
        enabled: false,
        token: process.env.MIXPANEL_TOKEN
      }
    }
  },

  // Development and testing settings
  development: {
    // Mock data settings
    mockData: {
      enabled: true,
      users: 50,
      stores: 10,
      campaigns: 5,
      sales: 100,
      transactions: 200
    },

    // Testing settings
    testing: {
      enabled: process.env.NODE_ENV === 'test',
      seedData: true,
      resetOnStart: false
    },

    // Debug settings
    debug: {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
      logSimulationCalls: true,
      logApiCalls: true
    }
  }
};

// Helper functions
const isSimulationEnabled = (feature = null) => {
  if (!SIMULATION_CONFIG.global.enabled) return false;
  if (!feature) return true;
  return SIMULATION_CONFIG.features[feature]?.useSimulation || false;
};

const getSimulationDelay = (feature = null) => {
  if (feature && SIMULATION_CONFIG.features[feature]) {
    return SIMULATION_CONFIG.features[feature].simulationDelay;
  }
  return SIMULATION_CONFIG.simulation.delays.default;
};

const shouldSimulateError = () => {
  return SIMULATION_CONFIG.simulation.errors.enabled && 
         Math.random() < SIMULATION_CONFIG.simulation.errors.rate;
};

const getErrorType = () => {
  const types = SIMULATION_CONFIG.simulation.errors.types;
  return types[Math.floor(Math.random() * types.length)];
};

const isFeatureEnabled = (feature) => {
  return SIMULATION_CONFIG.features[feature]?.enabled || false;
};

const getRealApiEndpoint = (feature) => {
  return SIMULATION_CONFIG.features[feature]?.realApiEndpoint || `/api/${feature}`;
};

// Environment-specific overrides
const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'production';
  
  switch (env) {
    case 'production':
      return {
        ...SIMULATION_CONFIG,
        global: {
          ...SIMULATION_CONFIG.global,
          enabled: false,
          mode: 'production'
        }
      };
    
    case 'staging':
      return {
        ...SIMULATION_CONFIG,
        global: {
          ...SIMULATION_CONFIG.global,
          enabled: true,
          mode: 'hybrid'
        }
      };
    
    case 'test':
      return {
        ...SIMULATION_CONFIG,
        global: {
          ...SIMULATION_CONFIG.global,
          enabled: true,
          mode: 'simulation'
        },
        development: {
          ...SIMULATION_CONFIG.development,
          testing: {
            enabled: true,
            seedData: true,
            resetOnStart: true
          }
        }
      };
    
    default: // development
      return SIMULATION_CONFIG;
  }
};

module.exports = {
  config: getEnvironmentConfig(),
  isSimulationEnabled,
  getSimulationDelay,
  shouldSimulateError,
  getErrorType,
  isFeatureEnabled,
  getRealApiEndpoint,
  getEnvironmentConfig
}; 