const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AcademicCertificateRegistry Contract Tests", function () {
  let registry;
  let owner;
  let admin2;
  let issuer1;
  let unauthorizedUser;
  let student;

  const SAMPLE_CERT_ID_1 = "CERT-2024-8841";
  const SAMPLE_CERT_ID_2 = "CERT-2023-1092";
  const SAMPLE_HASH_1 = "0x5a2d091b6cf4a413d4b68e98bc01d5ea4789df0b6fb89cf65ecb37a1122a688b";
  const SAMPLE_HASH_2 = "0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
  const DOCKET_REF = "0x3ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4e";

  beforeEach(async function () {
    [owner, admin2, issuer1, unauthorizedUser, student] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("AcademicCertificateRegistry");
    registry = await RegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("Initial State & RBAC", function () {
    it("should set deployer as owner, initial admin, and initial authorized issuer", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.isAdmin(owner.address)).to.be.true;
      expect(await registry.isAuthorizedIssuer(owner.address)).to.be.true;
      expect(await registry.adminCount()).to.equal(1n);
    });

    it("should allow admin to authorize a new issuer and emit event", async function () {
      await expect(registry.connect(owner).authorizeIssuer(issuer1.address))
        .to.emit(registry, "IssuerAuthorizationChanged")
        .withArgs(issuer1.address, true, owner.address);

      expect(await registry.isAuthorizedIssuer(issuer1.address)).to.be.true;
    });

    it("should prevent authorizing zero address as issuer", async function () {
      await expect(
        registry.connect(owner).authorizeIssuer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(registry, "InvalidZeroAddress");
    });
  });

  describe("Requirement 1: Valid Issuance & Read-Only Public Verification", function () {
    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address);
    });

    it("should allow authorized issuer to issue a certificate and emit CertificateIssued", async function () {
      await expect(
        registry.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1)
      )
        .to.emit(registry, "CertificateIssued")
        .withArgs(SAMPLE_CERT_ID_1, SAMPLE_CERT_ID_1, SAMPLE_HASH_1, issuer1.address, (val) => val > 0n);

      expect(await registry.totalIssued()).to.equal(1n);
      expect(await registry.certificateExists(SAMPLE_CERT_ID_1)).to.be.true;
    });

    it("should allow anyone to read public verification data", async function () {
      await registry.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

      // Call verification from unauthenticated / arbitrary user
      const [isValid, isRevoked, issuer, issuedAt] = await registry
        .connect(unauthorizedUser)
        .verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
      expect(issuer).to.equal(issuer1.address);
      expect(issuedAt).to.be.greaterThan(0n);
    });

    it("should return isValid == false when candidate hash does not match document hash", async function () {
      await registry.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

      const [isValid, isRevoked] = await registry
        .connect(unauthorizedUser)
        .verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_2);

      expect(isValid).to.be.false;
      expect(isRevoked).to.be.false;
    });

    it("should allow reading full non-PII certificate details via getCertificate", async function () {
      await registry.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

      const cert = await registry.getCertificate(SAMPLE_CERT_ID_1);
      expect(cert.documentHash).to.equal(SAMPLE_HASH_1);
      expect(cert.issuer).to.equal(issuer1.address);
      expect(cert.isRevoked).to.be.false;
      expect(cert.revokedAt).to.equal(0n);
      expect(cert.reasonCode).to.equal(0);
      expect(cert.reasonRef).to.equal(ethers.ZeroHash);
    });
  });

  describe("Requirement 2: Duplicate IDs Prevention", function () {
    it("should revert with CertificateAlreadyExists if certificate ID is registered twice", async function () {
      await registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);

      await expect(
        registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_2)
      )
        .to.be.revertedWithCustomError(registry, "CertificateAlreadyExists")
        .withArgs(SAMPLE_CERT_ID_1);
    });
  });

  describe("Requirement 3: Unauthorized Issuer Rejection", function () {
    it("should revert with IssuerNotAuthorized if caller is not an authorized issuer", async function () {
      expect(await registry.isAuthorizedIssuer(unauthorizedUser.address)).to.be.false;

      await expect(
        registry.connect(unauthorizedUser).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1)
      )
        .to.be.revertedWithCustomError(registry, "IssuerNotAuthorized")
        .withArgs(unauthorizedUser.address);
    });

    it("should disallow deauthorized issuer from issuing certificates", async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address);
      await registry.connect(owner).deauthorizeIssuer(issuer1.address);

      await expect(
        registry.connect(issuer1).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1)
      )
        .to.be.revertedWithCustomError(registry, "IssuerNotAuthorized")
        .withArgs(issuer1.address);
    });
  });

  describe("Requirement 4: Invalid IDs and Document Hashes", function () {
    it("should revert with InvalidCertificateId when certId is empty string", async function () {
      await expect(
        registry.connect(owner).issueCertificate("", SAMPLE_HASH_1)
      ).to.be.revertedWithCustomError(registry, "InvalidCertificateId");
    });

    it("should revert with InvalidDocumentHash when documentHash is bytes32(0)", async function () {
      await expect(
        registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(registry, "InvalidDocumentHash");
    });
  });

  describe("Requirement 5: Revocation by Authorized Administrator", function () {
    beforeEach(async function () {
      await registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
    });

    it("should allow administrator to revoke a certificate and emit CertificateRevoked", async function () {
      const reasonCode = 101; // e.g., Academic Rescission / Fraud

      await expect(
        registry.connect(owner).revokeCertificate(SAMPLE_CERT_ID_1, reasonCode, DOCKET_REF)
      )
        .to.emit(registry, "CertificateRevoked")
        .withArgs(SAMPLE_CERT_ID_1, SAMPLE_CERT_ID_1, owner.address, (val) => val > 0n, reasonCode, DOCKET_REF);

      expect(await registry.totalRevoked()).to.equal(1n);

      // Verify public verification status reflects revocation
      const [isValid, isRevoked] = await registry.verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;

      // Verify on-chain record details
      const cert = await registry.getCertificate(SAMPLE_CERT_ID_1);
      expect(cert.isRevoked).to.be.true;
      expect(cert.revokedAt).to.be.greaterThan(0n);
      expect(cert.reasonCode).to.equal(reasonCode);
      expect(cert.reasonRef).to.equal(DOCKET_REF);
    });

    it("should revert with CertificateDoesNotExist when revoking non-existent ID", async function () {
      await expect(
        registry.connect(owner).revokeCertificate("NON-EXISTENT", 101, ethers.ZeroHash)
      )
        .to.be.revertedWithCustomError(registry, "CertificateDoesNotExist")
        .withArgs("NON-EXISTENT");
    });

    it("should revert with InvalidReasonCode when reasonCode is 0", async function () {
      await expect(
        registry.connect(owner).revokeCertificate(SAMPLE_CERT_ID_1, 0, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(registry, "InvalidReasonCode");
    });
  });

  describe("Requirement 6: Repeated Revocation Rejection & Irreversibility", function () {
    beforeEach(async function () {
      await registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
      await registry.connect(owner).revokeCertificate(SAMPLE_CERT_ID_1, 101, DOCKET_REF);
    });

    it("should revert with CertificateAlreadyRevoked when revoking an already revoked certificate", async function () {
      await expect(
        registry.connect(owner).revokeCertificate(SAMPLE_CERT_ID_1, 102, ethers.ZeroHash)
      )
        .to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked")
        .withArgs(SAMPLE_CERT_ID_1);
    });

    it("should maintain irreversible revoked status permanently", async function () {
      const cert = await registry.getCertificate(SAMPLE_CERT_ID_1);
      expect(cert.isRevoked).to.be.true;

      const [isValid, isRevoked] = await registry.verifyCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
      expect(isValid).to.be.false;
      expect(isRevoked).to.be.true;
    });
  });

  describe("Requirement 7: Unauthorized Administrative Operations", function () {
    beforeEach(async function () {
      await registry.connect(owner).issueCertificate(SAMPLE_CERT_ID_1, SAMPLE_HASH_1);
    });

    it("should revert with UnauthorizedAdmin if non-admin tries to revoke certificate", async function () {
      await expect(
        registry.connect(unauthorizedUser).revokeCertificate(SAMPLE_CERT_ID_1, 101, ethers.ZeroHash)
      )
        .to.be.revertedWithCustomError(registry, "UnauthorizedAdmin")
        .withArgs(unauthorizedUser.address);
    });

    it("should revert with UnauthorizedAdmin if non-admin tries to authorize issuer", async function () {
      await expect(
        registry.connect(unauthorizedUser).authorizeIssuer(student.address)
      )
        .to.be.revertedWithCustomError(registry, "UnauthorizedAdmin")
        .withArgs(unauthorizedUser.address);
    });

    it("should revert with UnauthorizedAdmin if non-admin tries to add another admin", async function () {
      await expect(
        registry.connect(unauthorizedUser).addAdmin(student.address)
      )
        .to.be.revertedWithCustomError(registry, "UnauthorizedAdmin")
        .withArgs(unauthorizedUser.address);
    });

    it("should revert with CannotRemoveLastAdmin when attempting to remove the sole admin", async function () {
      await expect(
        registry.connect(owner).removeAdmin(owner.address)
      ).to.be.revertedWithCustomError(registry, "CannotRemoveLastAdmin");
    });

    it("should allow adding and removing secondary admin safely", async function () {
      await registry.connect(owner).addAdmin(admin2.address);
      expect(await registry.isAdmin(admin2.address)).to.be.true;
      expect(await registry.adminCount()).to.equal(2n);

      // Now removing secondary admin is permitted
      await registry.connect(owner).removeAdmin(admin2.address);
      expect(await registry.isAdmin(admin2.address)).to.be.false;
      expect(await registry.adminCount()).to.equal(1n);
    });
  });
});
