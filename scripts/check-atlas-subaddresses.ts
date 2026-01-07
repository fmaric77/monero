import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
try {
  const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (e) {
  // File doesn't exist, that's okay
}

async function checkAtlasSubaddresses() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Please set MONGODB_URI in .env.local or .env');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Check if SubaddressMetadata collection exists (shouldn't)
    const hasSubaddressCollection = collections.some(c => 
      c.name === 'subaddresses' || 
      c.name === 'SubaddressMetadata' ||
      c.name.toLowerCase().includes('subaddress')
    );
    
    if (hasSubaddressCollection) {
      console.log('⚠️  WARNING: Found SubaddressMetadata collection in Atlas!');
      console.log('   This should only be in local MongoDB.\n');
      
      const subaddressCol = db.collection('subaddresses');
      const count = await subaddressCol.countDocuments();
      console.log(`   Found ${count} subaddress records in Atlas\n`);
    } else {
      console.log('✅ No SubaddressMetadata collection found (correct - should be local only)\n');
    }

    // Check Payments collection for address field
    const paymentsCol = db.collection('payments');
    const paymentCount = await paymentsCol.countDocuments();
    console.log(`📊 Payments collection: ${paymentCount} total payments`);

    if (paymentCount > 0) {
      // Sample a few payments to check schema
      const samplePayments = await paymentsCol.find({}).limit(5).toArray();
      
      console.log('\n📝 Sample payment documents:');
      samplePayments.forEach((payment: any, idx: number) => {
        console.log(`\n   Payment ${idx + 1}:`);
        console.log(`     paymentId: ${payment.paymentId}`);
        console.log(`     Fields: ${Object.keys(payment).join(', ')}`);
        
        if (payment.address !== undefined) {
          console.log(`     ⚠️  WARNING: Found 'address' field: ${payment.address?.substring(0, 20)}...`);
        }
        if (payment.subaddress !== undefined) {
          console.log(`     ⚠️  WARNING: Found 'subaddress' field: ${payment.subaddress?.substring(0, 20)}...`);
        }
      });

      // Count payments with address field
      const paymentsWithAddress = await paymentsCol.countDocuments({ address: { $exists: true } });
      if (paymentsWithAddress > 0) {
        console.log(`\n⚠️  WARNING: Found ${paymentsWithAddress} payments with 'address' field`);
        console.log('   These are old records from before we removed the address field.');
      } else {
        console.log('\n✅ No payments have an "address" field (correct)');
      }

      // Count payments with subaddress field
      const paymentsWithSubaddress = await paymentsCol.countDocuments({ subaddress: { $exists: true } });
      if (paymentsWithSubaddress > 0) {
        console.log(`\n⚠️  WARNING: Found ${paymentsWithSubaddress} payments with 'subaddress' field`);
      } else {
        console.log('✅ No payments have a "subaddress" field (correct)');
      }
    }

    // Check Users collection
    const usersCol = db.collection('users');
    const userCount = await usersCol.countDocuments();
    console.log(`\n👤 Users collection: ${userCount} total users`);

    if (userCount > 0) {
      const sampleUsers = await usersCol.find({}).limit(3).toArray();
      console.log('\n📝 Sample user documents:');
      sampleUsers.forEach((user: any, idx: number) => {
        console.log(`\n   User ${idx + 1}:`);
        console.log(`     publicKey: ${user.publicKey?.substring(0, 20)}...`);
        console.log(`     accountIndex: ${user.accountIndex ?? 'null'}`);
        console.log(`     Fields: ${Object.keys(user).join(', ')}`);
        
        if (user.custodialAddress !== undefined) {
          console.log(`     ⚠️  WARNING: Found 'custodialAddress' field: ${user.custodialAddress?.substring(0, 20)}...`);
        }
        if (user.subaddress !== undefined) {
          console.log(`     ⚠️  WARNING: Found 'subaddress' field`);
        }
      });

      // Check for old custodialAddress field
      const usersWithCustodialAddress = await usersCol.countDocuments({ custodialAddress: { $exists: true } });
      if (usersWithCustodialAddress > 0) {
        console.log(`\n⚠️  WARNING: Found ${usersWithCustodialAddress} users with 'custodialAddress' field`);
        console.log('   This is from the old wallet-per-user system.');
      } else {
        console.log('\n✅ No users have "custodialAddress" field (correct)');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log('✅ Subaddresses should ONLY be in local MongoDB');
    console.log('✅ Payments should NOT have address/subaddress fields');
    console.log('✅ Users should NOT have custodialAddress field');
    console.log('✅ Only Users and Payments collections should exist in Atlas\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

checkAtlasSubaddresses();

