// src/utils/formatters.js

/**
 * Format wallet address menjadi bentuk pendek
 * e.g., 0xb0c1...cCf1
 */
export const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * MOCK DATABASE AUDITOR
 * Di production, ganti ini dengan API Call ke backend (Prisma) Anda
 * untuk mengambil nama user berdasarkan wallet address.
 */
const MOCK_USER_DB = {
  "0xD4fBF8cC8dCE27A877baf65fd49461DBF150cf3a": "Lead Auditor",
  "0xd1c46ebdce5d3b84869cc0754735036efea41ca4": "Chief Financial Officer",
  // Tambahkan address wallet dev Anda di sini untuk testing
};

export const getAuditorName = (address) => {
  if (!address) return "Unknown System";
  
  // Normalisasi address ke lowercase/checksum agar match
  const normalizedAddr = address; // Di production sebaiknya .toLowerCase()
  
  // Cek DB
  if (MOCK_USER_DB[normalizedAddr]) {
    return MOCK_USER_DB[normalizedAddr];
  }
  
  // Fallback
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Format timestamp dari Blockchain (BigNumber/Unix) ke Readable Date
 */
export const formatBlockchainDate = (timestamp) => {
  if (!timestamp) return "-";
  // Convert BigNumber to number if necessary, or handling standard unix timestamp
  const date = new Date(Number(timestamp) * 1000); 
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};