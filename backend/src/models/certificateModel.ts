import mongoose, { Schema, type Document } from 'mongoose';
import { isDbConnected } from '../config/db.js';

export interface CertificateRecord {
  id: string;
  txHash: string;
  fullTxHash: string;
  certHash: string; // SHA-256 hex digest of exact PDF bytes
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
  onChainStatus: 'confirmed' | 'pending' | 'revoked' | 'unregistered';
  chainName: string;
  chainId: number;
  contractAddress: string;
  revocationReason?: string;
  revokedAt?: string;
  issuer: string;
  issuerRole: string;
  coSigner?: string;
  coSignerRole?: string;
  gpa?: string;
  pdfPath?: string; // Private physical storage path
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
  onChainStatus: 'confirmed' | 'pending' | 'revoked' | 'unregistered';
  revocationReason?: string;
  revokedAt?: string;
  certHash: string;
  txHash: string;
  fullTxHash: string;
  chainName: string;
  chainId: number;
  issuer: string;
  issuerRole: string;
  coSigner?: string;
  coSignerRole?: string;
  studentNameMasked: string;
}

export interface ICertificateDocument extends Document {
  certificateId: string;
  txHash: string;
  fullTxHash: string;
  certHash: string;
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
  onChainStatus: 'confirmed' | 'pending' | 'revoked' | 'unregistered';
  chainName: string;
  chainId: number;
  contractAddress: string;
  revocationReason?: string;
  revokedAt?: string;
  issuer: string;
  issuerRole: string;
  coSigner?: string;
  coSignerRole?: string;
  gpa?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificateDocument>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    txHash: { type: String, default: '' },
    fullTxHash: { type: String, default: '' },
    certHash: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    studentEmail: { type: String, required: true, lowercase: true, index: true },
    studentAvatar: { type: String },
    degree: { type: String, required: true },
    department: { type: String, required: true },
    honors: { type: String },
    date: { type: String, required: true },
    mintedDate: { type: String, required: true },
    blockNumber: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Verified', 'Revoked', 'Pending'],
      default: 'Verified',
      index: true,
    },
    onChainStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'revoked', 'unregistered'],
      default: 'unregistered',
    },
    chainName: { type: String, default: 'Ethereum Sepolia' },
    chainId: { type: Number, default: 11155111 },
    contractAddress: { type: String, default: '' },
    revocationReason: { type: String },
    revokedAt: { type: String },
    issuer: { type: String, required: true },
    issuerRole: { type: String, required: true },
    coSigner: { type: String },
    coSignerRole: { type: String },
    gpa: { type: String },
    pdfPath: { type: String },
  },
  {
    timestamps: true,
  }
);

// Mongoose Certificate Model
export const MongooseCertificate =
  mongoose.models.Certificate ||
  mongoose.model<ICertificateDocument>('Certificate', certificateSchema);

class CertificateRepository {
  private certificates: Map<string, CertificateRecord> = new Map();

  constructor() {
    this.seedTestCertificates();
  }

  public seedTestCertificates() {
    // Pure genuine data store: No fake demo certificates seeded.
  }

