import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api";

const ZKDashboard = () => {
  const navigate = useNavigate();
  const [zkProofs, setZkProofs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let allProofs = [];
      
      // 1. Try Fetch API
      try {
        const data = await apiService.getZKProofs();
        allProofs = data.map(p => ({
            id: p.id,
            name: p.name,
            dateRange: { start: p.date_range_start, end: p.date_range_end },
            rangeProof: { min: Number(p.range_min), max: Number(p.range_max) },
            status: p.status, 
            createdAt: p.created_at,
            verificationUrl: `/zk/verify/${p.id}`,
        }));
      } catch (error) {
        console.warn("API Load Failed, using local storage");
      }

      // 2. Merge with Local Storage (Backup)
      const localProofs = JSON.parse(localStorage.getItem("mock_zk_proofs") || "[]");
      const localFormatted = localProofs.map(p => ({
          id: p.id,
          name: p.name,
          dateRange: { start: p.date_range_start, end: p.date_range_end },
          rangeProof: { min: Number(p.range_min), max: Number(p.range_max) },
          status: p.status, 
          createdAt: p.created_at,
          verificationUrl: `/zk/verify/${p.id}`,
      }));

      // Combine & Deduplicate by ID
      const combined = [...localFormatted, ...allProofs].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      
      setZkProofs(combined);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-24">
        <div className="flex justify-between items-end mb-10">
          <h1 className="text-4xl font-bold text-white">ZK Proofs Center</h1>
          <Button variant="primary" onClick={() => navigate("/zk/generate")}>+ Generate Proof</Button>
        </div>

        <div className="space-y-4">
            {zkProofs.map((proof) => (
              <div key={proof.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{proof.name}</h3>
                    <div className="text-sm text-slate-400">
                        {formatDate(proof.dateRange.start)} - {formatDate(proof.dateRange.end)} • 
                        <span className="text-cyan-400 ml-2">{formatCurrency(proof.rangeProof.min)} - {formatCurrency(proof.rangeProof.max)}</span>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + proof.verificationUrl); alert("Copied!"); }}>Copy Link</Button>
              </div>
            ))}
            {zkProofs.length === 0 && <div className="text-center text-slate-500 py-10">No proofs generated yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default ZKDashboard;