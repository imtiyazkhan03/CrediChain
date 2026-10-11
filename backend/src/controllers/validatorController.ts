import type { Request, Response } from 'express';
import crypto from 'crypto';
import { certificateModel } from '../models/certificateModel.js';
import { auditLogModel } from '../models/auditLogModel.js';

export async function getValidatorDashboard(req: Request, res: Response): Promise<void> {
  const allCerts = await certificateModel.findAll();
  const logs = await auditLogModel.getRecentLogs(10);

  res.json({
    validatorInfo: {
      user: req.user?.name || 'Verified Organization',
      email: req.user?.email || 'validator@org.com',
      role: req.user?.role || 'validator',
    },
    metrics: {
      registeredCredentials: allCerts.length,
      activeCredentials: allCerts.filter((c) => c.status === 'Verified').length,
      revokedCredentials: allCerts.filter((c) => c.status === 'Revoked').length,
      consensusNetwork: 'Ethereum Sepolia (Chain ID: 11155111)',
    },
    recentAudits: logs.filter(
      (l) => l.eventType === 'CERTIFICATE_ISSUED' || l.eventType === 'CERTIFICATE_REVOKED'
    ),
  });
}

export async function verifyCertificateById(req: Request, res: Response): Promise<void> {
  const { certificateId } = req.params;
  const cleanId = (certificateId || '').trim();

  if (!cleanId) {
    res.status(400).json({
      outcome: 'unknown',
      error: 'Invalid Request',
      message: 'Certificate ID is mandatory.',
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

  // STRICT INVARIANT: Revocation takes absolute precedence!
  if (cert.status === 'Revoked') {
    res.json({
      outcome: 'revoked',
      certId: cert.id,
      certificate: publicData,
      message: `This certificate was permanently revoked by university authorities. Reason: ${
        cert.revocationReason || 'Disciplinary proceedings'
      }.`,
      revocationDate: cert.revokedAt,
    });
    return;
  }

  res.json({
    outcome: 'verified',
    certId: cert.id,
    certificate: publicData,
    message: 'Credential is registered, authentic, and active in the institutional registry.',
  });
}

export async function verifyCertificateFile(req: Request, res: Response): Promise<void> {
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

  // Exact binary SHA-256 calculation over raw bytes
  const computedHashHex = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const computedHashWithPrefix = `0x${computedHashHex}`;

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

    // INVARIANT: Revocation strictly overrides matching hash!
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
        message: 'Tampering detected: Document SHA-256 hash differs from on-chain anchor.',
      });
      return;
    }
  }

  // Match purely by document hash
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
        message: 'This certificate was permanently revoked by the university.',
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

  res.status(404).json({
    outcome: 'unknown',
    computedHash: computedHashWithPrefix,
    message: 'The submitted document hash does not match any registered academic certificate.',
  });
}
