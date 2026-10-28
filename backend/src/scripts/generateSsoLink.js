import { buildSSORedirectURL } from 'vaave-sso-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from workspace root or backend
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const serverDomain = process.env.SSO_SERVER_DOMAIN || 'alumni.nec.edu.in';
const clientId = process.argv[3] || process.env.SSO_CLIENT_ID || 'pmGbbv39yFwZfOB6';
const customRedirect = process.argv[2];

const targets = customRedirect ? [
  { name: 'Custom Redirect', url: customRedirect }
] : [
  {
    name: 'Render Backend Callback (Recommended)',
    url: 'https://alumni-success-stories-backend.onrender.com/api/auth/sso/callback'
  },
  {
    name: 'Render Frontend Login',
    url: 'https://alumni-success-stories-frontend.onrender.com/login'
  },
  {
    name: 'NEC Alumni College Domain (Webinar / Stories API)',
    url: 'https://necalumni.nec.edu.in/api/stories/sso'
  },
  {
    name: 'Localhost Backend Dev',
    url: 'http://localhost:5000/api/auth/sso/callback'
  },
  {
    name: 'Localhost Frontend Dev',
    url: 'http://localhost:5173/login'
  }
];

console.log('\n======================================================');
console.log('   NEC ALUMNI VAAVE SSO LINK GENERATOR');
console.log('======================================================');
console.log(`SSO Server Domain : ${serverDomain}`);
console.log(`Client ID         : ${clientId}\n`);

targets.forEach((target, index) => {
  const result = buildSSORedirectURL({
    server_domain: serverDomain,
    client_id: clientId,
    redirect_url: target.url
  });

  const base64Part = Buffer.from(target.url).toString('base64');

  console.log(`[${index + 1}] ${target.name}`);
  console.log(`    Target Destination : ${target.url}`);
  console.log(`    Base64 Encoding    : ${base64Part}`);
  console.log(`    Generated SSO Link : ${result.url}\n`);
});

console.log('======================================================');
console.log('Usage: node src/scripts/generateSsoLink.js <optional_redirect_url> <optional_client_id>');
console.log('======================================================\n');
