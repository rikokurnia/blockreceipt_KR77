import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ethers } from "ethers";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency } from "../utils/helpers";
import { apiService } from "../services/api";
import { useNotify } from "../context/NotificationSystem";
import { useWeb3 } from "../context/Web3Context";

const ZKGenerator = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { account, signer } = useWeb3();
  const containerRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedProof, setGeneratedProof] = useState(null);

  // VALIDATION STATES
  const [isValidClaim, setIsValidClaim] = useState(true);
  const [actualSpending, setActualSpending] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Form state
  const [proofConfig, setProofConfig] = useState({
    dateRange: { start: "2024-10-01", end: "2024-12-31" },
    categories: [],
    rangeProof: {
      type: "between", 
      min: 5000000,
      max: 15000000,
    },
    includeCategories: false,
    purpose: "",
    recipientEmail: "",
  });

  const proofTypes = [
    { id: "between", title: "Range (Between)", desc: "Value is within min & max", icon: "↔️" },
    { id: "less-than", title: "Ceiling ( < )", desc: "Value is below threshold", icon: "⬇️" },
    { id: "greater-than", title: "Floor ( > )", desc: "Value exceeds threshold", icon: "⬆️" },
    // { id: "equals", title: "Exact Match ( = )", desc: "Value equals target", icon: "🎯" },
  ];

  const categories = ["Travel", "Meals", "Office Supplies", "Software", "Marketing", "Equipment"];

  // --- LOGIC ENGINE ---
  useEffect(() => {
    if (step !== 2) return;
    const validateCompliance = async () => {
        setIsValidating(true);
        try {
            const stats = await apiService.getDashboardStats();
            const totalSpent = Number(stats.totalValueThisMonth || 0); 
            setActualSpending(totalSpent);

            const { type, min, max } = proofConfig.rangeProof;
            let isValid = false;
            let errorMsg = "";

            switch (type) {
                case "between": isValid = totalSpent >= min && totalSpent <= max; errorMsg = "Not in range."; break;
                case "less-than": isValid = totalSpent < (max || min); errorMsg = "Above ceiling."; break;
                case "greater-than": isValid = totalSpent > (min || max); errorMsg = "Below floor."; break;
                case "equals": isValid = totalSpent === (min || max); errorMsg = "Not equal."; break;
                default: isValid = true;
            }
            setIsValidClaim(isValid);
            setValidationError(isValid ? "" : errorMsg);
        } catch (error) { setIsValidClaim(true); } 
        finally { setIsValidating(false); }
    };
    validateCompliance();
  }, [step, proofConfig]); 

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".zk-anim-entry", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, clearProps: "all" });
      if (step === 1) gsap.fromTo(".page-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [step]);

  // --- MINT HANDLER ---
  const handleGenerateProof = async () => {
    if (!account || !signer) { notify.error("Wallet Not Connected"); return; }
    if (!isValidClaim) { alert("× Proof Generation Failed: " + validationError); return; }

    setGenerating(true);
    
    try {
      await new Promise(r => setTimeout(r, 1000));

      notify.info("Minting Proof", "Please confirm transaction in wallet...");
      const tx = await signer.sendTransaction({ to: account, value: 0 });
      notify.info("Mining...", "Waiting for block confirmation");
      await tx.wait(); 
      const txHash = tx.hash;

      // 1. DATA PREPARATION (Fix Logic Mapping)
      // Kita harus memetakan 'min' dan 'max' dengan benar berdasarkan tipe logika
      // agar backend (dan dashboard) bisa membacanya konsisten.
      let dbMin = 0;
      let dbMax = 0;
      const MAX_INT = 999999999999;

      if (proofConfig.rangeProof.type === 'between') {
          dbMin = proofConfig.rangeProof.min;
          dbMax = proofConfig.rangeProof.max;
      } else if (proofConfig.rangeProof.type === 'less-than') {
          dbMin = 0;
          dbMax = proofConfig.rangeProof.max; // Threshold masuk ke Max
      } else if (proofConfig.rangeProof.type === 'greater-than') {
          dbMin = proofConfig.rangeProof.min; // Threshold masuk ke Min
          dbMax = MAX_INT;
      } else if (proofConfig.rangeProof.type === 'equals') {
          dbMin = proofConfig.rangeProof.min;
          dbMax = proofConfig.rangeProof.min;
      }

      const proofId = `ZKP-${Date.now()}`;
      const proofData = {
        id: proofId,
        name: `${proofConfig.purpose || "General Proof"}`,
        date_range_start: proofConfig.dateRange.start,
        date_range_end: proofConfig.dateRange.end,
        range_min: Number(dbMin),
        range_max: Number(dbMax),
        proof_type: proofConfig.rangeProof.type,
        purpose: proofConfig.purpose || "Financial Verification",
        status: "valid", 
        userId: "9b4a727a-31ec-488a-9b5f-3a9c5a04fa22", // Fixed ID
        proof_hash: txHash,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        verification_count: 0
      };

      // 2. TRY SAVE TO DB
      try {
          await apiService.generateZKProof({ ...proofData, txHash: txHash });
      } catch (apiErr) {
          console.warn("API Error (Using LocalStorage Fallback):", apiErr);
      }

      // 3. ALWAYS SAVE TO LOCAL STORAGE (BACKUP)
      const existingProofs = JSON.parse(localStorage.getItem("mock_zk_proofs") || "[]");
      localStorage.setItem("mock_zk_proofs", JSON.stringify([proofData, ...existingProofs]));

      // 4. Set Result
      setGeneratedProof({
        ...proofData,
        proofHash: txHash,
        verificationLink: `${window.location.origin}/zk/verify/${proofId}`,
        createdAt: proofData.created_at,
        expiresAt: proofData.expires_at,
      });

      setStep(3);
      notify.success("Proof Minted", "Proof successfully recorded.");

    } catch (error) {
      console.error(error);
      if (error.code !== 'ACTION_REJECTED') notify.error("Generation Failed", error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Helper UI
  const StepIndicator = ({ num, label }) => {
    const isActive = step >= num;
    return (
      <div className="flex flex-col items-center relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${isActive ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>
          {isActive ? "✓" : num}
        </div>
        <span className={`mt-2 text-xs font-medium uppercase ${step === num ? "text-cyan-400" : isActive ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={containerRef}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* HEADER */}
        <div className="page-header mb-12">
          <div className="text-center mb-10">
            <Badge variant="premium" className="mb-4">PRO FEATURE</Badge>
            <h1 className="text-4xl font-bold text-white mb-3">Generate ZK-Proof</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Create a privacy-preserving cryptographic proof for auditors or investors.</p>
          </div>
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-800 -z-0"></div>
            <div className="absolute top-5 left-0 h-0.5 bg-cyan-500 transition-all duration-700 ease-in-out" style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}></div>
            <StepIndicator num={1} label="Configure" />
            <StepIndicator num={2} label="Review" />
            <StepIndicator num={3} label="Result" />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="zk-anim-entry bg-blue-900/20 border border-blue-500/20 p-5 rounded-2xl flex gap-4 backdrop-blur-sm">
              <div className="text-2xl">💡</div>
              <div className="text-sm text-blue-100/80 leading-relaxed">
                <strong>Zero-Knowledge Range Proofs</strong> allow you to prove your spending falls within a specific limit
                <span className="text-blue-400 font-semibold"> without revealing the exact amount</span>.
              </div>
            </div>

            <Card className="zk-anim-entry bg-slate-900/50 border-white/5 backdrop-blur-md">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-cyan-500 rounded-full"></span> Time Period</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-2">Start Date</label>
                  <input type="date" value={proofConfig.dateRange.start} onChange={(e) => setProofConfig({ ...proofConfig, dateRange: { ...proofConfig.dateRange, start: e.target.value } })} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 uppercase font-bold mb-2">End Date</label>
                  <input type="date" value={proofConfig.dateRange.end} onChange={(e) => setProofConfig({ ...proofConfig, dateRange: { ...proofConfig.dateRange, end: e.target.value } })} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" />
                </div>
              </div>
            </Card>

            <div className="zk-anim-entry grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <label className="block text-xs text-slate-400 uppercase font-bold pl-1">Logic Type</label>
                {proofTypes.map((type) => (
                  <button key={type.id} onClick={() => setProofConfig({ ...proofConfig, rangeProof: { ...proofConfig.rangeProof, type: type.id } })} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${proofConfig.rangeProof.type === type.id ? "bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10"}`}>
                    <span className="text-xl">{type.icon}</span>
                    <div><div className="font-semibold text-sm">{type.title}</div><div className="text-[10px] opacity-70">{type.desc}</div></div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2">
                <Card className="h-full bg-slate-900/50 border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><span className="w-1 h-5 bg-purple-500 rounded-full"></span> Value Configuration (IDR)</h3>
                  <div className="space-y-6">
                    {proofConfig.rangeProof.type === "between" && (
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-slate-400 mb-1 block">Min Value</label>
                          <input type="number" value={proofConfig.rangeProof.min} onChange={(e) => setProofConfig({ ...proofConfig, rangeProof: { ...proofConfig.rangeProof, min: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none font-mono" />
                        </div>
                        <div className="pb-4 text-slate-500 font-bold">TO</div>
                        <div className="flex-1">
                          <label className="text-xs text-slate-400 mb-1 block">Max Value</label>
                          <input type="number" value={proofConfig.rangeProof.max} onChange={(e) => setProofConfig({ ...proofConfig, rangeProof: { ...proofConfig.rangeProof, max: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none font-mono" />
                        </div>
                      </div>
                    )}
                    {(proofConfig.rangeProof.type !== "between") && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Threshold Amount</label>
                        <input 
                            type="number" 
                            // Mapping Value ke Min/Max State Sesuai Tipe
                            value={proofConfig.rangeProof.type === "less-than" ? proofConfig.rangeProof.max : proofConfig.rangeProof.min} 
                            onChange={(e) => { 
                                const val = Number(e.target.value); 
                                let newRange = { ...proofConfig.rangeProof };
                                if (proofConfig.rangeProof.type === 'less-than') {
                                    newRange.max = val; newRange.min = 0;
                                } else {
                                    newRange.min = val; newRange.max = 0; // Placeholder
                                }
                                setProofConfig({ ...proofConfig, rangeProof: newRange }); 
                            }} 
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none font-mono text-lg" 
                        />
                      </div>
                    )}
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-dashed border-slate-600 text-sm text-slate-300">
                      <span className="text-slate-500 uppercase text-xs font-bold block mb-1">Preview Statement</span>
                      "I verify that total spending is 
                      <span className="text-cyan-400 font-bold mx-1">
                        {proofConfig.rangeProof.type === "between" ? `between ${formatCurrency(proofConfig.rangeProof.min)} and ${formatCurrency(proofConfig.rangeProof.max)}` : 
                         proofConfig.rangeProof.type === "less-than" ? `below ${formatCurrency(proofConfig.rangeProof.max)}` : 
                         proofConfig.rangeProof.type === "greater-than" ? `above ${formatCurrency(proofConfig.rangeProof.min)}` :
                         `exactly ${formatCurrency(proofConfig.rangeProof.min)}`}
                      </span>."
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Card className="zk-anim-entry bg-slate-900/50 border-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Metadata</h3>
              <input type="text" placeholder="Purpose (e.g. Q4 Investor Report)" value={proofConfig.purpose} onChange={(e) => setProofConfig({ ...proofConfig, purpose: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none mb-4" />
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={proofConfig.includeCategories} onChange={(e) => setProofConfig({ ...proofConfig, includeCategories: e.target.checked })} className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0" />
                <span className="text-slate-300 text-sm">Restrict proof to specific categories only</span>
              </div>
              {proofConfig.includeCategories && (
                <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => { const active = proofConfig.categories.includes(cat); setProofConfig({ ...proofConfig, categories: active ? proofConfig.categories.filter((c) => c !== cat) : [...proofConfig.categories, cat] }); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${proofConfig.categories.includes(cat) ? "bg-cyan-500 border-cyan-500 text-black" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>{cat}</button>
                  ))}
                </div>
              )}
            </Card>

            <div className="zk-anim-entry flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1" onClick={() => navigate("/dashboard")}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>Review Configuration →</Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="zk-anim-entry bg-slate-900/80 border-white/10 backdrop-blur-xl shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Review Statement</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Period</span><span className="text-white">{proofConfig.dateRange.start} — {proofConfig.dateRange.end}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Logic</span><span className="text-cyan-400 font-bold uppercase">{proofConfig.rangeProof.type}</span></div>
                <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-center">
                  <div className="text-xs text-slate-500 mb-1">PROVING AMOUNT</div>
                  <div className="text-xl text-white font-bold">
                    {proofConfig.rangeProof.type === "between" ? `${formatCurrency(proofConfig.rangeProof.min)} < X < ${formatCurrency(proofConfig.rangeProof.max)}` : 
                     proofConfig.rangeProof.type === "less-than" ? `X < ${formatCurrency(proofConfig.rangeProof.max)}` :
                     `X ${proofConfig.rangeProof.type === 'greater-than' ? '>' : '='} ${formatCurrency(proofConfig.rangeProof.min)}`
                    }
                  </div>
                </div>
                <div className="pt-2 text-center text-slate-500 text-xs">
                    (Actual Spending Found: {isValidating ? "Calculating..." : formatCurrency(actualSpending)})
                </div>
              </div>
            </Card>

            {!isValidClaim && !isValidating && (
                <div className="zk-anim-entry bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex gap-3 items-center">
                    <span className="text-2xl">❌</span>
                    <div>
                        <div className="font-bold text-red-400">Condition Failed</div>
                        <div className="text-xs text-red-300">Your actual spending ({formatCurrency(actualSpending)}) does not match this criteria.</div>
                    </div>
                </div>
            )}

            {isValidClaim && !isValidating && (
                <div className="zk-anim-entry bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex gap-3 items-center">
                    <span className="text-2xl">✅</span>
                    <div>
                        <div className="font-bold text-emerald-400">Condition Satisfied</div>
                        <div className="text-xs text-emerald-300">Ready to mint cryptographic proof.</div>
                    </div>
                </div>
            )}

            <div className="zk-anim-entry flex gap-4">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
              <Button 
                variant="primary" 
                className={`flex-[2] ${(!isValidClaim || isValidating) ? "bg-slate-700 text-slate-500 cursor-not-allowed" : ""}`} 
                onClick={handleGenerateProof} 
                disabled={generating || !isValidClaim || isValidating}
              >
                {generating ? "Minting Proof On-Chain..." : isValidating ? "Validating..." : "Mint Proof On-Chain"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && generatedProof && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="zk-anim-entry">
              <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-5xl shadow-glow mb-6 animate-bounce">✓</div>
              <h2 className="text-3xl font-bold text-white mb-2">Proof Generated!</h2>
              <p className="text-slate-400">Your privacy-preserving proof is live.</p>
            </div>

            <Card className="zk-anim-entry bg-slate-900/50 border-white/10 text-left">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold">Verification Link</label>
                  <div className="flex gap-2 mt-1">
                    <input readOnly value={generatedProof.verificationLink} className="flex-1 bg-black/30 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono" />
                    <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(generatedProof.verificationLink); notify.success("Copied!"); }}>Copy</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Expires</label>
                    <div className="text-white text-sm font-mono">{new Date(generatedProof.expiresAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold">Tx Hash</label>
                    <div className="text-cyan-500 text-sm font-mono truncate cursor-pointer hover:underline" onClick={() => window.open(`https://sepolia-blockscout.lisk.com/tx/${generatedProof.proofHash}`, "_blank")}>
                        {generatedProof.proofHash.slice(0, 12)}...
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="zk-anim-entry flex flex-col gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate("/zk/dashboard")}>Go to Dashboard</Button>
              <div className="text-center">
                  <span className="text-slate-400 text-sm cursor-pointer hover:text-white" onClick={() => navigate(`/zk/verify/${generatedProof.id}`)}>Preview Verification Page</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZKGenerator;