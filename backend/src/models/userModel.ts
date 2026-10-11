import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';

export type UserRole =
  | 'university_admin'
  | 'admin'
  | 'student'
  | 'validator'
  | 'authority'
  | 'verifier';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title: string;
  institution: string;
  studentId?: string;
  universityId?: string;
  organizationId?: string;
  accountStatus: 'active' | 'suspended' | 'pending';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title: string;
  institution: string;
  studentId?: string;
  universityId?: string;
  organizationId?: string;
  accountStatus: 'active' | 'suspended' | 'pending';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['university_admin', 'admin', 'student', 'validator', 'authority', 'verifier'],
      default: 'student',
      index: true,
    },
    title: { type: String, default: 'Member' },
    institution: { type: String, default: 'Stanford University' },
    studentId: { type: String, trim: true, index: true },
    universityId: { type: String, trim: true },
    organizationId: { type: String, trim: true },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// Mongoose User Model
export const MongooseUser =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);

class UserRepository {
  private users: Map<string, UserEntity> = new Map();

  constructor() {
    this.seedDemoUsers();
  }

  public seedDemoUsers() {
    const salt = bcrypt.genSaltSync(10);
    const demoAccounts = [
      {
        id: 'usr-admin-1',
        name: 'Dr. Evelyn Vance',
        email: 'evance@stanford.edu',
        plainPassword: 'AdminPassword@2026',
        role: 'university_admin' as UserRole,
        title: 'University Registrar & Custodian',
        institution: 'Stanford University',
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuChga8XlZMBMFXzAarFoDTwKkV0Ve3vxa2tW3qw1uW-6YS3sgfRPjBBU9WULILiubbOx1oLerO6QeLUBdaDiL2T0diCbvfKQ2SXJKUkzfqaiUm-wM_SmW8AYEztxVHVvaxvnii8uiSCjGLvlUBuK_-XEOui2ptFxFIzPb_HanovQr7wERY8cdQUvEtTX7aAdXFExdOh3Z5OgoHt0R2lzuTA-O44c9tbHx7FOXdiqV6SAoy47wggY34',
      },
      {
        id: 'usr-student-1',
        name: 'Elena Rostova',
        email: 'erostova@stanford.edu',
        plainPassword: 'StudentPassword@2026',
        role: 'student' as UserRole,
        title: 'Graduate Student (Alumna)',
        institution: 'Stanford University',
        studentId: 'SU-2020-0492',
        avatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDadtvbsucyAMzVJ8X5970rftwWdBf2qS14Qv5mrcUYVjHGCDnaR8ZbwYV2w_2cX60Q5r9dtQRfkZR3qR72F25Cd8uBDz3WzEUcyToES38NZOXKZrgrMVy6hiIpEO_E_5zU080e63Xi8rVH---aYxDZ97RcRtuFXX8HtH9QtXDZcR1mNuuprCLRJxCrpDwpZGs7g6eUT9mS6fePhGeGJrzYcX4lKfrpG-zhA1N2PV2My1j7wziWZfw',
      },
      {
        id: 'usr-student-2',
        name: 'Marcus Vance',
        email: 'mvance@law.stanford.edu',
        plainPassword: 'StudentPassword@2026',
        role: 'student' as UserRole,
        title: 'Law Graduate',
        institution: 'Stanford University',
        studentId: 'SU-2021-1184',
      },
      {
        id: 'usr-validator-1',
        name: 'Sarah Chen',
        email: 'schen@google.com',
        plainPassword: 'ValidatorPassword@2026',
        role: 'validator' as UserRole,
        title: 'Senior Technical Recruiter',
        institution: 'Google HR Global',
        organizationId: 'ORG-GOOGLE-01',
      },
      {
        id: 'usr-auth-1',
        name: 'Dr. Aris Thorne',
        email: 'athorne@chea-board.gov',
        plainPassword: 'AuthorityPassword@2026',
        role: 'validator' as UserRole,
        title: 'Chief Accreditation Auditor',
        institution: 'Council for Higher Education Accreditation (CHEA)',
      },
    ];

    for (const acc of demoAccounts) {
      const passwordHash = bcrypt.hashSync(acc.plainPassword, salt);
      const userObj: UserEntity = {
        id: acc.id,
        name: acc.name,
        email: acc.email.toLowerCase(),
        passwordHash,
        role: acc.role,
        title: acc.title,
        institution: acc.institution,
        studentId: acc.studentId,
        organizationId: acc.organizationId,
        accountStatus: 'active',
        avatar: acc.avatar,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(acc.email.toLowerCase(), userObj);
    }
  }

  public async findByEmail(email: string): Promise<UserEntity | undefined> {
    const cleanEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      try {
        const doc = await MongooseUser.findOne({ email: cleanEmail }).lean();
        if (doc) {
          return {
            id: (doc as any)._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            role: doc.role as UserRole,
            title: doc.title,
            institution: doc.institution,
            studentId: doc.studentId,
            universityId: doc.universityId,
            organizationId: doc.organizationId,
            accountStatus: doc.accountStatus,
            avatar: doc.avatar,
            createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: (doc as any).updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('[User] MongoDB query failed, using in-memory store.', err);
      }
    }

    return this.users.get(cleanEmail);
  }

  public async findById(id: string): Promise<UserEntity | undefined> {
    if (isDbConnected()) {
      try {
        const doc = await MongooseUser.findById(id).lean();
        if (doc) {
          return {
            id: (doc as any)._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            role: doc.role as UserRole,
            title: doc.title,
            institution: doc.institution,
            studentId: doc.studentId,
            universityId: doc.universityId,
            organizationId: doc.organizationId,
            accountStatus: doc.accountStatus,
            avatar: doc.avatar,
            createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: (doc as any).updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public async findAll(): Promise<UserEntity[]> {
    if (isDbConnected()) {
      try {
        const docs = await MongooseUser.find().sort({ createdAt: -1 }).lean();
        if (docs.length > 0) {
          return docs.map((doc: any) => ({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            passwordHash: doc.passwordHash,
            role: doc.role as UserRole,
            title: doc.title,
            institution: doc.institution,
            studentId: doc.studentId,
            universityId: doc.universityId,
            organizationId: doc.organizationId,
            accountStatus: doc.accountStatus,
            avatar: doc.avatar,
            createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }

    return Array.from(this.users.values());
  }

  public async createUser(userData: {
    name: string;
    email: string;
    plainPassword: string;
    role: UserRole;
    title?: string;
    institution?: string;
    studentId?: string;
    organizationId?: string;
  }): Promise<UserEntity> {
    const existing = await this.findByEmail(userData.email);
    if (existing) {
      throw new Error(`User with email "${userData.email}" already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.plainPassword, salt);
    const now = new Date().toISOString();

    const newUser: UserEntity = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      role: userData.role,
      title: userData.title || 'Member',
      institution: userData.institution || 'Stanford University',
      studentId: userData.studentId?.trim(),
      organizationId: userData.organizationId?.trim(),
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (isDbConnected()) {
      try {
        const doc = await MongooseUser.create({
          name: newUser.name,
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          role: newUser.role,
          title: newUser.title,
          institution: newUser.institution,
          studentId: newUser.studentId,
          organizationId: newUser.organizationId,
          accountStatus: 'active',
        });
        newUser.id = doc._id.toString();
      } catch (err: unknown) {
        throw new Error((err as Error).message || 'Failed to save user in MongoDB.');
      }
    }

    this.users.set(newUser.email, newUser);
    return newUser;
  }

  public async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  public toPublicUser(user: UserEntity) {
    const { passwordHash: _, ...publicFields } = user;
    return publicFields;
  }
}

export const userModel = new UserRepository();
