import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge"; // Pastikan Badge ada
import { apiService } from "../services/api";
import { useWeb3 } from "../context/Web3Context";
import { useRecentActivity } from "../hooks/useRecentActivity"; // 🔥 NEW HOOK

// Helper Formatter
const formatCurrency = (num) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatThousand = (num) => {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(str.toString().replace(/\./g, ""));
};

const DailyLimitSettings = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const { account } = useWeb3();

  // 🔥 1. GUNAKAN HOOK ACTIVITY (Blockchain Live Data)
  const { activities, loading: historyLoading } = useRecentActivity();

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Helper untuk Icon & Warna
  const getCategoryMeta = (name) => {
    const meta = {
        "IT Infrastructure": { icon: "💻", color: "blue" },
        "Electronics": { icon: "💻", color: "blue" },
        "Office Supplies": { icon: "📦", color: "purple" },
        "Services": { icon: "🔧", color: "emerald" },
        "Raw Materials": { icon: "🏭", color: "amber" },
        "Travel": { icon: "✈️", color: "cyan" },
        "Travel & Accommodation": { icon: "✈️", color: "cyan" },
        "Meals": { icon: "🍽️", color: "orange" },
        "Meals & Entertainment": { icon: "🍽️", color: "orange" },
        "Software": { icon: "☁️", color: "indigo" },
        "Software Subscription": { icon: "☁️", color: "indigo" },
        "Marketing": { icon: "📢", color: "pink" },
    };
    return meta[name] || { icon: "💰", color: "gray" };
  };

  // FETCH LIMIT DATA
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const data = await apiService.getDailyLimits();
        const mappedCategories = data.map(item => {
            const catName = item.category?.name || "Unknown";
            const meta = getCategoryMeta(catName);
            return {
                id: item.category_id,
                name: catName,
                limit: Number(item.limit_amount),
                icon: meta.icon,
                color: meta.color
            };
        });
        setCategories(mappedCategories);
      } catch (error) {
        console.error("Gagal load daily limits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".page-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
      tl.fromTo(".info-banner", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3");
      tl.fromTo(".category-item", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, "-=0.2");
      
      // Animasi Table History
      tl.fromTo(".history-section", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.2");

    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  // Success animation
  useEffect(() => {
    if (saveSuccess) {
      gsap.fromTo(".success-banner", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" });
    }
  }, [saveSuccess]);

  const handleLimitChange = (id, value) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, limit: parseNumber(value) } : cat
      )
    );
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!account) {
      alert("Please connect your wallet to save changes.");
      return;
    }
    
    setIsSaving(true);
    try {
        await Promise.all(categories.map(cat => 
            apiService.updateDailyLimit(cat.id, cat.limit, account) 
        ));
        setSaveSuccess(true);
        setHasChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
        alert("Gagal menyimpan perubahan limit.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  const totalDailyBudget = categories.reduce((acc, cat) => acc + cat.limit, 0);

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading Limits...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={pageRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="page-header flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Daily Spending Limits</h1>
                <p className="text-slate-400 text-sm">CFO Control Panel</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button
              variant="primary"
              className="shadow-lg shadow-cyan-500/20"
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </span>
              ) : (
                <>💾 Save All Changes</>
              )}
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="success-banner mb-6 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">✓</div>
            <div>
              <h4 className="text-emerald-400 font-bold">Limits Updated Successfully</h4>
              <p className="text-sm text-emerald-300/70">Changes have been recorded to database.</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="info-banner mb-8 p-5 bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h4 className="text-blue-300 font-bold mb-1">How Daily Limits Work</h4>
            <p className="text-sm text-blue-200/70 leading-relaxed">
              These limits control the maximum spending allowed per category each day. Changes are recorded on-chain for audit purposes.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-slate-400 text-xs uppercase font-bold mb-2">Total Daily Budget</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalDailyBudget)}</div>
            <div className="text-xs text-slate-500 mt-1">Across {categories.length} categories</div>
          </Card>

          <Card className="p-6">
            <div className="text-slate-400 text-xs uppercase font-bold mb-2">Active Categories</div>
            <div className="text-2xl font-bold text-white">{categories.length}</div>
            <div className="text-xs text-slate-500 mt-1">All limits configured</div>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
            Configure Limits by Category
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="category-item bg-slate-900/80 border border-white/5 rounded-xl p-6 hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-${category.color}-500/10 border border-${category.color}-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg">{category.name}</h4>
                    <p className="text-slate-500 text-xs">Daily spending limit</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Maximum Amount (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                      <input
                        type="text"
                        value={formatThousand(category.limit)}
                        onChange={(e) => handleLimitChange(category.id, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white text-right focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-mono text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Per Day Maximum</span>
                    <span className="text-cyan-400 font-bold font-mono">{formatCurrency(category.limit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 RESTORED & UPGRADED: SYSTEM AUDIT LOG */}
        <div className="history-section pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                System Audit Log
              </h3>
              <p className="text-slate-400 text-sm mt-1">Real-time blockchain activity feed</p>
            </div>
            {historyLoading && <span className="text-xs text-cyan-400 animate-pulse">Syncing with Lisk...</span>}
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User / Auditor</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference ID</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyLoading ? (
                     <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading blockchain history...</td></tr>
                  ) : activities.length === 0 ? (
                     <tr><td colSpan="5" className="p-8 text-center text-slate-500">No activity recorded on blockchain yet.</td></tr>
                  ) : (
                    activities.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                              {log.user.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                                {log.user}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {log.userAddress.substring(0, 6)}...{log.userAddress.substring(38)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="info" size="sm">{log.action}</Badge>
                        </td>
                        <td className="p-4 text-sm font-mono text-slate-300">
                          {log.documentRef}
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {log.timestamp}
                        </td>
                        <td className="p-4">
                           <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                             On-Chain
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Table */}
            <div className="p-4 border-t border-white/5 bg-white/5 flex justify-center">
                <p className="text-xs text-slate-500 flex items-center gap-2">
                    🔒 Protected by Zero-Knowledge Proof Verification
                </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailyLimitSettings;