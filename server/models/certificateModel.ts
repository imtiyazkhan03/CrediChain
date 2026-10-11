export interface CertificateRecord {
  id: string;
  txHash: string;
  fullTxHash: string;
  certHash: string; // SHA-256 hash of exact PDF bytes
  studentName: string;
  studentId: string;
  studentEmail: string;
  studentAvatar?: string;
  degree: string;
  department: string;
  honors?: string;
  date: string;
  mintedDate: string;
  blockNumber: number;
  status: 'Verified' | 'Revoked' | 'Pending';
  revocationReason?: string;
  revokedAt?: string;
  issuer: string;
  issuerRole: string;
  coSigner?: string;
  coSignerRole?: string;
  gpa?: string;
  pdfPath?: string; // Private storage file path
  createdAt: string;
  updatedAt: string;
}

export interface PublicVerificationRecord {
  id: string;
  degree: string;
  department: string;
  honors?: string;
  date: string;
  mintedDate: string;
  blockNumber: number;
  status: 'Verified' | 'Revoked' | 'Pending';
  revocationReason?: string;
  revokedAt?: string;
  certHash: string;
  txHash: string;
  fullTxHash: string;
  issuer: string;
  issuerRole: string;
  coSigner?: string;
  coSignerRole?: string;
  // Student Name is displayed on degree, but sensitive PII (studentEmail, studentId, GPA, private pdfPath) is masked
  studentNameMasked?: string;
}

class CertificateRepository {
  private certificates: Map<string, CertificateRecord> = new Map();

  constructor() {
    this.seedInitialCertificates();
  }

  private seedInitialCertificates() {
    const seed: CertificateRecord[] = [
      {
        id: "CERT-2024-8841",
        txHash: "0x4b7f...989c",
        fullTxHash: "0x4b7f6a8e10c793ba846b9a8cf1293a7493a7d483b9f8d91a7836b71239989ca0",
        certHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        studentName: "Elena Rostova",
        studentId: "SU-2020-0492",
        studentEmail: "erostova@stanford.edu",
        studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDadtvbsucyAMzVJ8X5970rftwWdBf2qS14Qv5mrcUYVjHGCDnaR8ZbwYV2w_2cX60Q5r9dtQRfkZR3qR72F25Cd8uBDz3WzEUcyToES38NZOXKZrgrMVy6hiIpEO_E_5zU080e63Xi8rVH---aYxDZ97RcRtuFXX8HtH9QtXDZcR1mNuuprCLRJxCrpDwpZGs7g6eUT9mS6fePhGeGJrzYcX4lKfrpG-zhA1N2PV2My1j7wziWZfw",
        degree: "M.S. in Computer Science (Artificial Intelligence)",
        department: "School of Engineering",
        honors: "Summa Cum Laude",
        date: "Mar 14, 2024",
        mintedDate: "Mar 14, 2024, 14:28:11 UTC",
        blockNumber: 19842084,
        status: "Verified",
        issuer: "Dr. Evelyn Vance",
        issuerRole: "University Registrar & Custodian",
        coSigner: "Prof. Julian Thorpe",
        coSignerRole: "Dean of Academic Affairs",
        gpa: "3.98 / 4.00",
        createdAt: "2024-03-14T14:28:11Z",
        updatedAt: "2024-03-14T14:28:11Z"
      },
      {
        id: "CERT-2024-8840",
        txHash: "0x82a1...bc19",
        fullTxHash: "0x82a1b94c39185a7384218db493cbfa104829fa756184029bc48028f849bc1932",
        certHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
        studentName: "Marcus Vance",
        studentId: "SU-2021-1184",
        studentEmail: "mvance@law.stanford.edu",
        degree: "Juris Doctor (J.D.) - Stanford Law",
        department: "Stanford Law School",
        honors: "Order of the Coif",
        date: "Mar 14, 2024",
        mintedDate: "Mar 14, 2024, 14:15:02 UTC",
        blockNumber: 19842084,
        status: "Verified",
        issuer: "Dr. Evelyn Vance",
        issuerRole: "University Registrar & Custodian",
        coSigner: "Prof. Jenny Martinez",
        coSignerRole: "Dean of Stanford Law School",
        gpa: "3.91 / 4.00",
        createdAt: "2024-03-14T14:15:02Z",
        updatedAt: "2024-03-14T14:15:02Z"
      },
      {
        id: "CERT-2024-8835",
        txHash: "0x61de...45aa",
        fullTxHash: "0x61de9284018274019284019284019284019284019284019284019284019245aa",
        certHash: "0d8f244b76a084fb415c9284f180294109401928401928401928401928401928",
        studentName: "Thomas Sterling",
        studentId: "SU-2019-4411",
        studentEmail: "tsterling@stanford.edu",
        degree: "Master of Business Administration (MBA)",
        department: "Graduate School of Business",
        honors: "Arjay Miller Scholar",
        date: "Mar 10, 2024",
        mintedDate: "Mar 10, 2024, 11:20:44 UTC",
        blockNumber: 19825400,
        status: "Revoked",
        revocationReason: "Disciplinary sanctions and degree nullification confirmed by Academic Senate.",
        revokedAt: "Mar 11, 2024, 09:15:00 UTC",
        issuer: "Dr. Evelyn Vance",
        issuerRole: "University Registrar & Custodian",
        coSigner: "Prof. Jonathan Levin",
        coSignerRole: "Dean of Stanford GSB",
        gpa: "3.72 / 4.00",
        createdAt: "2024-03-10T11:20:44Z",
        updatedAt: "2024-03-11T09:15:00Z"
      }
    ];

    for (const c of seed) {
      this.certificates.set(c.id, c);
    }
  }

