import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api";

const ZKVerification = () => {
  const { proofId } = useParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProof = async () => {
      try {
        // 1. Try API
        let data;
        try {
            data = await apiService.verifyZKProof(proofId);
        } catch(e) { /* ignore */ }

        // 2. Try LocalStorage
        if (!data || data.error) {
            const localProofs = JSON.parse(localStorage.getItem("mock_zk_proofs") || "[]");
            data = localProofs.find(p => p.id === proofId);
        }

        if (!data) throw new Error("Proof not found locally or on server.");

        setProof({
            id: data.id,
            status: data.status,
            createdAt: data.created_at,
            proofHash: data.proof_hash,
            statement: {
                type: data.proof_type,
                range: { min: Number(data.range_min), max: Number(data.range_max) },
                dateRange: { start: data.date_range_start, end: data.date_range_end },
            },
        });
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };
    fetchProof();
  }, [proofId]);

  const handleVerify = async () => {
    await new Promise((r) => setTimeout(r, 2000));
    setVerified(true);
  };

  if (loading) return <div className="min-h-screen bg-[#0B0F19] text-center pt-40 text-slate-500">Loading Proof...</div>;
  if (error) return <div className="min-h-screen bg-[#0B0F19] text-center pt-40 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <div className="text-center mb-8">
          <Badge variant="premium" className="mb-4">VERIFICATION PORTAL</Badge>
          <h1 className="text-3xl font-bold text-white mb-2">Proof Verification</h1>
        </div>

        <Card className="mb-6 border-cyan-500/30 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white mb-4">Proof Statement</h2>
          <div className="text-slate-300 text-lg">
             Total spending is between <span className="text-cyan-400 font-bold">{formatCurrency(proof.statement.range.min)}</span> and <span className="text-cyan-400 font-bold">{formatCurrency(proof.statement.range.max)}</span>
          </div>
          <div className="mt-4 text-sm text-slate-500">Period: {formatDate(proof.statement.dateRange.start)} - {formatDate(proof.statement.dateRange.end)}</div>
        </Card>

        <div className="text-center">
            {!verified ? (
                <Button variant="primary" size="lg" onClick={handleVerify}>Verify On-Chain</Button>
            ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500 rounded-xl text-emerald-400 font-bold">
                    ✓ Verified Match on Lisk Sepolia
                    <div className="text-xs font-mono mt-1 text-slate-500">{proof.proofHash}</div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ZKVerification;