import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'student' | 'authority' | 'verifier';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title: string;
  institution: string;
  studentId?: string;
  avatar?: string;
  createdAt: string;
}

// In-memory / persistent user repository with seeded standard demo accounts
class UserRepository {
  private users: Map<string, UserEntity> = new Map();

  constructor() {
    this.seedDemoUsers();
  }

  private seedDemoUsers() {
    // Generate salt and hashes synchronously for deterministic college demo startup
    const salt = bcrypt.genSaltSync(10);
    
    const demoAccounts = [
      {
        id: 'usr-admin-1',
        name: 'Dr. Evelyn Vance',
        email: 'evance@stanford.edu',
        plainPassword: 'AdminPassword@2026',
        role: 'admin' as UserRole,
        title: 'University Registrar & Custodian',
        institution: 'Stanford University',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChga8XlZMBMFXzAarFoDTwKkV0Ve3vxa2tW3qw1uW-6YS3sgfRPjBBU9WULILiubbOx1oLerO6QeLUBdaDiL2T0diCbvfKQ2SXJKUkzfqaiUm-wM_SmW8AYEztxVHVvaxvnii8uiSCjGLvlUBuK_-XEOui2ptFxFIzPb_HanovQr7wERY8cdQUvEtTX7aAdXFExdOh3Z5OgoHt0R2lzuTA-O44c9tbHx7FOXdiqV6SAoy47wggY34',
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
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDadtvbsucyAMzVJ8X5970rftwWdBf2qS14Qv5mrcUYVjHGCDnaR8ZbwYV2w_2cX60Q5r9dtQRfkZR3qR72F25Cd8uBDz3WzEUcyToES38NZOXKZrgrMVy6hiIpEO_E_5zU080e63Xi8rVH---aYxDZ97RcRtuFXX8HtH9QtXDZcR1mNuuprCLRJxCrpDwpZGs7g6eUT9mS6fePhGeGJrzYcX4lKfrpG-zhA1N2PV2My1j7wziWZfw',
      },
      {
        id: 'usr-auth-1',
        name: 'Dr. Aris Thorne',
        email: 'athorne@chea-board.gov',
        plainPassword: 'AuthorityPassword@2026',
        role: 'authority' as UserRole,
        title: 'Chief Accreditation Auditor',
        institution: 'Council for Higher Education Accreditation (CHEA)',
      },
      {
        id: 'usr-verifier-1',
        name: 'Sarah Chen',
        email: 'schen@google.com',
        plainPassword: 'VerifierPassword@2026',
        role: 'verifier' as UserRole,
        title: 'Senior Technical Recruiter',
        institution: 'Google HR Global',
      },
    ];

    for (const acc of demoAccounts) {
      const passwordHash = bcrypt.hashSync(acc.plainPassword, salt);
      this.users.set(acc.email.toLowerCase(), {
        id: acc.id,
        name: acc.name,
        email: acc.email.toLowerCase(),
        passwordHash,
        role: acc.role,
        title: acc.title,
        institution: acc.institution,
        studentId: acc.studentId,
        avatar: acc.avatar,
        createdAt: new Date().toISOString(),
      });
    }
  }

  public findByEmail(email: string): UserEntity | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  public findById(id: string): UserEntity | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  public async createUser(userData: {
    name: string;
    email: string;
    plainPassword: string;
    role: UserRole;
    title?: string;
    institution?: string;
    studentId?: string;
  }): Promise<UserEntity> {
    const existing = this.findByEmail(userData.email);
    if (existing) {
      throw new Error(`User with email "${userData.email}" already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.plainPassword, salt);
    const newUser: UserEntity = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      passwordHash,
      role: userData.role,
      title: userData.title || 'Academic Member',
      institution: userData.institution || 'Institutional Partner',
      studentId: userData.studentId,
      createdAt: new Date().toISOString(),
    };

    this.users.set(newUser.email, newUser);
    return newUser;
  }

  public async verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }

  public toPublicUser(user: UserEntity) {
    // Never leak passwordHash
    const { passwordHash: _, ...publicFields } = user;
    return publicFields;
  }
}

export const userModel = new UserRepository();
