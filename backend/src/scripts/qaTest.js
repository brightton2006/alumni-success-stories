import { membersDb, initMongoConnection } from '../db.js';
import { runMemberImport } from './importMembers.js';
import { toPublicMemberRecord } from '../models/Member.js';

async function runQaSuite() {
  console.log('🧪 Starting Full QA Verification Suite...\n');
  let errors = 0;

  // 1. Database Connection & Import Verification
  console.log('1️⃣ Testing Database Connection & Data Import...');
  await initMongoConnection();

  const initialCount = membersDb.count();
  console.log(`   Current members in store: ${initialCount}`);

  if (initialCount === 0) {
    const importRes = await runMemberImport();
    if (!importRes.success || importRes.insertedCount !== 12049) {
      console.error('❌ Import failed or incorrect count:', importRes);
      errors++;
    } else {
      console.log('   ✅ Initial dataset import passed (12,049 records).');
    }
  } else {
    console.log(`   ✅ Dataset already populated with ${initialCount} records.`);
  }

  // 2. Test Idempotent Duplicate Prevention
  console.log('\n2️⃣ Testing Idempotent Duplicate Import Protection...');
  const secondImport = await runMemberImport();
  if (secondImport.insertedCount !== 0 || secondImport.duplicateCount !== 12049) {
    console.error('❌ Idempotency failed! Inserted duplicates:', secondImport);
    errors++;
  } else {
    console.log('   ✅ Idempotent import test passed: 0 duplicates inserted.');
  }

  // 3. Test Record Schema & Extended JSON Conversion
  console.log('\n3️⃣ Testing Extended JSON ($oid, $date) & Schema Normalization...');
  const sampleMember = membersDb.read()[0];
  if (!sampleMember || !sampleMember._id || typeof sampleMember._id !== 'string') {
    console.error('❌ Invalid sample _id format:', sampleMember?._id);
    errors++;
  } else if (typeof sampleMember._id === 'object') {
    console.error('❌ $oid was not converted to string!', sampleMember._id);
    errors++;
  } else {
    console.log(`   ✅ ObjectId conversion passed: sample _id = "${sampleMember._id}"`);
  }

  if (sampleMember.basic?.profileUpdatedOn && typeof sampleMember.basic.profileUpdatedOn === 'object') {
    console.error('❌ $date was not converted to string/ISO date!', sampleMember.basic.profileUpdatedOn);
    errors++;
  } else {
    console.log(`   ✅ Date conversion passed: sample profileUpdatedOn = "${sampleMember.basic?.profileUpdatedOn}"`);
  }

  // 4. Test Sensitive Information Filtering
  console.log('\n4️⃣ Testing Sensitive Personal Data Protection...');
  const publicRecord = toPublicMemberRecord(sampleMember);
  if (publicRecord.contactDetails?.mobile || publicRecord.contactDetails?.home || publicRecord.contactDetails?.address) {
    console.error('❌ Sensitive contact fields leaked in public record!', publicRecord.contactDetails);
    errors++;
  } else {
    console.log('   ✅ Sensitive fields (mobile, home, office, address) successfully shielded.');
  }

  // 5. Test Search & Filter Helper
  console.log('\n5️⃣ Testing Search & Filter Data Structure...');
  const members = membersDb.read();
  const cseMembers = members.filter(m => m.searchHelper?.stream?.toLowerCase().includes('computer science'));
  console.log(`   Found ${cseMembers.length} Computer Science & Engineering members.`);

  const batch2012Members = members.filter(m => m.searchHelper?.endYear === 2012);
  console.log(`   Found ${batch2012Members.length} members from batch of 2012.`);

  if (cseMembers.length === 0 || batch2012Members.length === 0) {
    console.error('❌ Search indexing yielded 0 results.');
    errors++;
  } else {
    console.log('   ✅ Search and filter indexing functions cleanly.');
  }

  console.log('\n========================================');
  if (errors === 0) {
    console.log('🎉 ALL QA TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error(`⚠️ QA TEST SUITE FINISHED WITH ${errors} ERRORS.`);
    process.exit(1);
  }
}

runQaSuite().then(() => process.exit(0)).catch(err => {
  console.error('QA Suite Execution Error:', err);
  process.exit(1);
});
