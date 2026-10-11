import type { Certificate, ActivityEvent, Signer, User, VerificationLog } from '../types';

// Clearly labeled test fixtures matching Stitch design and academic credentials
export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Dr. Evelyn Vance',
    email: 'evance@stanford.edu',
    role: 'admin',
    title: 'University Registrar & Custodian',
    institution: 'Stanford University',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChga8XlZMBMFXzAarFoDTwKkV0Ve3vxa2tW3qw1uW-6YS3sgfRPjBBU9WULILiubbOx1oLerO6QeLUBdaDiL2T0diCbvfKQ2SXJKUkzfqaiUm-wM_SmW8AYEztxVHVvaxvnii8uiSCjGLvlUBuK_-XEOui2ptFxFIzPb_HanovQr7wERY8cdQUvEtTX7aAdXFExdOh3Z5OgoHt0R2lzuTA-O44c9tbHx7FOXdiqV6SAoy47wggY34'
  },
  student: {
    id: 'usr-student-1',
    name: 'Elena Rostova',
    email: 'erostova@stanford.edu',
    role: 'student',
    title: 'Graduate Student (Alumna)',
    institution: 'Stanford University',
    studentId: 'SU-2020-0492',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDadtvbsucyAMzVJ8X5970rftwWdBf2qS14Qv5mrcUYVjHGCDnaR8ZbwYV2w_2cX60Q5r9dtQRfkZR3qR72F25Cd8uBDz3WzEUcyToES38NZOXKZrgrMVy6hiIpEO_E_5zU080e63Xi8rVH---aYxDZ97RcRtuFXX8HtH9QtXDZcR1mNuuprCLRJxCrpDwpZGs7g6eUT9mS6fePhGeGJrzYcX4lKfrpG-zhA1N2PV2My1j7wziWZfw'
  },
  authority: {
    id: 'usr-auth-1',
    name: 'Dr. Aris Thorne',
    email: 'athorne@chea-board.gov',
    role: 'authority',
    title: 'Chief Accreditation Auditor',
    institution: 'Council for Higher Education Accreditation (CHEA)',
  },
  verifier: {
    id: 'usr-verifier-1',
    name: 'Sarah Chen',
    email: 'schen@google.com',
    role: 'verifier',
    title: 'Senior Technical Recruiter',
    institution: 'Google HR Global',
  },
  validator: {
    id: 'usr-verifier-1',
    name: 'Sarah Chen',
    email: 'schen@google.com',
    role: 'validator',
    title: 'Senior Technical Recruiter & Credentials Validator',
    institution: 'Google HR Global',
  },
  university_admin: {
    id: 'usr-admin-1',
    name: 'Dr. Evelyn Vance',
    email: 'evance@stanford.edu',
    role: 'university_admin',
    title: 'University Registrar & Custodian',
    institution: 'Stanford University',
  }
};

