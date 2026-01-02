import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'; // 🔥 IMPORT RECHARTS
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api"; 

const CFODashboard = () => {
  const navigate = useNavigate();
  const dashboardRef = useRef(null);
  const [timeRange, setTimeRange] = useState("this-month");

  // REAL DATA STATES
  const [pendingApprovals, setPendingApprovals] = useState({ agreements: 0, invoices: 0, fraud: 0 });
  const [recentFraud, setRecentFraud] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalReceipts: 0, totalAmount: 0, thisMonthSubmissions: 0, 
    pendingVerifications: 0, averageProcessingTime: "5m", complianceRate: 98.5
  });
  
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- MOCK DATA UNTUK TREND (Data Cantik untuk Demo) ---
  const MOCK_TREND = [
    { month: "Jul", amount: 45000000 }, 
    { month: "Aug", amount: 72000000 }, 
    { month: "Sep", amount: 58000000 },
    { month: "Oct", amount: 81000000 }, 
    { month: "Nov", amount: 65000000 }, 
    { month: "Dec", amount: 92000000 },
  ];
  
  const [monthlyTrend, setMonthlyTrend] = useState(MOCK_TREND);
  const zkStats = { activeProofs: 4, expiringSoon: 1, totalVerifications: 28 }; 

  // FETCH DATA
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, approvalData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getCFOApprovals()
        ]);

        // 1. Update Kartu Stats
        setDashboardStats({
            totalReceipts: statsData.approvedThisMonth + statsData.pendingInvoices,
            totalAmount: statsData.totalValueThisMonth,
            thisMonthSubmissions: statsData.approvedThisMonth,
            pendingVerifications: statsData.pendingInvoices,
            averageProcessingTime: "5m",
            complianceRate: 98.5
        });

        // 2. Update Banner Alert
        setPendingApprovals({
            agreements: approvalData.agreements.length,
            invoices: approvalData.invoices.length,
            fraud: approvalData.invoices.length 
        });

        // 3. Update Fraud Alert List
        setRecentFraud(approvalData.invoices.map(inv => ({
            id: inv.id,
            type: "Limit Exceeded",
            severity: "medium",
            timestamp: formatDate(inv.receipt_date),
            amount: Number(inv.total_amount)
        })));

        // 4. Update Grafik Kategori
        const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-cyan-500", "bg-orange-500"];
        const cats = (statsData.categorySpending || []).map((c, idx) => ({
            category: c.category,
            amount: c.amount,
            count: c.count,
            limit: c.limit,
            todayUsed: c.amount, 
            color: colors[idx % colors.length]
        }));
        setCategoryData(cats);

      } catch (error) {
        console.error("Gagal load CFO Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".dashboard-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".alert-banner", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)", delay: 0.2 });
      gsap.fromTo(".stat-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)", delay: 0.3 });
      gsap.fromTo(".content-block", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.5 });
    }, dashboardRef);
    return () => ctx.revert();
  }, [loading]);

  const totalPending = pendingApprovals.agreements + pendingApprovals.invoices;

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading CFO Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={dashboardRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header */}
        <div className="dashboard-header flex flex-col md:flex-row justify-between items-end mb-6 gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Financial Overview</h1>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live Data</span>
            </div>
            <p className="text-slate-400">Welcome back, Chief Financial Officer</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-lg border border-white/10">
            {["This Month", "Quarter", "Year"].map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* ALERT BANNER */}
        {totalPending > 0 ? (
          <div className="alert-banner mb-8 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center text-3xl animate-pulse">⚠️</div>
                <div>
                  <h3 className="text-amber-400 font-bold text-xl mb-1">{totalPending} Items Need Your Approval</h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {pendingApprovals.agreements > 0 && <span className="text-amber-200/80">📋 {pendingApprovals.agreements} Agreements</span>}
                    {pendingApprovals.invoices > 0 && <span className="text-amber-200/80">💰 {pendingApprovals.invoices} Invoices Over Limit</span>}
                  </div>
                </div>
              </div>
              <Button variant="primary" size="lg" onClick={() => navigate("/approvals")} className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-lg shadow-amber-500/20">
                Review Now →
              </Button>
            </div>
          </div>
        ) : (
            <div className="alert-banner mb-8 bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="text-2xl">✅</div>
                    <div className="text-emerald-400 font-bold">You are all caught up! No pending items.</div>
                </div>
                <Button 
                    variant="secondary" 
                    onClick={() => navigate("/approvals")}
                    className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border-emerald-500/30"
                >
                    Review History →
                </Button>
            </div>
        )}

        {/* FRAUD ALERTS */}
        {recentFraud.length > 0 && (
          <div className="alert-banner mb-8 bg-red-950/50 border-2 border-red-500/50 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🚨</span>
                <h3 className="text-red-400 font-bold text-lg">Recent Fraud Detection Alerts</h3>
              </div>
              <div className="space-y-2">
                {recentFraud.map((fraud) => (
                  <div key={fraud.id} className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="error" size="sm">{fraud.type}</Badge>
                      <span className="text-sm text-slate-300">{fraud.id}</span>
                      <span className="text-sm text-slate-300">{fraud.timestamp}</span>
                    </div>
                    <button onClick={() => navigate("/approvals?tab=invoices")} className="text-xs text-red-400 hover:text-red-300 font-bold">Review →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">💰</div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">↑ 12%</span>
            </div>
            <div className="text-slate-400 text-sm mb-1">Total Verified Spend</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(dashboardStats.totalAmount)}</div>
          </div>
          <div className="stat-card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">📄</div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">↑ 8%</span>
            </div>
            <div className="text-slate-400 text-sm mb-1">Receipts Processed</div>
            <div className="text-2xl font-bold text-white">{dashboardStats.totalReceipts}</div>
          </div>
          <div className="stat-card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">🛡️</div>
              <span className="text-xs font-medium text-slate-400">Target: 99%</span>
            </div>
            <div className="text-slate-400 text-sm mb-1">Compliance Rate</div>
            <div className="text-2xl font-bold text-white">{dashboardStats.complianceRate}%</div>
          </div>
          <div className="stat-card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">⚡</div>
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">Action Needed</span>
            </div>
            <div className="text-slate-400 text-sm mb-1">Pending Review</div>
            <div className="text-2xl font-bold text-white">{dashboardStats.pendingVerifications} <span className="text-sm font-normal text-slate-500">items</span></div>
          </div>
        </div>

        {/* ZK Banner */}
        <div className="content-block mb-8 relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 shadow-[0_0_40px_-15px_rgba(6,182,212,0.2)]">
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">🔒</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Zero-Knowledge Audits Active</h3>
                <p className="text-slate-400 max-w-lg text-sm leading-relaxed">{zkStats.activeProofs} proofs running • {zkStats.totalVerifications} external verifications • Privacy preserved</p>
              </div>
            </div>
            <Button variant="primary" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold" onClick={() => navigate("/zk/dashboard")}>Open ZK Center</Button>
          </div>
        </div>

        {/* SPENDING BY CATEGORY (REAL DATA) */}
        <div className="content-block mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-lg">Today's Spending by Category</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings/daily-limits")}>Manage Limits →</Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categoryData.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-white/5">
                    No spending data for today yet. Upload an invoice to see data.
                </div>
            ) : (
                categoryData.map((cat, idx) => {
                const usagePercent = cat.limit > 0 ? (cat.todayUsed / cat.limit) * 100 : 0;
                const isNearLimit = usagePercent > 80;
                return (
                    <div key={idx} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                        <span className="text-white font-bold">{cat.category}</span>
                        </div>
                        {/* {isNearLimit && <Badge variant="warning" size="sm">excessive limit</Badge>} */}
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Today's Usage:</span>
                        <span className="text-white font-mono font-bold">{formatCurrency(cat.todayUsed)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Daily Limit:</span>
                        <span className="text-slate-500 font-mono">{formatCurrency(cat.limit)}</span>
                        </div>
                        <div className="pt-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span><span>{usagePercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? "bg-amber-500" : cat.color}`} style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
                        </div>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        </div>

        {/* CHARTS & ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 6-Month Trend (RECHARTS) */}
          <div className="content-block bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
            <div className="mb-6">
              <h3 className="font-bold text-white text-lg">6-Month Trend</h3>
              <p className="text-xs text-slate-500">Burn rate analysis (Verified Spend)</p>
            </div>
            
            {/* CHART AREA */}
            <div className="flex-1 relative h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', fontSize: '12px', borderRadius: '8px' }}
                    itemStyle={{ color: '#22d3ee' }}
                    formatter={(value) => [formatCurrency(value), "Spend"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="content-block lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <button onClick={() => navigate("/approvals")} className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl p-4 text-left transition-all group">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">Review Approvals</div>
                <div className="text-xs text-slate-500">{totalPending} pending items</div>
              </button>
              <button onClick={() => navigate("/agreements")} className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl p-4 text-left transition-all group">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">Agreements</div>
                <div className="text-xs text-slate-500">Manage contracts</div>
              </button>
              <button onClick={() => navigate("/settings/daily-limits")} className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl p-4 text-left transition-all group">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">Daily Limits</div>
                <div className="text-xs text-slate-500">Configure spending caps</div>
              </button>
              <button onClick={() => navigate("/reports")} className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl p-4 text-left transition-all group">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">Generate Report</div>
                <div className="text-xs text-slate-500">Export & analyze</div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CFODashboard;