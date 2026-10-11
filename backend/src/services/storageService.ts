import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export class StorageService {
  private static ensureDirExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  public static async saveCertificatePdf(certId: string, pdfBuffer: Buffer): Promise<string> {
    this.ensureDirExists(env.STORAGE_DIR);
    const safeFilename = `${certId.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const targetPath = path.join(env.STORAGE_DIR, safeFilename);
    await fs.promises.writeFile(targetPath, pdfBuffer);
    return targetPath;
  }

  public static async getCertificatePdf(filePath: string): Promise<Buffer | null> {
    try {
      if (!fs.existsSync(filePath)) return null;
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  }
}