export const INITIAL_CERTIFICATES: Certificate[] = [
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
    merkleRoot: "0x82b451ae94921ca9473b18538ef82c0b4931a2ff43bc13579abef32948b8319d",
    ipfsCid: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    issuer: "Dr. Evelyn Vance",
    issuerRole: "University Registrar & Custodian",
    coSigner: "Prof. Julian Thorpe",
    coSignerRole: "Dean of Academic Affairs",
    gpa: "3.98 / 4.00"
  },
  {
    id: "CERT-2024-8840",
    txHash: "0x82a1...bc19",
    fullTxHash: "0x82a1b94c39185a7384218db493cbfa104829fa756184029bc48028f849bc1932",
    certHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    studentName: "Marcus Vance",
    studentId: "SU-2021-1184",
    studentEmail: "mvance@law.stanford.edu",
    studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1whtyv5qjrUdg9pvyzX04_0qhdtMAnd9y0-kBTBLSsahc2rgihWVoVlL5VSbDclTujFpkeolbyA4F-JSDGeoHZPnGof35UnlHFcp26vnpp3uLpsAIeE7-4vaWJR5WC5iCYKYL0G7crF4FZH6j1R7t_Sc2dVooMQ3CIRlARDnuOapG9ZVzdveGG4hfmimR__q4f1B4I9xw2QT5KGXJXCxB1eyUrw5tWvLYNX9eoNTcNSAZ-4feiMA",
    degree: "Juris Doctor (J.D.) - Stanford Law",
    department: "Stanford Law School",
    honors: "Order of the Coif",
    date: "Mar 14, 2024",
    mintedDate: "Mar 14, 2024, 14:15:02 UTC",
    blockNumber: 19842084,
    status: "Verified",
    merkleRoot: "0x82b451ae94921ca9473b18538ef82c0b4931a2ff43bc13579abef32948b8319d",
    ipfsCid: "ipfs://bafybeihpk36d6mff5s75mwh52a6n4l6l3v2rvy2aox72efj23bdfg6k6ry",
    issuer: "Dr. Evelyn Vance",
    issuerRole: "University Registrar & Custodian",
    coSigner: "Prof. Jenny Martinez",
    coSignerRole: "Dean of Stanford Law School",
    gpa: "3.91 / 4.00"
  },
  {
    id: "CERT-2024-8839",
    txHash: "0x28bc...45fe",
    fullTxHash: "0x28bc45fe82049102947192bcfa829402931057483920193850193850193845fe",
    certHash: "c2a9386c478a8731518f9e6d0d58852df85966986e689bf94faef1420713180e",
    studentName: "Dr. Aisha Patel",
    studentId: "SU-2018-0914",
    studentEmail: "apatel@med.stanford.edu",
    studentAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCSmdjNOZgfGXa-q6dkDJOOX8McmgSVYgLpFB-kTI7YxveP3jsFpoflXyVuOl53JshPbTXGYslrwXA6i4iP-Bcn1A8XrEQUdvnXrHArIUJyZyuUFVzKY1dQuVAyg5cCpgSoNtflBqAIbl9ekF4mtm07f_DviSzhF5o0eaP7GlGXIkRGMGuK-9W5LWOHVbl9e-7GpTnImeUTkrG7mhmwEv-ZXGRF51Vz9cQ3Ex-NeXz9GhJ84B9NmIg",
    degree: "Doctor of Medicine (M.D.) - Clinical Oncology",
    department: "School of Medicine",
    honors: "Distinction in Research",
    date: "Mar 14, 2024",
    mintedDate: "Epoch #412 Queued (Pending Consensus)",
    blockNumber: 19842109,
    status: "Pending",
    merkleRoot: "Pending Root Calculation",
    ipfsCid: "ipfs://bafybeifk4v8d9p0m4x89u6y4e8b3q2w1z0a9s8d7f6g5h4j3k2l1m0n9o8",
    issuer: "Dr. Evelyn Vance",
    issuerRole: "University Registrar & Custodian",
    coSigner: "Dr. Lloyd Minor",
    coSignerRole: "Dean of School of Medicine",
    gpa: "3.95 / 4.00"
  },
  {
    id: "CERT-2024-8838",
    txHash: "0x1f99...3aa2",
    fullTxHash: "0x1f998492049281a94829472019384bcf92819384019284019284019283aa2019",
    certHash: "59f635f7959092bfeb73c09b6ce8a95687ab2994406ccae9df9cf721cb24d29e",
    studentName: "Taro Takahashi",
    studentId: "SU-2020-5512",
    studentEmail: "ttakahashi@stanford.edu",
    studentInitials: "TK",
    degree: "B.A. in Economics & Quantitative Finance",
    department: "School of Humanities and Sciences",
    honors: "Departmental Honors",
    date: "Mar 13, 2024",
    mintedDate: "Mar 13, 2024, 18:44:20 UTC",
    blockNumber: 19839410,
    status: "Verified",
    merkleRoot: "0x74a2b9183921ca9473b18538ef82c0b4931a2ff43bc13579abef32948b8399e2",
    ipfsCid: "ipfs://bafybeicb7g4h8j2k1m0n9o8p7q6r5s4t3u2v1w0x9y8z7a6b5c4d3e2f1g",
    issuer: "Dr. Evelyn Vance",
    issuerRole: "University Registrar & Custodian",
    coSigner: "Prof. Debra Satz",
    coSignerRole: "Dean of Humanities and Sciences",
    gpa: "3.84 / 4.00"
  },
  {
    id: "CERT-2024-8830",
    txHash: "0xfa12...992b",
    fullTxHash: "0xfa12948201948201948201948201948201948201948201948201948201992bb1",
    certHash: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    studentName: "Jonathan Sterling",
    studentId: "SU-2019-3310",
    studentEmail: "jsterling@stanford.edu",
    studentInitials: "JS",
    degree: "Master of Business Administration (MBA)",
    department: "Stanford Graduate School of Business",
    honors: "Arjay Miller Scholar",
    date: "Mar 10, 2024",
    mintedDate: "Mar 10, 2024, 11:20:44 UTC",
    blockNumber: 19825400,
    status: "Revoked",
    revocationReason: "Disciplinary sanctions and degree nullification confirmed by Academic Senate.",
    revokedAt: "Mar 11, 2024, 09:15:00 UTC",
    merkleRoot: "0x11e451ae94921ca9473b18538ef82c0b4931a2ff43bc13579abef32948b81234",
    ipfsCid: "ipfs://bafybeia2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7",
    issuer: "Dr. Evelyn Vance",
    issuerRole: "University Registrar & Custodian",
    coSigner: "Prof. Jonathan Levin",
    coSignerRole: "Dean of Stanford GSB",
    gpa: "3.72 / 4.00"
  }
];