  public findAll(): CertificateRecord[] {
    return Array.from(this.certificates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public findByStudent(studentEmail: string, studentId?: string): CertificateRecord[] {
    const emailNorm = studentEmail.toLowerCase().trim();
    return this.findAll().filter(
      (c) =>
        c.studentEmail.toLowerCase() === emailNorm ||
        (studentId && c.studentId.toLowerCase() === studentId.toLowerCase().trim())
    );
  }

  public findById(id: string): CertificateRecord | undefined {
    return this.certificates.get(id.trim());
  }

  public findByHash(hash: string): CertificateRecord | undefined {
    const clean = hash.trim().toLowerCase().replace(/^0x/, '');
    for (const cert of this.certificates.values()) {
      const certHashClean = cert.certHash.toLowerCase().replace(/^0x/, '');
      if (certHashClean === clean) return cert;
    }
    return undefined;
  }

  /**
   * CRITICAL PRIVACY RULE:
   * Strips all sensitive PII (student email, student id, GPA, private physical storage paths).
   * Masks student name for public view if desired, while providing verifiable degree metadata.
   */
  public toPublicVerification(cert: CertificateRecord): PublicVerificationRecord {
    // Mask name partially (e.g., "Elena Rostova" -> "E****a R*****a" or kept intact as degree holder name, but zero student ID / email / GPA)
    const nameParts = cert.studentName.split(' ');
    const maskedName = nameParts
      .map(part => part.length <= 2 ? part : `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`)
      .join(' ');

    return {
      id: cert.id,
      degree: cert.degree,
      department: cert.department,
      honors: cert.honors,
      date: cert.date,
      mintedDate: cert.mintedDate,
      blockNumber: cert.blockNumber,
      status: cert.status,
      revocationReason: cert.revocationReason,
      revokedAt: cert.revokedAt,
      certHash: cert.certHash,
      txHash: cert.txHash,
      fullTxHash: cert.fullTxHash,
      issuer: cert.issuer,
      issuerRole: cert.issuerRole,
      coSigner: cert.coSigner,
      coSignerRole: cert.coSignerRole,
      studentNameMasked: maskedName,
    };
  }

  public create(data: Omit<CertificateRecord, 'createdAt' | 'updatedAt'>): CertificateRecord {
    if (this.certificates.has(data.id)) {
      throw new Error(`Certificate with ID "${data.id}" already exists.`);
    }

    const now = new Date().toISOString();
    const record: CertificateRecord = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.certificates.set(record.id, record);
    return record;
  }

  public revoke(id: string, reason: string): CertificateRecord {
    const cert = this.certificates.get(id);
    if (!cert) {
      throw new Error(`Certificate with ID "${id}" does not exist.`);
    }

    cert.status = 'Revoked';
    cert.revocationReason = reason;
    cert.revokedAt = new Date().toUTCString();
    cert.updatedAt = new Date().toISOString();

    this.certificates.set(id, cert);
    return cert;
  }
}

export const certificateModel = new CertificateRepository();
