import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Card from "../components/common/Card"; // Asumsikan Card di-import dari common
import { apiService } from "../services/api"; // Import API Service

// --- HELPERS (Ambil dari utils/helpers) ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateString.substring(0, 10);
    }
};
// Asumsikan getExplorerLink ada di helpers.js

const ReceiptDetail = () => {
  const { id: receiptId } = useParams(); // Ambil ID dari URL
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      if (!receiptId) {
          setError("Receipt ID is missing in URL.");
          setLoading(false);
          return;
      }
      try {
        // Panggil endpoint tunggal yang baru kita buat
        const response = await apiService.getSingleReceipt(receiptId); 

        // Map data dari API ke format UI (Menyesuaikan dengan mock data user)
        const mappedData = {
            id: response.id,
            vendor: response.vendor_name,
            total: Number(response.total_amount),
            date: response.receipt_date,
            category: response.category?.name || "General",
            status: response.status.charAt(0).toUpperCase() + response.status.slice(1),
            txHash: response.blockchain_record?.tx_hash || '0xnot-on-chain-yet',
            blockNumber: response.blockchain_record?.block_number || 'N/A',
            ipfsCID: response.ipfs_record?.cid || null,
            items: response.items || [],
            auditor: 'Finance Team', // Mock auditor (karena relasi user-nya kompleks)
            ipfsUrl: response.ipfs_record?.cid ? `https://ipfs.io/ipfs/${response.ipfs_record.cid}` : null, // Link IPFS
            
            // Data untuk UI Summary
            blockchain: {
                txHash: response.blockchain_record?.tx_hash || '0xnot-on-chain-yet',
                explorerUrl: `https://sepolia-blockscout.lisk.com/tx/${response.blockchain_record?.tx_hash}`, // Mock link
            },
            ipfs: {
                url: response.ipfs_record?.cid ? `https://ipfs.io/ipfs/${response.ipfs_record.cid}` : null,
                cid: response.ipfs_record?.cid,
                fileHash: response.ipfs_record?.file_hash
            },
        };

        setData(mappedData);
      } catch (err) {
        console.error(err);
        setError("Error: Receipt not found or server data corruption.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [receiptId]);

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-cyan-500">Loading Audit Data...</div>;
  if (error) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white text-sm mb-4 flex items-center gap-2 transition-colors">
            ← Back to Submissions
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{data.vendor}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                <span>{formatDate(data.date)}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>ID: <span className="font-mono text-slate-300">{data.id}</span></span>
              </div>
            </div>
            <div className="flex gap-3">
              {data.blockchain?.txHash && (
                <a href={data.blockchain.explorerUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20">
                    🔗 View on Lisk
                  </Button>
                </a>
              )}
              <Badge variant={data.status === 'Verified' ? 'success' : 'warning'} size="lg">{data.status}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KIRI: BUKTI GAMBAR (IPFS) */}
          <div className="space-y-6">
            <div className="bg-[#050A14] border border-white/10 rounded-2xl p-2 h-[600px] flex items-center justify-center relative overflow-hidden group">
              {data.ipfs?.url ? (
                <img 
                  src={data.ipfs.url} 
                  alt="Receipt Proof" 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-slate-600">No Image Proof Available (Check IPFS CID)</div>
              )}
              
              {/* Overlay Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">IPFS CID</span>
                  <span className="text-cyan-400 font-mono">{data.ipfs?.cid?.substring(0, 20)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Hash (SHA-256)</span>
                  <span className="text-white font-mono">{data.ipfs?.fileHash?.substring(0, 20)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* KANAN: EKSTRAKSI DATA */}
          <div className="space-y-6">
            {/* Card Total */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10">
              <div className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-1">Grand Total</div>
              <div className="text-4xl font-bold text-white">{formatCurrency(data.total)}</div>
              <div className="mt-4 flex gap-4 text-sm border-t border-white/10 pt-4">
                <div>
                  <span className="block text-slate-500 text-xs">Category</span>
                  <span className="font-medium text-white">{data.category}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs">Uploaded By</span>
                  <span className="font-medium text-white">{data.auditor.substring(0, 10)}...</span>
                </div>
              </div>
            </div>

            {/* Card Line Items */}
            <div className="bg-[#0B1120] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-slate-900/50">
                <h3 className="font-bold text-white">Line Items (AI Extracted)</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{item.description}</td>
                      <td className="px-6 py-4 text-center text-slate-400">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-400">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right text-cyan-400 font-mono">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.items.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">No individual items detected.</div>
              )}
            </div>

            {/* JSON Raw Data (Untuk Developer/Debug) */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <details>
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-white transition-colors">View Raw Blockchain Record</summary>
                <pre className="mt-2 text-[10px] text-green-400 font-mono overflow-x-auto">
                  {data.blockchain?.txHash} / {data.blockchain?.blockNumber}
                </pre>
              </details>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetail;