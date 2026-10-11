import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Ensure private storage directory exists
if (!fs.existsSync(env.STORAGE_DIR)) {
  fs.mkdirSync(env.STORAGE_DIR, { recursive: true });
}

// Disk storage for authenticated issuance and archival
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate secure random UUID filename to defeat path traversal and collisions
    const safeId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${safeId}${ext}`);
  },
});

// Memory storage for ephemeral candidate PDF verification
const memoryStorage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Reject non-PDF MIME types
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF documents (.pdf) are permitted.'));
  }
  // Reject suspicious filenames
  if (!file.originalname.toLowerCase().endsWith('.pdf')) {
    return cb(new Error('File name must end with .pdf.'));
  }
  cb(null, true);
};

export const uploadDisk = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

/**
 * Validates PDF Magic Number (%PDF-) to prevent polyglot / renamed malicious files.
 */
export function validatePdfMagicBytes(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;
  if (!file) {
    return next();
  }

  try {
    let headerBytes: Buffer;
    if (file.buffer) {
      headerBytes = file.buffer.subarray(0, 5);
    } else if (file.path) {
      const fd = fs.openSync(file.path, 'r');
      headerBytes = Buffer.alloc(5);
      fs.readSync(fd, headerBytes, 0, 5, 0);
      fs.closeSync(fd);
    } else {
      return next();
    }

    // Check %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    const headerStr = headerBytes.toString('ascii');
    if (!headerStr.startsWith('%PDF')) {
      // Clean up unsafe file if on disk
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(400).json({
        error: 'Invalid File',
        message: 'Security validation failed: File does not contain valid PDF magic headers (%PDF-).',
      });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({
      error: 'Upload Error',
      message: 'Failed to inspect file integrity header.',
    });
  }
}
