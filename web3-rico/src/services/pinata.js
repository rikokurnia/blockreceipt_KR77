// src/services/pinata.js

// Konfigurasi Pinata
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
const JWT = import.meta.env.VITE_PINATA_JWT; // 🔥 Ambil JWT dari ENV

// Fungsi untuk upload file ke Pinata
export const uploadFileToPinata = async (file) => {
    if (!JWT) {
        throw new Error("Pinata JWT is missing in environment variables.");
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(PINATA_API_URL, {
            method: 'POST',
            // 🔥 AUTHENTIKASI MENGGUNAKAN JWT BEARER TOKEN
            headers: {
                'Authorization': `Bearer ${JWT}`, 
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Pinata Server Error:", errorData);
            throw new Error(`Pinata upload failed (Status ${response.status}): ${errorData.error}`);
        }

        const result = await response.json();
        return {
            cid: result.IpfsHash,
            url: `${GATEWAY_URL}${result.IpfsHash}`,
            size: result.PinSize,
        };
    } catch (error) {
        console.error("Pinata Service Error:", error);
        throw error;
    }
};

// Fungsi helper untuk mendapatkan URL dari CID
export const getPinataFileUrl = (cid) => {
    if (!cid) return null;
    return `${GATEWAY_URL}${cid}`;
};

// Catatan: Jika Anda belum mengintegrasikan fungsi uploadFileToPinata
// di UploadReceipt.jsx, Anda harus melakukannya untuk menyimpan CID di DB.