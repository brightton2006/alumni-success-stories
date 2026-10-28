import fs from 'fs';

const filePath = 'D:/alumni DB/test.members.json';
const content = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(content);

const idSet = new Set();
let dupOids = 0;
const emailMap = new Map();
let dupEmails = 0;

for (const r of data) {
  const oid = r._id?.$oid || (typeof r._id === 'string' ? r._id : null);
  if (idSet.has(oid)) dupOids++;
  idSet.add(oid);

  const email = (r.basic?.email_id || r.basic?.email || r.email_id || r.email || '').toLowerCase().trim();
  if (email) {
    if (emailMap.has(email)) {
      dupEmails++;
    }
    emailMap.set(email, (emailMap.get(email) || 0) + 1);
  }
}

console.log('Total records:', data.length);
console.log('Unique OIDs:', idSet.size, 'Duplicate OIDs:', dupOids);
console.log('Unique Emails:', emailMap.size, 'Duplicate Emails:', dupEmails);
