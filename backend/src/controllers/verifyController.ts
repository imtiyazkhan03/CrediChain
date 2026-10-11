import type { Request, Response } from 'express';
import crypto from 'crypto';
import { certificateModel } from '../models/certificateModel.js';

export async function verifyById(req: Request, res: Response): Promise<void> {
  const { certificateId } = req.params;
  const cleanId = (certificateId || '').trim();

  if (!cleanId) {
    res.status(400).json({
      outcome: 'unknown',
      error: 'Invalid Request',
      message: 'Certificate ID is required for verification.',
    });
    return;
  }

  const cert = await certificateModel.findById(cleanId);
  if (!cert) {
    res.status(404).json({
      outcome: 'unknown',
      certId: cleanId,
      message: `Certificate ID "${cleanId}" was not found in the credentials registry.`,
    });
    return;
  }

  const publicData = certificateModel.toPublicVerification(cert);

  // STRICT INVARIANT: Revocation takes absolute precedence
  if (cert.status === 'Revoked') {
    res.json({
      outcome: 'revoked',
      certId: cert.id,
      certificate: publicData,
      message: `This certificate was permanently revoked by university authorities. Reason: ${cert.revocationReason || 'Administrative decision'}.`,
      revocationDate: cert.revokedAt,
    });
    return;
  }

  res.json({
    outcome: 'verified',
    certId: cert.id,
    certificate: publicData,
    message: 'Credential is registered and active in the institutional registry.',
  });
}

export async function verifyByDocumentFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const certIdParam = req.body?.certificateId || req.query?.certificateId;

  if (!file || !file.buffer) {
    res.status(400).json({
      outcome: 'unavailable',
      error: 'No File Provided',
      message: 'A candidate certificate PDF file must be provided.',
    });
    return;
  }

  // Compute exact SHA-256 over raw file buffer bytes
  const computedHashHex = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const computedHashWithPrefix = `0x${computedHashHex}`;

  // If a Certificate ID was supplied alongside the file
  if (certIdParam && typeof certIdParam === 'string' && certIdParam.trim().length > 0) {
    const cert = await certificateModel.findById(certIdParam.trim());
    if (!cert) {
      res.status(404).json({
        outcome: 'unknown',
        certId: certIdParam.trim(),
        computedHash: computedHashWithPrefix,
        message: `Certificate ID "${certIdParam}" was not found in the registry.`,
      });
      return;
    }

    const publicData = certificateModel.toPublicVerification(cert);

    // INVARIANT: Revocation overrides even matching hash!
    if (cert.status === 'Revoked') {
      res.json({
        outcome: 'revoked',
        certId: cert.id,
        certificate: publicData,
        computedHash: computedHashWithPrefix,
        onChainHash: cert.certHash,
        message: `This certificate was permanently revoked. Revoked status cannot be overridden by document matching.`,
        revocationDate: cert.revokedAt,
      });
      return;
    }

    const cleanOnChain = cert.certHash.toLowerCase().replace(/^0x/, '');
    const cleanComputed = computedHashHex.toLowerCase();

    if (cleanOnChain === cleanComputed) {
      res.json({
        outcome: 'verified',
        certId: cert.id,
        certificate: publicData,
        computedHash: computedHashWithPrefix,
        onChainHash: cert.certHash,
        message: 'Cryptographically authentic. Document SHA-256 matches institutional anchor.',
      });
      return;
    } else {
      res.json({
        outcome: 'altered',
        certId: cert.id,
        certificate: publicData,
        computedHash: computedHashWithPrefix,
        onChainHash: cert.certHash,
        message: 'Tampering detected: The uploaded PDF document bytes do not match the recorded hash for this certificate.',
      });
      return;
    }
  }

  // Lookup certificate purely by document hash
  const certByHash = await certificateModel.findByHash(computedHashHex);
  if (certByHash) {
    const publicData = certificateModel.toPublicVerification(certByHash);

    if (certByHash.status === 'Revoked') {
      res.json({
        outcome: 'revoked',
        certId: certByHash.id,
        certificate: publicData,
        computedHash: computedHashWithPrefix,
        onChainHash: certByHash.certHash,
        message: 'This certificate was permanently revoked by the institution.',
      });
      return;
    }

    res.json({
      outcome: 'verified',
      certId: certByHash.id,
      certificate: publicData,
      computedHash: computedHashWithPrefix,
      onChainHash: certByHash.certHash,
      message: 'Cryptographically authentic. Document SHA-256 matches institutional record.',
    });
    return;
  }

  // Not found by hash
  res.status(404).json({
    outcome: 'unknown',
    computedHash: computedHashWithPrefix,
    message: 'The submitted document hash does not match any registered academic certificate.',
  });
}
