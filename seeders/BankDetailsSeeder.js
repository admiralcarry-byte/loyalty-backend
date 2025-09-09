const BaseSeeder = require('./BaseSeeder');
const mongoose = require('mongoose');

/**
 * Bank Details seeder - Creates sample bank details
 */
class BankDetailsSeeder extends BaseSeeder {
  async seed() {
    console.log('🏦 Seeding bank details...');
    
    const existingCount = await this.getExistingCount('bank_details');
    if (existingCount > 0) {
      console.log(`ℹ️  Bank details collection already has ${existingCount} records. Skipping.`);
      return;
    }

    // Get user IDs for relationships
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('⚠️  Skipping bank details seeding - users collection is empty');
      return;
    }

    const bankDetails = [
      {
        user_id: users[0]._id,
        account_holder_name: 'Admin User',
        bank_name: 'Banco de Fomento Angola',
        account_number: '1234567890123456',
        iban: 'AO06004000012345678901234',
        swift_code: 'BFAOAOLU',
        branch_code: '001',
        account_type: 'checking',
        currency: 'AOA',
        is_primary: true,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 86400000), // 1 day ago
        metadata: {
          bank_address: 'Rua Amílcar Cabral, 123, Luanda, Angola',
          phone: '+244222123456',
          email: 'info@bfa.ao'
        },
        created_at: new Date(Date.now() - 172800000), // 2 days ago
        updated_at: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        user_id: users[1]._id,
        account_holder_name: 'Maria Silva',
        bank_name: 'Banco Angolano de Investimentos',
        account_number: '2345678901234567',
        iban: 'AO06004000023456789012345',
        swift_code: 'BAIAOLLU',
        branch_code: '002',
        account_type: 'savings',
        currency: 'AOA',
        is_primary: true,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 259200000), // 3 days ago
        metadata: {
          bank_address: 'Avenida 4 de Fevereiro, 456, Luanda, Angola',
          phone: '+244222234567',
          email: 'contact@bai.ao'
        },
        created_at: new Date(Date.now() - 345600000), // 4 days ago
        updated_at: new Date(Date.now() - 259200000) // 3 days ago
      },
      {
        user_id: users[2]._id,
        account_holder_name: 'João Santos',
        bank_name: 'Banco Millennium Atlântico',
        account_number: '3456789012345678',
        iban: 'AO06004000034567890123456',
        swift_code: 'BMAOAOLU',
        branch_code: '003',
        account_type: 'checking',
        currency: 'AOA',
        is_primary: true,
        is_verified: false,
        verification_status: 'pending',
        verification_date: null,
        metadata: {
          bank_address: 'Rua da Marginal, 789, Benguela, Angola',
          phone: '+244222345678',
          email: 'support@millennium.ao'
        },
        created_at: new Date(Date.now() - 432000000), // 5 days ago
        updated_at: new Date(Date.now() - 432000000) // 5 days ago
      },
      {
        user_id: users[3]._id,
        account_holder_name: 'Ana Costa',
        bank_name: 'Standard Bank Angola',
        account_number: '4567890123456789',
        iban: 'AO06004000045678901234567',
        swift_code: 'SBICAOLL',
        branch_code: '004',
        account_type: 'business',
        currency: 'USD',
        is_primary: true,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 518400000), // 6 days ago
        metadata: {
          bank_address: 'Rua do Comércio, 321, Huambo, Angola',
          phone: '+244222456789',
          email: 'info@standardbank.ao'
        },
        created_at: new Date(Date.now() - 604800000), // 7 days ago
        updated_at: new Date(Date.now() - 518400000) // 6 days ago
      },
      {
        user_id: users[4]._id,
        account_holder_name: 'Carlos Fernandes',
        bank_name: 'Banco de Poupança e Crédito',
        account_number: '5678901234567890',
        iban: 'AO06004000056789012345678',
        swift_code: 'BPCAOLLU',
        branch_code: '005',
        account_type: 'savings',
        currency: 'AOA',
        is_primary: true,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 691200000), // 8 days ago
        metadata: {
          bank_address: 'Rua da Independência, 654, Luanda, Angola',
          phone: '+244222567890',
          email: 'contact@bpc.ao'
        },
        created_at: new Date(Date.now() - 777600000), // 9 days ago
        updated_at: new Date(Date.now() - 691200000) // 8 days ago
      },
      {
        user_id: users[0]._id,
        account_holder_name: 'Admin User',
        bank_name: 'Banco Sol',
        account_number: '6789012345678901',
        iban: 'AO06004000067890123456789',
        swift_code: 'BSOLAOLU',
        branch_code: '006',
        account_type: 'checking',
        currency: 'AOA',
        is_primary: false,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 864000000), // 10 days ago
        metadata: {
          bank_address: 'Avenida Comandante Gika, 987, Luanda, Angola',
          phone: '+244222678901',
          email: 'info@bancosol.ao'
        },
        created_at: new Date(Date.now() - 950400000), // 11 days ago
        updated_at: new Date(Date.now() - 864000000) // 10 days ago
      },
      {
        user_id: users[1]._id,
        account_holder_name: 'Maria Silva',
        bank_name: 'Banco Económico',
        account_number: '7890123456789012',
        iban: 'AO06004000078901234567890',
        swift_code: 'BECOAOLU',
        branch_code: '007',
        account_type: 'checking',
        currency: 'AOA',
        is_primary: false,
        is_verified: false,
        verification_status: 'failed',
        verification_date: new Date(Date.now() - 1036800000), // 12 days ago
        metadata: {
          bank_address: 'Rua Amílcar Cabral, 147, Luanda, Angola',
          phone: '+244222789012',
          email: 'support@bancoeconomico.ao',
          failure_reason: 'Account number mismatch'
        },
        created_at: new Date(Date.now() - 1123200000), // 13 days ago
        updated_at: new Date(Date.now() - 1036800000) // 12 days ago
      },
      {
        user_id: users[2]._id,
        account_holder_name: 'João Santos',
        bank_name: 'Banco de Desenvolvimento de Angola',
        account_number: '8901234567890123',
        iban: 'AO06004000089012345678901',
        swift_code: 'BDAOAOLU',
        branch_code: '008',
        account_type: 'savings',
        currency: 'AOA',
        is_primary: false,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 1209600000), // 14 days ago
        metadata: {
          bank_address: 'Avenida 4 de Fevereiro, 258, Benguela, Angola',
          phone: '+244222890123',
          email: 'info@bda.ao'
        },
        created_at: new Date(Date.now() - 1296000000), // 15 days ago
        updated_at: new Date(Date.now() - 1209600000) // 14 days ago
      },
      {
        user_id: users[3]._id,
        account_holder_name: 'Ana Costa',
        bank_name: 'Banco Caixa Geral Totta de Angola',
        account_number: '9012345678901234',
        iban: 'AO06004000090123456789012',
        swift_code: 'CGTTAOLL',
        branch_code: '009',
        account_type: 'business',
        currency: 'EUR',
        is_primary: false,
        is_verified: true,
        verification_status: 'verified',
        verification_date: new Date(Date.now() - 1382400000), // 16 days ago
        metadata: {
          bank_address: 'Rua da Marginal, 369, Huambo, Angola',
          phone: '+244222901234',
          email: 'contact@cgt.ao'
        },
        created_at: new Date(Date.now() - 1468800000), // 17 days ago
        updated_at: new Date(Date.now() - 1382400000) // 16 days ago
      },
      {
        user_id: users[4]._id,
        account_holder_name: 'Carlos Fernandes',
        bank_name: 'Banco de Negócios Internacional',
        account_number: '0123456789012345',
        iban: 'AO06004000001234567890123',
        swift_code: 'BNIAOLLU',
        branch_code: '010',
        account_type: 'checking',
        currency: 'USD',
        is_primary: false,
        is_verified: false,
        verification_status: 'pending',
        verification_date: null,
        metadata: {
          bank_address: 'Rua do Comércio, 741, Luanda, Angola',
          phone: '+244222012345',
          email: 'info@bni.ao'
        },
        created_at: new Date(Date.now() - 1555200000), // 18 days ago
        updated_at: new Date(Date.now() - 1555200000) // 18 days ago
      }
    ];

    await this.seedCollection('bank_details', bankDetails, { clearFirst: false });
  }
}

module.exports = BankDetailsSeeder;