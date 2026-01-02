// src/utils/constants.js

// ==========================================
// 1. SMART CONTRACT ARCHITECTURE (THE SPINE)
// ==========================================

export const CONTRACT_ADDRESSES = {
  DAILY_LIMIT_MANAGER: "0xcFec1FedEb151CEb23c0E1062468Eff28c8C6195",
  PURCHASE_AGREEMENT_MANAGER: "0x855499Cf21CB94b9Ee3F1b2B7d60457572e7e6c3",
  FRAUD_DETECTION: "0x734038A097D7E34e74C6d4B38B99FfdD9d6fbb55",
  ZK_INVOICE_VERIFIER: "0x1267b7E2DAA65Ad6B9a0Ae3951b4af4b6e53fE1F",
  INVOICE_VERIFICATION: "0x980e46c1Ec1621a48c7F577e1c5C6A2DBB89CC58", // Enhanced Logic
  HONK_VERIFIER: "0x9E7C8251F45C881D42957042224055d32445805C",
};

// Human-Readable ABI (Minimal interfaces to interact with contracts)
export const CONTRACT_ABIS = {
  DAILY_LIMIT_MANAGER: [
    "function setCategoryLimit(string categoryName, uint256 dailyLimit)",
    "function getCurrentDaySpending(string categoryName) view returns (uint256)",
    "function checkLimitAvailable(string categoryName, uint256 amount) view returns (bool)",
    "function categoryLimits(string) view returns (string, uint256, uint256, uint256, bool)",
    "event DailyLimitSet(string category, uint256 limit, address setBy)",
    "event DailyLimitExceeded(string category, uint256 attemptedAmount, uint256 limit)",
  ],
  PURCHASE_AGREEMENT_MANAGER: [
    "function createAgreementDraft(string agreementId, address vendor, string vendorName, string category, string item, string specs, uint256 price, uint256 qty, uint256 start, uint256 end, string terms, string docHash)",
    "function cfoApproveAgreement(string agreementId)",
    "function getAgreementDetails(string agreementId) view returns (tuple(string agreementId, address vendorAddress, string vendorName, string category, string itemName, uint256 pricePerUnit, uint256 totalQuantity, uint256 remainingQuantity, bool isActive, bool cfoApproved))",
    "function agreementIds(uint256) view returns (string)",
    "event AgreementCreated(string agreementId, address createdBy)",
    "event CFOApproved(string agreementId, address cfo)",
  ],
  INVOICE_VERIFICATION: [
    "function submitInvoice(string invoiceId, string agreementId, string invoiceNum, uint256 date, uint256 deliveryDate, uint256 qty, uint256 price, uint256 milestone, string scanHash, string deliveryHash, string[] photoHashes)",
    "function validateInvoice(string invoiceId) returns (bool, string[])",
    "function cfoApproveInvoice(string invoiceId, string reason)",
    "function getInvoiceStatus(string invoiceId) view returns (tuple(string invoiceId, string status, uint256 totalAmount, bool isFraudulent))",
    "event InvoiceSubmitted(string invoiceId, string agreementId)",
    "event InvoiceApprovedByCFO(string invoiceId, address cfo)",
  ],
  FRAUD_DETECTION: [
    "function getFraudAlerts() view returns (tuple(uint256 alertId, string invoiceId, address submittedBy, string fraudType, uint256 expectedValue, uint256 submittedValue)[])",
    "function markAsInvestigated(uint256 alertId, string notes)",
    "event FraudDetected(uint256 alertId, string invoiceId, address submittedBy, string fraudType)",
  ],
  ZK_INVOICE_VERIFIER: [
    "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
  ],
};

// ==========================================
// 2. APP CONFIGURATION
// ==========================================

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  NETWORK_NAME: "Lisk Sepolia Testnet",
  CHAIN_ID: 4202, // Lisk Sepolia
  RPC_URL: "https://rpc.sepolia-api.lisk.com",
  EXPLORER_URL: "https://sepolia-blockscout.lisk.com",
  CURRENCY: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
};

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
  ALLOWED_EXTENSIONS: ["pdf", "jpg", "jpeg", "png"],
};