export const LIVE_ACTIVITY_STREAM: ActivityEvent[] = [
  {
    id: "evt-1",
    type: "batch_mint",
    title: "Batch Mint #411: 45 Diplomas",
    description: "School of Engineering diplomas committed on-chain.",
    timeAgo: "24 blocks ago",
    txHash: "0x9a3e...11c4",
    gasCost: "Gas: $1.12",
    subText: "School of Engineering",
    status: "Confirmed",
    icon: "layers",
    iconColor: "text-primary"
  },
  {
    id: "evt-2",
    type: "verification",
    title: "Third-Party Verification",
    description: "Google HR EMEA queried #CERT-2023-1192 via ZK-Snark proof.",
    timeAgo: "3m ago",
    subText: "Zero-Knowledge Proof verified (ZK-Snark)",
    status: "Valid",
    icon: "verified",
    iconColor: "text-primary"
  },
  {
    id: "evt-3",
    type: "merkle_anchor",
    title: "Degree Merkle Root Anchor",
    description: "State transition accepted by 14 validators on Ethereum Mainnet.",
    timeAgo: "18m ago",
    txHash: "0x3f12...b908",
    subText: "State transition accepted by 14 validators",
    status: "Confirmed",
    icon: "account_tree",
    iconColor: "text-secondary"
  },
  {
    id: "evt-4",
    type: "qr_scan",
    title: "Public QR Scan Attestation",
    description: "McKinsey & Company Tokyo Office verified candidate diploma.",
    timeAgo: "42m ago",
    subText: "Valid Nonce Match · 0.42s latency",
    status: "Valid Nonce Match",
    icon: "qr_code_2",
    iconColor: "text-primary"
  }
];

export const SIGNERS_LIST: Signer[] = [
  {
    id: "sig-1",
    name: "Dr. Evelyn Vance",
    role: "University Registrar",
    status: "Signed",
    timestamp: "Mar 14, 2024 · 09:30 AM"
  },
  {
    id: "sig-2",
    name: "Prof. Julian Thorpe",
    role: "Dean of Academic Affairs",
    status: "Signed",
    timestamp: "Mar 14, 2024 · 11:15 AM"
  },
  {
    id: "sig-3",
    name: "Hon. Clara Morales",
    role: "University General Counsel",
    status: "Awaiting Sig"
  }
];

export const VERIFICATION_LOGS: VerificationLog[] = [
  {
    id: "vlog-101",
    certId: "CERT-2024-8841",
    studentName: "Elena Rostova",
    verifier: "Google HR EMEA (Zurich, Switzerland)",
    method: "ZK-SNARK Proof",
    result: "Valid",
    latency: "340ms",
    timestamp: "3 minutes ago",
    location: "Zurich, CH"
  },
  {
    id: "vlog-102",
    certId: "CERT-2024-8838",
    studentName: "Taro Takahashi",
    verifier: "McKinsey & Company Tokyo Office",
    method: "Public QR Scan",
    result: "Valid",
    latency: "420ms",
    timestamp: "42 minutes ago",
    location: "Tokyo, JP"
  },
  {
    id: "vlog-103",
    certId: "CERT-2024-8840",
    studentName: "Marcus Vance",
    verifier: "Cravath, Swaine & Moore LLP",
    method: "Direct RPC Call",
    result: "Valid",
    latency: "210ms",
    timestamp: "2 hours ago",
    location: "New York, USA"
  },
  {
    id: "vlog-104",
    certId: "CERT-2024-8830",
    studentName: "Jonathan Sterling",
    verifier: "Goldman Sachs Asset Management",
    method: "API Registry",
    result: "Revoked",
    latency: "190ms",
    timestamp: "5 hours ago",
    location: "London, UK"
  }
];
