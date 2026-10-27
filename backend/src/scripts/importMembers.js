import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { membersDb, initMongoConnection } from '../db.js';
import { normalizeMemberRecord } from '../models/Member.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMemberImport() {
  const startTime = Date.now();

  // Find source file path
  let sourcePath = 'D:/alumni DB/test.members.json';
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(__dirname, '../../data/test.members.json');
  }
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(__dirname, '../../../test.members.json');
  }

  if (!fs.existsSync(sourcePath)) {
    console.log(`ℹ️ Member JSON file not found at ${sourcePath}. Skipping automatic member import.`);
    return {
      success: true,
      skipped: true,
      message: `Member JSON file not found at ${sourcePath}. Skipping import.`
    };
  }

  console.log('🚀 Starting member dataset import process...');
  await initMongoConnection();

  console.log(`📁 Reading member dataset from: ${sourcePath}`);
  const fileContent = fs.readFileSync(sourcePath, 'utf8');
  const rawMembers = JSON.parse(fileContent);
  console.log(`📊 Loaded ${rawMembers.length} member records from JSON.`);

  const existingMembers = membersDb.read();
  const existingIdSet = new Set(existingMembers.map(m => String(m._id || m.id)));
  const existingEmailSet = new Set(
    existingMembers
      .map(m => m.basic?.email || m.basic?.email_id)
      .filter(Boolean)
      .map(e => e.toLowerCase())
  );

  let insertedCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  let missingEmailCount = 0;

  const membersToInsert = [];

  for (const raw of rawMembers) {
    if (!raw || typeof raw !== 'object') {
      invalidCount++;
      continue;
    }

    const normalized = normalizeMemberRecord(raw);

    // Duplicate detection
    const rawId = normalized._id;
    const rawEmail = normalized.basic?.email;

    if (!rawEmail) {
      missingEmailCount++;
    }

    if (existingIdSet.has(rawId)) {
      duplicateCount++;
      continue;
    }

    if (rawEmail && existingEmailSet.has(rawEmail)) {
      duplicateCount++;
      continue;
    }

    existingIdSet.add(rawId);
    if (rawEmail) {
      existingEmailSet.add(rawEmail);
    }

    membersToInsert.push(normalized);
  }

  if (membersToInsert.length > 0) {
    console.log(`💾 Inserting ${membersToInsert.length} new normalized member records into database...`);
    insertedCount = membersDb.insertMany(membersToInsert);
  }

  const durationMs = Date.now() - startTime;
  const summary = {
    success: true,
    totalRecordsInFile: rawMembers.length,
    insertedCount,
    duplicateCount,
    invalidCount,
    missingEmailCount,
    totalInDb: membersDb.read().length,
    durationSeconds: (durationMs / 1000).toFixed(2)
  };

  console.log('✅ Member dataset import completed successfully!');
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMemberImport().then(() => process.exit(0)).catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });
}
