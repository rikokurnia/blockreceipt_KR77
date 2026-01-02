// src/services/api.js

const API_BASE_URL =
  "https://web3-receipt-backend-production.up.railway.app/api";

const fetchData = async (endpoint) => {
  try {
    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      // Jika respons bukan JSON (misal: halaman HTML error), lempar error
      const text = await response.text();
      try {
        const jsonError = JSON.parse(text);
        throw new Error(jsonError.error || "Network response was not ok");
      } catch (e) {
        // Ini akan menangkap error SyntaxError jika responsnya bukan JSON
        console.error("Received non-JSON response:", text);
        throw new Error("Server returned a non-JSON response.");
      }
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error; // Lempar ulang error agar bisa ditangkap di UI
  }
};

export const apiService = {
  // Ambil Data Master untuk Dropdown
  getVendors: () => fetchData("/vendors"),
  getCategories: () => fetchData("/categories"),

  // Dashboard & List
  getAgreements: () => fetchData("/agreements"),

  getDashboardStats: () => fetchData("/stats"),
  getRecentInvoices: () => fetchData("/receipts/recent"),
  getAllReceipts: () => fetchData("/receipts"),

  //   getCFOApprovals: () => fetchData("/cfo/approvals"),

  // UPDATE: Support Role (default cfo, tapi temanmu bisa kirim 'vendor')
  getApprovals: (role = "cfo") => fetchData(`/approvals?role=${role}`),

  getZKProofs: () => fetchData("/zk/proofs"),

  verifyZKProof: (id) => fetchData(`/zk/verify/${id}`),

  getDailyLimits: () => fetchData("/limits"),

  getCFOApprovals: () => fetchData("/approvals?role=cfo"), // <-- PENTING: pakai query param

  getSingleAgreement: (id) => fetchData(`/agreements/${id}`),

  // TAMBAHKAN INI:
  submitReceipt: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to submit receipt");
      return result;
    } catch (error) {
      console.error("Error submitting receipt:", error);
      throw error;
    }
  },

  // Create Agreement Baru
  createAgreement: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agreements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create");
      return result;
    } catch (error) {
      console.error("Error submitting agreement:", error);
      throw error;
    }
  },

  submitAction: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("Action Error:", error);
      throw error;
    }
  },

  generateZKProof: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/zk/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Proof generation failed");
      return result;
    } catch (error) {
      console.error("ZK Gen Error:", error);
      throw error;
    }
  },

  updateDailyLimit: async (categoryId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/limits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, amount }),
      });
      return await response.json();
    } catch (error) {
      console.error("Update Limit Error:", error);
      throw error;
    }
  },

  generateReportData: async (filters) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      return await response.json();
    } catch (error) {
      console.error("Report API Error:", error);
      throw error;
    }
  },
};
