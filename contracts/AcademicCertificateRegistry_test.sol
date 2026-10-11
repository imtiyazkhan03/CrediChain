// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AcademicCertificateRegistry.sol";

/**
 * @title AcademicCertificateRegistryTest
 * @notice Remix IDE & EVM-compatible Unit Test Suite for CertiChain Phase 3
 * @dev Tests all required security invariants:
 *      1. Valid certificate issuance and verification
 *      2. Prevention of duplicate certificate IDs
 *      3. Rejection of unauthorized issuers
 *      4. Rejection of empty/invalid IDs or null hashes
 *      5. Successful revocation by authorized administrators
 *      6. Prevention of repeated/redundant revocation (irreversibility)
 *      7. Rejection of unauthorized administrative operations
 */

/// @dev Helper attacker/unauthorized actor contract
contract UnauthorizedActor {
    function tryIssue(
        AcademicCertificateRegistry registry,
        string calldata certId,
        bytes32 docHash
    ) external returns (bool success) {
        try registry.issueCertificate(certId, docHash) {
            return true;
        } catch {
            return false;
        }
    }

    function tryRevoke(
        AcademicCertificateRegistry registry,
        string calldata certId,
        uint16 reasonCode,
        bytes32 reasonRef
    ) external returns (bool success) {
        try registry.revokeCertificate(certId, reasonCode, reasonRef) {
            return true;
        } catch {
            return false;
        }
    }

    function tryAuthorizeIssuer(
        AcademicCertificateRegistry registry,
        address issuer
    ) external returns (bool success) {
        try registry.authorizeIssuer(issuer) {
            return true;
        } catch {
            return false;
        }
    }
}