// Receipt Categories (Must match Contract Categories)
export const RECEIPT_CATEGORIES = [
  { value: "Electronics", label: "Electronics" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Travel", label: "Travel & Transportation" },
  { value: "Meals", label: "Meals & Entertainment" },
  { value: "Software", label: "Software & Subscriptions" },
  { value: "Marketing", label: "Marketing & Advertising" },
  { value: "Utilities", label: "Utilities & Services" },
  { value: "Other", label: "Other Expenses" },
];

// Processing Steps
export const PROCESSING_STEPS = [
  {
    id: "upload",
    label: "File Upload",
    description: "Uploading receipt to server",
  },
  {
    id: "extraction",
    label: "AI Extraction",
    description: "Extracting data from receipt",
  },
  {
    id: "ipfs",
    label: "IPFS Storage",
    description: "Storing file on IPFS network",
  },
  {
    id: "blockchain",
    label: "Blockchain Recording",
    description: "Recording proof on blockchain",
  },
  {
    id: "finalize",
    label: "Database Update",
    description: "Finalizing transaction",
  },
];

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic",
    price: 0,
    priceLabel: "Free",
    features: [
      { text: "50 receipts per month", included: true },
      { text: "AI extraction", included: true },
      { text: "Blockchain verification", included: true },
      { text: "IPFS storage", included: true },
      { text: "Basic dashboard", included: true },
      { text: "ZK-Range proofs", included: false },
      { text: "Advanced reports", included: false },
      { text: "API access", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  pro: {
    name: "Pro",
    price: 99,
    priceLabel: "$99/month",
    features: [
      { text: "Unlimited receipts", included: true },
      { text: "Enhanced AI extraction", included: true },
      { text: "Priority blockchain verification", included: true },
      { text: "Priority IPFS storage", included: true },
      { text: "Advanced dashboard & analytics", included: true },
      { text: "ZK-Range proofs", included: true, highlight: true },
      { text: "Advanced reports (PDF, Excel, JSON)", included: true },
      { text: "Full API access", included: true },
      { text: "24/7 priority support", included: true },
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
};

// Wallet Types
export const WALLET_TYPES = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect with MetaMask wallet",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    description: "Scan QR code with mobile wallet",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    description: "Connect with Coinbase Wallet",
  },
];

// User Roles
export const USER_ROLES = [
  {
    id: "auditor",
    name: "Auditor",
    icon: "📋",
    description: "Upload and verify receipts",
    route: "/upload",
  },
  {
    id: "cfo",
    name: "CFO",
    icon: "💼",
    description: "View dashboard & generate reports",
    route: "/dashboard",
  },
];

// API Endpoints
export const API_ENDPOINTS = {
  UPLOAD_RECEIPT: "/api/receipts/upload",
  GET_RECEIPT: "/api/receipts/:id",
  LIST_RECEIPTS: "/api/receipts",
  PROCESS_RECEIPT: "/api/receipts/:id/process",
};

// Animation Durations (in seconds)
export const ANIMATION_DURATION = {
  FAST: 0.3,
  NORMAL: 0.5,
  SLOW: 0.8,
  VERY_SLOW: 1.2,
};

// Toast Messages
export const TOAST_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected successfully",
  WALLET_DISCONNECTED: "Wallet disconnected",
  UPLOAD_SUCCESS: "Receipt uploaded successfully",
  UPLOAD_ERROR: "Failed to upload receipt",
  PROCESSING_ERROR: "Error processing receipt",
  COPY_SUCCESS: "Copied to clipboard",
  TX_PENDING: "Transaction pending...",
  TX_SUCCESS: "Transaction successful!",
  TX_FAILED: "Transaction failed",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: "wallet_address",
  USER_ROLE: "user_role",
  SUBSCRIPTION_PLAN: "subscription_plan",
  RECENT_RECEIPTS: "recent_receipts",
};

// Feature Highlights for Landing Page
export const FEATURE_HIGHLIGHTS = [
  {
    icon: "Shield",
    title: "Blockchain Immutability",
    description:
      "Every receipt is permanently recorded on Lisk blockchain, ensuring tamper-proof audit trails.",
  },
  {
    icon: "Cpu",
    title: "AI-Powered Extraction",
    description:
      "Advanced AI automatically extracts vendor, amount, date, and category from receipts.",
  },
  {
    icon: "Database",
    title: "IPFS Decentralized Storage",
    description:
      "Original files stored on IPFS network for permanent, distributed access.",
  },
  {
    icon: "Lock",
    title: "Zero-Knowledge Proofs",
    description:
      "Generate ZK-Range proofs for compliance without revealing sensitive amounts (Pro only).",
  },
];

// How It Works Steps
export const HOW_IT_WORKS_STEPS = [
  {
    number: 1,
    title: "Upload Receipt",
    description: "Connect wallet and upload receipt image or PDF",
    icon: "Upload",
  },
  {
    number: 2,
    title: "Blockchain Verification",
    description: "AI extracts data and records proof on blockchain",
    icon: "Blocks",
  },
  {
    number: 3,
    title: "Generate Reports",
    description: "Access dashboard and generate compliance reports",
    icon: "FileText",
  },
];

export default {
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  BLOCKCHAIN_CONFIG,
  FILE_CONFIG,
  RECEIPT_CATEGORIES,
  PROCESSING_STEPS,
  SUBSCRIPTION_PLANS,
  WALLET_TYPES,
  USER_ROLES,
  API_ENDPOINTS,
  ANIMATION_DURATION,
  TOAST_MESSAGES,
  STORAGE_KEYS,
  FEATURE_HIGHLIGHTS,
  HOW_IT_WORKS_STEPS,
};