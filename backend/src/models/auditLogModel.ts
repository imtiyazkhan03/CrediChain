import mongoose, { Schema, type Document } from 'mongoose';
import { isDbConnected } from '../config/db.js';

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_REVOKED'
  | 'USER_CREATED'
  | 'USER_REGISTERED'
  | 'PASSWORD_RESET'
  | 'UNAUTHORIZED_ACCESS';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  actorEmail: string;
  actorRole: string;
  targetId?: string;
  ipAddress?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface IAuditLogDocument extends Document {
  eventType: AuditEventType;
  actorEmail: string;
  actorRole: string;
  targetId?: string;
  ipAddress?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'CERTIFICATE_ISSUED',
        'CERTIFICATE_REVOKED',
        'USER_CREATED',
        'USER_REGISTERED',
        'PASSWORD_RESET',
        'UNAUTHORIZED_ACCESS',
      ],
      index: true,
    },
    actorEmail: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    targetId: { type: String },
    ipAddress: { type: String },
    details: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Mongoose Model
export const MongooseAuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);

// In-Memory Fallback Store with auto-seeding
class AuditLogRepository {
  private inMemoryLogs: AuditLogItem[] = [];

  constructor() {
    this.seedInitialLogs();
  }

  private seedInitialLogs() {
    this.inMemoryLogs = [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: 'LOGIN_SUCCESS',
        actorEmail: 'evance@stanford.edu',
        actorRole: 'university_admin',
        ipAddress: '127.0.0.1',
        details: 'University registrar session established.',
        status: 'SUCCESS',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'CERTIFICATE_ISSUED',
        actorEmail: 'evance@stanford.edu',
        actorRole: 'university_admin',
        targetId: 'CERT-2024-8841',
        ipAddress: '127.0.0.1',
        details: 'Issued M.S. in Computer Science to Elena Rostova (SU-2020-0492).',
        status: 'SUCCESS',
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        eventType: 'CERTIFICATE_REVOKED',
        actorEmail: 'evance@stanford.edu',
        actorRole: 'university_admin',
        targetId: 'CERT-2024-8835',
        ipAddress: '127.0.0.1',
        details: 'Revoked Thomas Sterling diploma due to Academic Senate order.',
        status: 'WARNING',
      },
    ];
  }

  public async logEvent(data: {
    eventType: AuditEventType;
    actorEmail: string;
    actorRole: string;
    targetId?: string;
    ipAddress?: string;
    details: string;
    status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  }): Promise<AuditLogItem> {
    const item: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...data,
    };

    if (isDbConnected()) {
      try {
        const doc = await MongooseAuditLog.create({
          eventType: data.eventType,
          actorEmail: data.actorEmail,
          actorRole: data.actorRole,
          targetId: data.targetId,
          ipAddress: data.ipAddress,
          details: data.details,
          status: data.status,
        });
        item.id = doc._id.toString();
      } catch (err) {
        console.warn('[AuditLog] MongoDB save failed, stored in memory fallback.', err);
      }
    }

    this.inMemoryLogs.unshift(item);
    return item;
  }

  public async getRecentLogs(limit = 50): Promise<AuditLogItem[]> {
    if (isDbConnected()) {
      try {
        const docs = await MongooseAuditLog.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return docs.map((d: any) => ({
          id: d._id.toString(),
          timestamp: d.createdAt?.toISOString() || new Date().toISOString(),
          eventType: d.eventType,
          actorEmail: d.actorEmail,
          actorRole: d.actorRole,
          targetId: d.targetId,
          ipAddress: d.ipAddress,
          details: d.details,
          status: d.status,
        }));
      } catch (err) {
        // Fallback to memory
      }
    }

    return this.inMemoryLogs.slice(0, limit);
  }
}

export const auditLogModel = new AuditLogRepository();