contract AcademicCertificateRegistryTest {
    AcademicCertificateRegistry private registry;
    UnauthorizedActor private rogueActor;

    // Sample test fixtures
    string private constant SAMPLE_ID_1 = "CERT-2024-8841";
    string private constant SAMPLE_ID_2 = "CERT-2024-9902";
    bytes32 private constant SAMPLE_HASH_1 = 0x5a2d091b6cf4a413d4b68e98bc01d5ea4789df0b6fb89cf65ecb37a1122a688b;
    bytes32 private constant SAMPLE_HASH_2 = 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08;
    bytes32 private constant DOCKET_REF = 0x3ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4e;

    // Events to assist test debugging
    event TestPassed(string testName);

    /// @dev Setup hook executed prior to tests
    function beforeEach() public {
        registry = new AcademicCertificateRegistry();
        rogueActor = new UnauthorizedActor();
    }

    // =========================================================================
    // TEST 1: Valid Issuance and Read Verification
    // =========================================================================
    function testValidIssuance() public {
        beforeEach();

        // 1. Issue certificate as deployer (deployer is default admin & authorized issuer)
        registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);

        // 2. Query minimal public verification data
        (bool isValid, bool isRevoked, address issuer, uint64 issuedAt) = 
            registry.verifyCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);

        require(isValid == true, "TEST FAIL: Certificate should be valid");
        require(isRevoked == false, "TEST FAIL: Certificate should not be revoked");
        require(issuer == address(this), "TEST FAIL: Issuer should match deployer");
        require(issuedAt > 0, "TEST FAIL: Issuance timestamp should be recorded");

        // 3. Verify mismatch candidate hash returns isValid == false
        (bool invalidCandidate, , , ) = registry.verifyCertificate(SAMPLE_ID_1, SAMPLE_HASH_2);
        require(invalidCandidate == false, "TEST FAIL: Mismatched hash must not be valid");

        // 4. Verify certificateExists helper
        require(registry.certificateExists(SAMPLE_ID_1) == true, "TEST FAIL: Certificate should exist");
        require(registry.certificateExists("NON-EXISTENT") == false, "TEST FAIL: Non-existent ID should return false");

        emit TestPassed("testValidIssuance");
    }

    // =========================================================================
    // TEST 2: Duplicate IDs Prevention
    // =========================================================================
    function testDuplicateIds() public {
        beforeEach();

        // 1. First issuance succeeds
        registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);

        // 2. Second issuance with identical certId must revert
        bool duplicateReverted = false;
        try registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_2) {
            duplicateReverted = false;
        } catch {
            duplicateReverted = true;
        }

        require(duplicateReverted == true, "TEST FAIL: Registering duplicate certId must revert");
        emit TestPassed("testDuplicateIds");
    }

    // =========================================================================
    // TEST 3: Unauthorized Issuer Rejection
    // =========================================================================
    function testUnauthorizedIssuers() public {
        beforeEach();

        // Rogue actor is NOT in isAuthorizedIssuer mapping
        bool issueSuccess = rogueActor.tryIssue(registry, SAMPLE_ID_2, SAMPLE_HASH_2);
        require(issueSuccess == false, "TEST FAIL: Unauthorized actor must not be allowed to issue");

        // Now authorize the rogue actor
        registry.authorizeIssuer(address(rogueActor));
        require(registry.isAuthorizedIssuer(address(rogueActor)) == true, "TEST FAIL: Actor should be authorized");

        // Authorized actor issuance should now succeed
        issueSuccess = rogueActor.tryIssue(registry, SAMPLE_ID_2, SAMPLE_HASH_2);
        require(issueSuccess == true, "TEST FAIL: Authorized issuer must be able to issue");

        // Deauthorize and ensure they cannot issue again
        registry.deauthorizeIssuer(address(rogueActor));
        bool secondIssue = rogueActor.tryIssue(registry, "CERT-NEW-01", SAMPLE_HASH_1);
        require(secondIssue == false, "TEST FAIL: Deauthorized issuer must not issue");

        emit TestPassed("testUnauthorizedIssuers");
    }

    // =========================================================================
    // TEST 4: Invalid IDs and Empty Hash Rejection
    // =========================================================================
    function testInvalidIdsAndHashes() public {
        beforeEach();

        // 1. Empty certificate ID must revert
        bool emptyIdReverted = false;
        try registry.issueCertificate("", SAMPLE_HASH_1) {
            emptyIdReverted = false;
        } catch {
            emptyIdReverted = true;
        }
        require(emptyIdReverted == true, "TEST FAIL: Empty certificate ID must revert");

        // 2. Null (bytes32(0)) document hash must revert
        bool emptyHashReverted = false;
        try registry.issueCertificate("VALID-ID", bytes32(0)) {
            emptyHashReverted = false;
        } catch {
            emptyHashReverted = true;
        }
        require(emptyHashReverted == true, "TEST FAIL: Zero document hash must revert");

        emit TestPassed("testInvalidIdsAndHashes");
    }

    // =========================================================================
    // TEST 5: Revocation by Authorized Administrator
    // =========================================================================
    function testRevocation() public {
        beforeEach();

        // 1. Issue certificate
        registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);

        // 2. Revoke certificate with reason code (101: Disciplinary Rescission)
        uint16 reasonCode = 101;
        registry.revokeCertificate(SAMPLE_ID_1, reasonCode, DOCKET_REF);

        // 3. Verify public verification data reflects revocation
        (bool isValid, bool isRevoked, , ) = registry.verifyCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);
        require(isValid == false, "TEST FAIL: Revoked certificate must NOT be valid even with matching hash");
        require(isRevoked == true, "TEST FAIL: Certificate isRevoked flag must be true");

        // 4. Verify full on-chain record reflects audit reason
        (, , , bool revokedFlag, uint64 revokedAt, uint16 storedReason, bytes32 storedRef) = 
            registry.getCertificate(SAMPLE_ID_1);

        require(revokedFlag == true, "TEST FAIL: Stored record revokedFlag must be true");
        require(revokedAt > 0, "TEST FAIL: Revocation timestamp must be positive");
        require(storedReason == reasonCode, "TEST FAIL: Reason code must match");
        require(storedRef == DOCKET_REF, "TEST FAIL: Reason docket reference must match");

        emit TestPassed("testRevocation");
    }

    // =========================================================================
    // TEST 6: Repeated Revocation Rejection & Irreversibility
    // =========================================================================
    function testRepeatedRevocation() public {
        beforeEach();

        // 1. Issue and revoke
        registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);
        registry.revokeCertificate(SAMPLE_ID_1, 101, DOCKET_REF);

        // 2. Attempting second revocation on the same ID must revert
        bool secondRevokeReverted = false;
        try registry.revokeCertificate(SAMPLE_ID_1, 102, bytes32(0)) {
            secondRevokeReverted = false;
        } catch {
            secondRevokeReverted = true;
        }
        require(secondRevokeReverted == true, "TEST FAIL: Repeated revocation must revert with CertificateAlreadyRevoked");

        // 3. Attempting to revoke a non-existent certificate must revert
        bool nonExistentReverted = false;
        try registry.revokeCertificate("DOES-NOT-EXIST", 101, bytes32(0)) {
            nonExistentReverted = false;
        } catch {
            nonExistentReverted = true;
        }
        require(nonExistentReverted == true, "TEST FAIL: Revoking non-existent certificate must revert");

        // 4. Zero reason code must revert
        registry.issueCertificate(SAMPLE_ID_2, SAMPLE_HASH_2);
        bool zeroReasonReverted = false;
        try registry.revokeCertificate(SAMPLE_ID_2, 0, bytes32(0)) {
            zeroReasonReverted = false;
        } catch {
            zeroReasonReverted = true;
        }
        require(zeroReasonReverted == true, "TEST FAIL: Revoking with reason code 0 must revert");

        emit TestPassed("testRepeatedRevocation");
    }

    // =========================================================================
    // TEST 7: Unauthorized Administrative Operations
    // =========================================================================
    function testUnauthorizedAdministrativeOperations() public {
        beforeEach();

        registry.issueCertificate(SAMPLE_ID_1, SAMPLE_HASH_1);

        // 1. Rogue actor tries to revoke certificate -> MUST fail
        bool rogueRevoke = rogueActor.tryRevoke(registry, SAMPLE_ID_1, 101, DOCKET_REF);
        require(rogueRevoke == false, "TEST FAIL: Unauthorized actor must not be able to revoke");

        // 2. Rogue actor tries to authorize an issuer -> MUST fail
        bool rogueAuthorize = rogueActor.tryAuthorizeIssuer(registry, address(0x123));
        require(rogueAuthorize == false, "TEST FAIL: Unauthorized actor must not authorize issuers");

        // 3. Administrator tries to remove the last admin -> MUST revert
        bool removeLastAdminReverted = false;
        try registry.removeAdmin(address(this)) {
            removeLastAdminReverted = false;
        } catch {
            removeLastAdminReverted = true;
        }
        require(removeLastAdminReverted == true, "TEST FAIL: Cannot remove the last remaining admin");

        // 4. Adding a second admin allows removal of the first only when safe
        address admin2 = address(0xAA11);
        registry.addAdmin(admin2);
        require(registry.isAdmin(admin2) == true, "TEST FAIL: Second admin should be added");
        require(registry.adminCount() == 2, "TEST FAIL: Admin count should be 2");

        emit TestPassed("testUnauthorizedAdministrativeOperations");
    }

    // =========================================================================
    // Master Runner for EVM environments without test runners
    // =========================================================================
    function runAllTests() external returns (uint8 totalPassed) {
        testValidIssuance();
        testDuplicateIds();
        testUnauthorizedIssuers();
        testInvalidIdsAndHashes();
        testRevocation();
        testRepeatedRevocation();
        testUnauthorizedAdministrativeOperations();
        return 7;
    }
}
