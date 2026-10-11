// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AcademicCertificateRegistry
 * @notice CertiChain Phase 3: Tamper-Evident Academic Credential Registry
 * @dev Implements role-based credential issuance, irreversible revocation, and public
 *      trustless verification. Strictly avoids storing student PII, names, IDs, grades,
 *      or PDFs on-chain (only cryptographic document hashes and audit metadata).
 */
contract AcademicCertificateRegistry {
    // =========================================================================
    // STRUCTS & DATA TYPES
    // =========================================================================

    /**
     * @notice Minimal on-chain credential record preserving data privacy.
     * @dev Stored without any personally identifiable information (PII).
     * @param documentHash Cryptographic SHA-256 digest of the normalized off-chain diploma/payload
     * @param issuer Ethereum address of the authorized university registrar who issued the record
     * @param issuedAt Unix timestamp of on-chain registration
     * @param isRevoked Flag indicating permanent, irreversible revocation
     * @param revokedAt Unix timestamp of revocation (0 if currently active)
     * @param reasonCode Categorical non-sensitive reason code (e.g. 101: Disciplinary Rescission)
     * @param reasonRef Optional cryptographic hash of confidential disciplinary proceedings
     */
    struct CertificateRecord {
        bytes32 documentHash;
        address issuer;
        uint64 issuedAt;
        bool isRevoked;
        uint64 revokedAt;
        uint16 reasonCode;
        bytes32 reasonRef;
    }

    // =========================================================================
    // STATE VARIABLES
    // =========================================================================

    /// @notice Contract deployer / root authority
    address public owner;

    /// @notice Total count of active administrators
    uint256 public adminCount;

    /// @notice Total count of certificates registered on-chain
    uint256 public totalIssued;

    /// @notice Total count of certificates revoked on-chain
    uint256 public totalRevoked;

    /// @notice Mapping of administrator addresses
    mapping(address => bool) public isAdmin;

    /// @notice Mapping of authorized university certificate issuers
    mapping(address => bool) public isAuthorizedIssuer;

    /// @notice Primary registry mapping from unique alphanumeric certificate ID to on-chain record
    mapping(string => CertificateRecord) private _certificates;

    // =========================================================================
    // CUSTOM ERRORS (Gas-Efficient Reverts)
    // =========================================================================

    error UnauthorizedAdmin(address caller);
    error IssuerNotAuthorized(address caller);
    error CertificateAlreadyExists(string certId);
    error CertificateDoesNotExist(string certId);
    error CertificateAlreadyRevoked(string certId);
    error InvalidCertificateId();
    error InvalidDocumentHash();
    error InvalidReasonCode();
    error InvalidZeroAddress();
    error CannotRemoveLastAdmin();
    error AdminAlreadyRegistered(address admin);
    error AdminNotRegistered(address admin);
    error IssuerAlreadyAuthorized(address issuer);
    error IssuerNotRegistered(address issuer);

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * @notice Emitted when a certificate is successfully anchored on-chain.
     */
    event CertificateIssued(
        string indexed certIdHash,
        string certId,
        bytes32 indexed documentHash,
        address indexed issuer,
        uint64 issuedAt
    );

    /**
     * @notice Emitted when a certificate is permanently revoked.
     */
    event CertificateRevoked(
        string indexed certIdHash,
        string certId,
        address indexed revokedBy,
        uint64 revokedAt,
        uint16 reasonCode,
        bytes32 reasonRef
    );

    /**
     * @notice Emitted when an issuer's authorization status is updated.
     */
    event IssuerAuthorizationChanged(
        address indexed issuer,
        bool isAuthorized,
        address indexed authorizedBy
    );

    /**
     * @notice Emitted when an administrator is added or removed.
     */
    event AdminStatusChanged(
        address indexed admin,
        bool isEnabled,
        address indexed changedBy
    );

    /**
     * @notice Emitted when contract ownership is transferred.
     */
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) {
            revert UnauthorizedAdmin(msg.sender);
        }
        _;
    }

    modifier onlyIssuer() {
        if (!isAuthorizedIssuer[msg.sender]) {
            revert IssuerNotAuthorized(msg.sender);
        }
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedAdmin(msg.sender);
        }
        _;
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /**
     * @notice Initializes the registry, designating the deployer as owner, initial admin, and initial issuer.
     */
    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
        isAuthorizedIssuer[msg.sender] = true;
        adminCount = 1;

        emit OwnershipTransferred(address(0), msg.sender);
        emit AdminStatusChanged(msg.sender, true, msg.sender);
        emit IssuerAuthorizationChanged(msg.sender, true, msg.sender);
    }

    // =========================================================================
    // ACCESS CONTROL MANAGEMENT (ADMINISTRATIVE)
    // =========================================================================

    /**
     * @notice Authorizes a registrar address to issue academic certificates.
     * @param issuer The wallet address of the registrar/issuer
     */
    function authorizeIssuer(address issuer) external onlyAdmin {
        if (issuer == address(0)) {
            revert InvalidZeroAddress();
        }
        if (isAuthorizedIssuer[issuer]) {
            revert IssuerAlreadyAuthorized(issuer);
        }

        // Checks-Effects
        isAuthorizedIssuer[issuer] = true;

        emit IssuerAuthorizationChanged(issuer, true, msg.sender);
    }

    /**
     * @notice Revokes issuance authority from a registrar address.
     * @param issuer The wallet address to deauthorize
     */
    function deauthorizeIssuer(address issuer) external onlyAdmin {
        if (!isAuthorizedIssuer[issuer]) {
            revert IssuerNotRegistered(issuer);
        }

        // Checks-Effects
        isAuthorizedIssuer[issuer] = false;

        emit IssuerAuthorizationChanged(issuer, false, msg.sender);
    }

    /**
     * @notice Grants administrative oversight privileges to a new address.
     * @param newAdmin The address to grant admin role
     */
    function addAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) {
            revert InvalidZeroAddress();
        }
        if (isAdmin[newAdmin]) {
            revert AdminAlreadyRegistered(newAdmin);
        }

        // Checks-Effects
        isAdmin[newAdmin] = true;
        unchecked {
            adminCount++;
        }

        emit AdminStatusChanged(newAdmin, true, msg.sender);
    }

    /**
     * @notice Revokes administrative privileges from an address.
     * @dev Prevents removing the last remaining administrator.
     * @param admin The address to remove from administrators
     */
    function removeAdmin(address admin) external onlyAdmin {
        if (!isAdmin[admin]) {
            revert AdminNotRegistered(admin);
        }
        if (adminCount <= 1) {
            revert CannotRemoveLastAdmin();
        }

        // Checks-Effects
        isAdmin[admin] = false;
        unchecked {
            adminCount--;
        }

        emit AdminStatusChanged(admin, false, msg.sender);
    }

    /**
     * @notice Transfers ownership of the registry.
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert InvalidZeroAddress();
        }
        address previousOwner = owner;
        owner = newOwner;

        // Ensure new owner is also an admin
        if (!isAdmin[newOwner]) {
            isAdmin[newOwner] = true;
            unchecked {
                adminCount++;
            }
            emit AdminStatusChanged(newOwner, true, msg.sender);
        }

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    // =========================================================================
    // CORE CREDENTIAL REGISTRY FUNCTIONS
    // =========================================================================

    /**
     * @notice Registers a new academic certificate on-chain.
     * @dev Follows Checks-Effects-Interactions pattern. Reverts if ID already exists or hash is empty.
     * @param certId Unique alphanumeric certificate identifier (e.g., "CERT-2024-8841")
     * @param documentHash SHA-256 cryptographic digest of the canonical off-chain credential document
     */
    function issueCertificate(
        string calldata certId,
        bytes32 documentHash
    ) external onlyIssuer {
        // CHECKS
        if (bytes(certId).length == 0) {
            revert InvalidCertificateId();
        }
        if (documentHash == bytes32(0)) {
            revert InvalidDocumentHash();
        }
        if (_certificates[certId].issuedAt != 0) {
            revert CertificateAlreadyExists(certId);
        }

        // EFFECTS
        uint64 timestamp = uint64(block.timestamp);
        _certificates[certId] = CertificateRecord({
            documentHash: documentHash,
            issuer: msg.sender,
            issuedAt: timestamp,
            isRevoked: false,
            revokedAt: 0,
            reasonCode: 0,
            reasonRef: bytes32(0)
        });

        unchecked {
            totalIssued++;
        }

        // EMIT
        emit CertificateIssued(
            certId,
            certId,
            documentHash,
            msg.sender,
            timestamp
        );
    }

    /**
     * @notice Permanently and irreversibly revokes an issued certificate.
     * @dev Only callable by authorized administrators. Cannot be unrevoked.
     * @param certId Unique certificate identifier to revoke
     * @param reasonCode Categorical non-sensitive reason (e.g. 101: Disciplinary Fraud, 102: Administrative Typo)
     * @param reasonRef Cryptographic digest of confidential disciplinary committee docket (or 0)
     */
    function revokeCertificate(
        string calldata certId,
        uint16 reasonCode,
        bytes32 reasonRef
    ) external onlyAdmin {
        // CHECKS
        CertificateRecord storage cert = _certificates[certId];
        if (cert.issuedAt == 0) {
            revert CertificateDoesNotExist(certId);
        }
        if (cert.isRevoked) {
            revert CertificateAlreadyRevoked(certId);
        }
        if (reasonCode == 0) {
            revert InvalidReasonCode();
        }

        // EFFECTS (Permanent & Irreversible)
        uint64 timestamp = uint64(block.timestamp);
        cert.isRevoked = true;
        cert.revokedAt = timestamp;
        cert.reasonCode = reasonCode;
        cert.reasonRef = reasonRef;

        unchecked {
            totalRevoked++;
        }

        // EMIT
        emit CertificateRevoked(
            certId,
            certId,
            msg.sender,
            timestamp,
            reasonCode,
            reasonRef
        );
    }

    // =========================================================================
    // PUBLIC VERIFICATION & INSPECTION (READ-ONLY)
    // =========================================================================

    /**
     * @notice Public trustless verification endpoint.
     * @dev Anyone can invoke this view function to verify a credential against a candidate document hash.
     * @param certId The unique certificate identifier
     * @param candidateHash The SHA-256 hash computed from the candidate diploma PDF/JSON
     * @return isValid True strictly if the certificate exists, matches the candidate hash, and is NOT revoked
     * @return isRevoked True if the certificate was issued but subsequently revoked
     * @return issuer Address of the authorized university registrar
     * @return issuedAt Unix timestamp of issuance
     */
    function verifyCertificate(
        string calldata certId,
        bytes32 candidateHash
    )
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            address issuer,
            uint64 issuedAt
        )
    {
        CertificateRecord storage cert = _certificates[certId];
        if (cert.issuedAt == 0) {
            return (false, false, address(0), 0);
        }

        bool hashMatches = (cert.documentHash == candidateHash);
        isRevoked = cert.isRevoked;
        isValid = (hashMatches && !isRevoked);
        issuer = cert.issuer;
        issuedAt = cert.issuedAt;
    }

    /**
     * @notice Retrieves the full public on-chain record for a certificate ID.
     * @param certId The unique certificate identifier
     * @return documentHash The registered SHA-256 hash
     * @return issuer The authorized registrar who issued it
     * @return issuedAt Unix timestamp of issuance
     * @return isRevoked Whether the credential has been revoked
     * @return revokedAt Unix timestamp of revocation (0 if active)
     * @return reasonCode Categorical reason code (0 if active)
     * @return reasonRef Confidential audit digest (0 if active)
     */
    function getCertificate(
        string calldata certId
    )
        external
        view
        returns (
            bytes32 documentHash,
            address issuer,
            uint64 issuedAt,
            bool isRevoked,
            uint64 revokedAt,
            uint16 reasonCode,
            bytes32 reasonRef
        )
    {
        CertificateRecord storage cert = _certificates[certId];
        if (cert.issuedAt == 0) {
            revert CertificateDoesNotExist(certId);
        }

        return (
            cert.documentHash,
            cert.issuer,
            cert.issuedAt,
            cert.isRevoked,
            cert.revokedAt,
            cert.reasonCode,
            cert.reasonRef
        );
    }

    /**
     * @notice Checks if a certificate ID is already registered in the registry.
     * @param certId Unique certificate identifier
     * @return exists True if the certificate ID is already registered
     */
    function certificateExists(
        string calldata certId
    ) external view returns (bool exists) {
        return _certificates[certId].issuedAt != 0;
    }
}
