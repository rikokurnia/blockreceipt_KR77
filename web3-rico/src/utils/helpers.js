import { FILE_CONFIG } from "./constants";

/**
 * Class name helper (like clsx)
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Format wallet address (0x742d...3f8a)
 */
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format transaction hash
 */
export const formatTxHash = (hash) => {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

/**
 * Format IPFS CID
 */
export const formatCID = (cid) => {
  if (!cid) return "";
  if (cid.length <= 15) return cid;
  return `${cid.slice(0, 8)}...${cid.slice(-7)}`;
};

/**
 * Format currency (IDR)
 */
export const formatCurrency = (amount, currency = "IDR") => {
  if (!amount && amount !== 0) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date, format = "full") => {
  if (!date) return "-";

  const d = new Date(date);

  if (format === "full") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  if (format === "short") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  }

  if (format === "time") {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  }

  return d.toISOString().split("T")[0]; // YYYY-MM-DD
};

/**
 * Format timestamp with timezone
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "-";

  const date = new Date(timestamp);
  return `${formatDate(date, "short")} ${formatDate(date, "time")} UTC`;
};

/**
 * Validate file type
 */
export const validateFileType = (file) => {
  if (!file) return { valid: false, message: "No file provided" };

  const fileType = file.type;
  const fileName = file.name;
  const fileExtension = fileName.split(".").pop().toLowerCase();

  if (!FILE_CONFIG.ALLOWED_TYPES.includes(fileType)) {
    return {
      valid: false,
      message: `File type not allowed. Accepted: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      message: `File extension not allowed. Accepted: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
};

/**
 * Validate file size
 */
export const validateFileSize = (file) => {
  if (!file) return { valid: false, message: "No file provided" };

  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return {
      valid: false,
      message: `File too large. Maximum size: ${formatFileSize(
        FILE_CONFIG.MAX_SIZE
      )}`,
    };
  }

  return { valid: true };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return { success: true };
    } catch (err) {
      document.body.removeChild(textArea);
      return { success: false, error: err };
    }
  }
};

/**
 * Generate receipt ID
 */
export const generateReceiptId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `RCP-${year}-${random}`;
};

/**
 * Get explorer link for transaction
 */
export const getExplorerLink = (type, value, explorerUrl) => {
  if (!value) return "#";

  const baseUrl = explorerUrl || "https://sepolia-blockscout.lisk.com";

  switch (type) {
    case "tx":
      return `${baseUrl}/tx/${value}`;
    case "address":
      return `${baseUrl}/address/${value}`;
    case "block":
      return `${baseUrl}/block/${value}`;
    default:
      return baseUrl;
  }
};

/**
 * Get IPFS gateway link
 */
export const getIPFSLink = (cid) => {
  if (!cid) return "#";
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Wait/sleep function
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random hash (for demo)
 */
export const generateMockHash = () => {
  return (
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
  );
};

/**
 * Generate random CID (for demo)
 */
export const generateMockCID = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return (
    "Qm" +
    Array.from(
      { length: 44 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  );
};

/**
 * Simulate AI extraction (for demo)
 */
export const simulateAIExtraction = async (file) => {
  // Simulate processing time
  await sleep(2000);

  // Mock extracted data
  return {
    vendor: "Hotel Mulia Jakarta",
    amount: Math.floor(Math.random() * 5000000) + 500000,
    date: new Date().toISOString().split("T")[0],
    category: "travel",
    confidence: {
      vendor: Math.floor(Math.random() * 10) + 90,
      amount: Math.floor(Math.random() * 5) + 95,
      date: 100,
    },
  };
};