  public async findAll(): Promise<CertificateRecord[]> {
    if (isDbConnected()) {
      try {
        const docs = await MongooseCertificate.find().sort({ createdAt: -1 }).lean();
        return docs.map((d: any) => ({
            id: d.certificateId,
            txHash: d.txHash,
            fullTxHash: d.fullTxHash,
            certHash: d.certHash,
            studentName: d.studentName,
            studentId: d.studentId,
            studentEmail: d.studentEmail,
            studentAvatar: d.studentAvatar,
            degree: d.degree,
            department: d.department,
            honors: d.honors,
            date: d.date,
            mintedDate: d.mintedDate,
            blockNumber: d.blockNumber,
            status: d.status,
            onChainStatus: d.onChainStatus,
            chainName: d.chainName,
            chainId: d.chainId,
            contractAddress: d.contractAddress,
            revocationReason: d.revocationReason,
            revokedAt: d.revokedAt,
            issuer: d.issuer,
            issuerRole: d.issuerRole,
            coSigner: d.coSigner,
            coSignerRole: d.coSignerRole,
            gpa: d.gpa,
            pdfPath: d.pdfPath,
            createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: d.updatedAt?.toISOString() || new Date().toISOString(),
          }));
      } catch {
        // Fallback
      }
    }

    return Array.from(this.certificates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async findByStudent(studentEmail: string, studentId?: string): Promise<CertificateRecord[]> {
    const all = await this.findAll();
    const emailNorm = studentEmail.toLowerCase().trim();
    return all.filter(
      (c) =>
        c.studentEmail.toLowerCase() === emailNorm ||
        (studentId && c.studentId.toLowerCase() === studentId.toLowerCase().trim())
    );
  }

  public async findById(id: string): Promise<CertificateRecord | undefined> {
    const cleanId = id.trim();

    if (isDbConnected()) {
      try {
        const doc = await MongooseCertificate.findOne({ certificateId: cleanId }).lean();
        if (doc) {
          const d: any = doc;
          return {
            id: d.certificateId,
            txHash: d.txHash,
            fullTxHash: d.fullTxHash,
            certHash: d.certHash,
            studentName: d.studentName,
            studentId: d.studentId,
            studentEmail: d.studentEmail,
            studentAvatar: d.studentAvatar,
            degree: d.degree,
            department: d.department,
            honors: d.honors,
            date: d.date,
            mintedDate: d.mintedDate,
            blockNumber: d.blockNumber,
            status: d.status,
            onChainStatus: d.onChainStatus,
            chainName: d.chainName,
            chainId: d.chainId,
            contractAddress: d.contractAddress,
            revocationReason: d.revocationReason,
            revokedAt: d.revokedAt,
            issuer: d.issuer,
            issuerRole: d.issuerRole,
            coSigner: d.coSigner,
            coSignerRole: d.coSignerRole,
            gpa: d.gpa,
            pdfPath: d.pdfPath,
            createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: d.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }

    return this.certificates.get(cleanId);
  }

  public async findByHash(hash: string): Promise<CertificateRecord | undefined> {
    const clean = hash.trim().toLowerCase().replace(/^0x/, '');
    const all = await this.findAll();
    for (const cert of all) {
      const certHashClean = cert.certHash.toLowerCase().replace(/^0x/, '');
      if (certHashClean === clean) return cert;
    }
    return undefined;
  }

  public toPublicVerification(cert: CertificateRecord): PublicVerificationRecord {
    const nameParts = cert.studentName.split(' ');
    const maskedName = nameParts
      .map((part) =>
        part.length <= 2
          ? part
          : `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`
      )
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
      onChainStatus: cert.onChainStatus,
      revocationReason: cert.revocationReason,
      revokedAt: cert.revokedAt,
      certHash: cert.certHash,
      txHash: cert.txHash,
      fullTxHash: cert.fullTxHash,
      chainName: cert.chainName,
      chainId: cert.chainId,
      issuer: cert.issuer,
      issuerRole: cert.issuerRole,
      coSigner: cert.coSigner,
      coSignerRole: cert.coSignerRole,
      studentNameMasked: maskedName,
    };
  }

  public async create(data: Omit<CertificateRecord, 'createdAt' | 'updatedAt'>): Promise<CertificateRecord> {
    const existing = await this.findById(data.id);
    if (existing) {
      throw new Error(`Certificate with ID "${data.id}" already exists.`);
    }

    const now = new Date().toISOString();
    const record: CertificateRecord = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    if (isDbConnected()) {
      try {
        await MongooseCertificate.create({
          certificateId: record.id,
          txHash: record.txHash,
          fullTxHash: record.fullTxHash,
          certHash: record.certHash,
          studentName: record.studentName,
          studentId: record.studentId,
          studentEmail: record.studentEmail,
          degree: record.degree,
          department: record.department,
          honors: record.honors,
          date: record.date,
          mintedDate: record.mintedDate,
          blockNumber: record.blockNumber,
          status: record.status,
          onChainStatus: record.onChainStatus,
          chainName: record.chainName,
          chainId: record.chainId,
          contractAddress: record.contractAddress,
          issuer: record.issuer,
          issuerRole: record.issuerRole,
          coSigner: record.coSigner,
          coSignerRole: record.coSignerRole,
          gpa: record.gpa,
          pdfPath: record.pdfPath,
        });
      } catch (err: unknown) {
        throw new Error((err as Error).message || 'Failed to persist certificate to MongoDB.');
      }
    }

    this.certificates.set(record.id, record);
    return record;
  }

  public async revoke(id: string, reason: string): Promise<CertificateRecord> {
    const cert = await this.findById(id);
    if (!cert) {
      throw new Error(`Certificate with ID "${id}" does not exist.`);
    }

    cert.status = 'Revoked';
    cert.onChainStatus = 'revoked';
    cert.revocationReason = reason;
    cert.revokedAt = new Date().toUTCString();
    cert.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await MongooseCertificate.updateOne(
          { certificateId: cert.id },
          {
            $set: {
              status: 'Revoked',
              onChainStatus: 'revoked',
              revocationReason: reason,
              revokedAt: cert.revokedAt,
            },
          }
        );
      } catch (err) {
        console.warn('[Certificate] MongoDB update failed, updated in memory fallback.', err);
      }
    }

    this.certificates.set(cert.id, cert);
    return cert;
  }

  public async updateAnchor(
    id: string,
    anchorData: {
      txHash: string;
      fullTxHash: string;
      blockNumber: number;
      chainId?: number;
      contractAddress?: string;
    }
  ): Promise<CertificateRecord> {
    const cert = await this.findById(id);
    if (!cert) {
      throw new Error(`Certificate with ID "${id}" does not exist.`);
    }

    cert.txHash = anchorData.txHash;
    cert.fullTxHash = anchorData.fullTxHash;
    cert.blockNumber = anchorData.blockNumber;
    cert.onChainStatus = 'confirmed';
    if (anchorData.chainId) cert.chainId = anchorData.chainId;
    if (anchorData.contractAddress) cert.contractAddress = anchorData.contractAddress;
    cert.updatedAt = new Date().toISOString();

    if (isDbConnected()) {
      try {
        await MongooseCertificate.updateOne(
          { certificateId: cert.id },
          {
            $set: {
              txHash: cert.txHash,
              fullTxHash: cert.fullTxHash,
              blockNumber: cert.blockNumber,
              onChainStatus: 'confirmed',
              chainId: cert.chainId,
              contractAddress: cert.contractAddress,
            },
          }
        );
      } catch (err) {
        console.warn('[Certificate] MongoDB update failed, updated in memory fallback.', err);
      }
    }

    this.certificates.set(cert.id, cert);
    return cert;
  }
}

export const certificateModel = new CertificateRepository();
