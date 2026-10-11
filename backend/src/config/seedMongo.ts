import bcrypt from 'bcryptjs';
import { MongooseUser } from '../models/userModel.js';
import { MongooseCertificate } from '../models/certificateModel.js';
import { MongooseAuditLog } from '../models/auditLogModel.js';

export async function seedMongoIfEmpty(): Promise<void> {
  try {
    const userCount = await MongooseUser.countDocuments();
    if (userCount === 0) {
      console.log('[Database] MongoDB User collection is empty. Seeding initial accounts...');
      const salt = bcrypt.genSaltSync(10);
      const demoUsers = [
        {
          name: 'Dr. Evelyn Vance',
          email: 'evance@stanford.edu',
          passwordHash: bcrypt.hashSync('AdminPassword@2026', salt),
          role: 'university_admin',
          title: 'University Registrar & Custodian',
          institution: 'Stanford University',
          accountStatus: 'active',
          avatar:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuChga8XlZMBMFXzAarFoDTwKkV0Ve3vxa2tW3qw1uW-6YS3sgfRPjBBU9WULILiubbOx1oLerO6QeLUBdaDiL2T0diCbvfKQ2SXJKUkzfqaiUm-wM_SmW8AYEztxVHVvaxvnii8uiSCjGLvlUBuK_-XEOui2ptFxFIzPb_HanovQr7wERY8cdQUvEtTX7aAdXFExdOh3Z5OgoHt0R2lzuTA-O44c9tbHx7FOXdiqV6SAoy47wggY34',
        },
        {
          name: 'Elena Rostova',
          email: 'erostova@stanford.edu',
          passwordHash: bcrypt.hashSync('StudentPassword@2026', salt),
          role: 'student',
          title: 'Graduate Student (Alumna)',
          institution: 'Stanford University',
          studentId: 'SU-2020-0492',
          accountStatus: 'active',
          avatar:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDadtvbsucyAMzVJ8X5970rftwWdBf2qS14Qv5mrcUYVjHGCDnaR8ZbwYV2w_2cX60Q5r9dtQRfkZR3qR72F25Cd8uBDz3WzEUcyToES38NZOXKZrgrMVy6hiIpEO_E_5zU080e63Xi8rVH---aYxDZ97RcRtuFXX8HtH9QtXDZcR1mNuuprCLRJxCrpDwpZGs7g6eUT9mS6fePhGeGJrzYcX4lKfrpG-zhA1N2PV2My1j7wziWZfw',
        },
        {
          name: 'Marcus Vance',
          email: 'mvance@law.stanford.edu',
          passwordHash: bcrypt.hashSync('StudentPassword@2026', salt),
          role: 'student',
          title: 'Law Graduate',
          institution: 'Stanford University',
          studentId: 'SU-2021-1184',
          accountStatus: 'active',
        },
        {
          name: 'Sarah Chen',
          email: 'schen@google.com',
          passwordHash: bcrypt.hashSync('ValidatorPassword@2026', salt),
          role: 'validator',
          title: 'Senior Technical Recruiter',
          institution: 'Google HR Global',
          organizationId: 'ORG-GOOGLE-01',
          accountStatus: 'active',
        },
        {
          name: 'Dr. Aris Thorne',
          email: 'athorne@chea-board.gov',
          passwordHash: bcrypt.hashSync('AuthorityPassword@2026', salt),
          role: 'validator',
          title: 'Chief Accreditation Auditor',
          institution: 'Council for Higher Education Accreditation (CHEA)',
          accountStatus: 'active',
        },
      ];

      await MongooseUser.insertMany(demoUsers);
      console.log(`[Database] Seeded ${demoUsers.length} initial accounts into MongoDB.`);
    }

    // Do not seed fake certificates - only real user-issued certificates are stored
    const certCount = await MongooseCertificate.countDocuments();
    console.log(`[Database] MongoDB contains ${certCount} certificates.`);

    const logCount = await MongooseAuditLog.countDocuments();
    if (logCount === 0) {
      await MongooseAuditLog.create({
        eventType: 'LOGIN_SUCCESS',
        actorEmail: 'evance@stanford.edu',
        actorRole: 'university_admin',
        details: 'Initial system bootstrap and administrator authentication verified.',
        status: 'SUCCESS',
      });
    }
  } catch (err) {
    console.warn('[Database] Optional seed failed or partially completed:', err);
  }
}
