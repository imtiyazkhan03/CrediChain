import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/db.js';
import { userModel } from '../models/userModel.js';
import { auditLogModel } from '../models/auditLogModel.js';

async function setupInitialAdmin() {
  console.log('\n======================================================');
  console.log('🏛️  CertiChain — Initial University Administrator Provisioning');
  console.log('======================================================\n');

  await connectDatabase();

  const name = process.env.ADMIN_NAME || 'Dr. Evelyn Vance';
  const email = (process.env.ADMIN_EMAIL || 'evance@stanford.edu').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable is required.');
    console.error('   Please run with: ADMIN_PASSWORD="YourStrongPassword" npm run setup:admin\n');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long for university admin accounts.\n');
    process.exit(1);
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    console.log(`ℹ️  Administrator account for "${email}" already exists (Role: ${existing.role}).`);
    console.log('   No changes were made.\n');
    process.exit(0);
  }

  const admin = await userModel.createUser({
    name,
    email,
    plainPassword: password,
    role: 'university_admin',
    title: 'University Registrar & Chief Custodian',
    institution: 'Stanford University',
  });

  await auditLogModel.logEvent({
    eventType: 'USER_CREATED',
    actorEmail: 'system',
    actorRole: 'system',
    targetId: admin.id,
    details: `Initial university administrator ${admin.name} (${admin.email}) created via setup script.`,
    status: 'SUCCESS',
  });

  console.log('✅ Initial University Administrator successfully provisioned:');
  console.log(`   • Name:        ${admin.name}`);
  console.log(`   • Email:       ${admin.email}`);
  console.log(`   • Role:        ${admin.role}`);
  console.log(`   • Institution: ${admin.institution}`);
  console.log('\n🔒 Credentials securely hashed and saved. Ready for login.\n');
  process.exit(0);
}

setupInitialAdmin().catch((err) => {
  console.error('Fatal provisioning error:', err);
  process.exit(1);
});
