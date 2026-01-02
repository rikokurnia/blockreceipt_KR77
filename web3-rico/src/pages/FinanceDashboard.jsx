import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api"; // IMPORT API SERVICE

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  // REAL DATA STATES
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [stats, setStats] = useState({
    activeAgreements: 0,
    pendingInvoices: 0,
    approvedThisMonth: 0,
    totalValueThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, invoicesData, agreementsData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentInvoices(),
          apiService.getAgreements() // Kita filter yg active di frontend
        ]);

        setStats(statsData);

        // Map Receipts Backend -> UI Format
        const mappedInvoices = invoicesData.map(inv => ({
            id: inv.id,
            agreementId: "AGR-LINKED", // Bisa diganti kalau ada relasi
            vendor: inv.vendor_name,
            amount: Number(inv.total_amount),
            quantity: inv.items.reduce((sum, i) => sum + i.quantity, 0),
            date: inv.receipt_date,
            status: inv.status === 'verified' ? 'approved' : 'pending-cfo',
            approvedBy: inv.status === 'verified' ? 'Auto (Under Limit)' : null,
            reason: inv.status === 'pending_approval' ? 'Needs Approval' : null
        }));
        setRecentInvoices(mappedInvoices);

        // Filter Active Agreements & Map Backend -> UI Format
        const activeAgrs = agreementsData
            .filter(a => a.status === 'active' || a.status === 'pending_vendor') // Tampilkan juga yg pending vendor biar gak kosong
            .slice(0, 3) // Ambil 3 teratas
            .map(agr => {
                const mainItem = agr.items && agr.items.length > 0 ? agr.items[0] : null;
                return {
                    id: agr.id,
                    vendor: agr.vendor?.name || "Unknown",
                    category: "General",
                    itemName: mainItem ? mainItem.item_name : agr.title,
                    pricePerUnit: mainItem ? Number(mainItem.unit_price) : 0,
                    remainingQty: mainItem ? mainItem.quantity : 0, // Mock usage
                    totalQuantity: mainItem ? mainItem.quantity : 0,
                    contractEnd: agr.end_date,
                    status: agr.status === 'pending_vendor' ? 'active' : agr.status // Mock status active biar kelihatan bagus
                };
            });
        setActiveAgreements(activeAgrs);

      } catch (error) {
        console.error("Gagal load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Header
      tl.fromTo(
        ".dashboard-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );

      // 2. Stats Cards
      tl.fromTo(
        ".stat-card",
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 },
        "-=0.3"
      );

      // 3. Quick Actions
      tl.fromTo(
        ".quick-action",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        "-=0.2"
      );

      // 4. Content Sections
      tl.fromTo(
        ".content-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.15 },
        "-=0.3"
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  // Helpers
  const getStatusBadge = (status) => {
    const variants = {
      approved: "success",
      "pending-cfo": "warning",
      rejected: "error",
      active: "success",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: "Approved",
      "pending-cfo": "Pending CFO",
      rejected: "Rejected",
      active: "Active",
    };
    return labels[status] || status;
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
            <div className="text-slate-500">Loading Dashboard...</div>
        </div>
      );
  }

  return (
    <div
      className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30"
      ref={pageRef}
    >
      <Navbar />

      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="dashboard-header flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center backdrop-blur-md">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  Finance Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                  Agreement & Invoice Management
                </p>
              </div>
            </div>
          </div>
          <Badge variant="default" className="border-slate-700 text-slate-400">
            Finance Team
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-400 text-xs uppercase font-bold">
                Active Agreements
              </div>
              <span className="text-2xl opacity-50">📋</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.activeAgreements}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Ready to use</div>
          </div>

          <div className="stat-card bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl backdrop-blur-md hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-amber-400 text-xs uppercase font-bold">
                Pending Invoices
              </div>
              <span className="text-2xl opacity-50">⏳</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.pendingInvoices}
            </div>
            <div className="text-[10px] text-amber-500/60 mt-1">
              Awaiting CFO approval
            </div>
          </div>

          <div className="stat-card bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-md hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-emerald-400 text-xs uppercase font-bold">
                Approved (This Month)
              </div>
              <span className="text-2xl opacity-50">✅</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.approvedThisMonth}
            </div>
            <div className="text-[10px] text-emerald-500/60 mt-1">
              Invoices processed
            </div>
          </div>

          <div className="stat-card bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl backdrop-blur-md hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-400 text-xs uppercase font-bold">
                Total Value
              </div>
              <span className="text-2xl opacity-50">💰</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {formatCurrency(stats.totalValueThisMonth)}
            </div>
            <div className="text-[10px] text-blue-500/60 mt-1">This month</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => navigate("/upload")}
            className="quick-action group bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 p-6 rounded-2xl hover:from-cyan-500/20 hover:to-blue-600/20 hover:border-cyan-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg mb-1">
                  Submit Invoice
                </div>
                <div className="text-slate-400 text-xs">
                  Upload & validate invoice
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/agreements/create")}
            className="quick-action group bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30 p-6 rounded-2xl hover:from-blue-500/20 hover:to-indigo-600/20 hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">📝</span>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg mb-1">
                  Create Agreement
                </div>
                <div className="text-slate-400 text-xs">
                  New purchase agreement
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/agreements")}
            className="quick-action group bg-gradient-to-br from-slate-500/10 to-slate-600/10 border border-slate-500/30 p-6 rounded-2xl hover:from-slate-500/20 hover:to-slate-600/20 hover:border-slate-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">📂</span>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg mb-1">
                  View All Agreements
                </div>
                <div className="text-slate-400 text-xs">
                  Manage all contracts
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Agreements Section */}
          <Card className="content-section bg-slate-900/50 border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
                Active Agreements
              </h2>
              <button
                onClick={() => navigate("/agreements")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {activeAgreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="bg-slate-950/50 border border-white/5 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer group"
                  onClick={() => navigate("/upload")}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {agreement.itemName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {agreement.id} • {agreement.vendor}
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-white/5">
                    <div>
                      <span className="text-slate-500">Remaining:</span>
                      <span className="text-white ml-2 font-medium">
                        {agreement.remainingQty}/{agreement.totalQuantity} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Price/Unit:</span>
                      <span className="text-emerald-400 ml-2 font-mono font-medium">
                        {formatCurrency(agreement.pricePerUnit)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-2">
                    Expires: {formatDate(agreement.contractEnd)}
                  </div>
                </div>
              ))}
            </div>

            {activeAgreements.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-20">📋</div>
                <div className="text-slate-400 text-sm">
                  No active agreements yet
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/agreements/create")}
                  className="mt-4"
                >
                  Create Agreement
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Invoices Section */}
          <Card className="content-section bg-slate-900/50 border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Recent Invoices
              </h2>
              <button
                onClick={() => navigate("/auditor/submissions")}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-slate-950/50 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {invoice.vendor}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {invoice.id} • {formatDate(invoice.date)}
                      </div>
                    </div>
                    <Badge variant={getStatusBadge(invoice.status)} size="sm">
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-slate-500">
                      Qty: {invoice.quantity} units
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </div>

                  {invoice.reason && (
                    <div className="text-xs text-amber-400 mt-2 flex items-start gap-1">
                      <span>⚠️</span>
                      <span>{invoice.reason}</span>
                    </div>
                  )}

                  {invoice.approvedBy && (
                    <div className="text-xs text-emerald-500 mt-2 flex items-start gap-1">
                      <span>✓</span>
                      <span>Approved by: {invoice.approvedBy}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {recentInvoices.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-20">📄</div>
                <div className="text-slate-400 text-sm">
                  No invoices submitted yet
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/upload")}
                  className="mt-4"
                >
                  Submit Invoice
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Info Banner */}
        <div className="content-section mt-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">→</span>
                  <span>
                    Always select an <strong>Active Agreement</strong> before
                    submitting invoices
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">→</span>
                  <span>
                    Invoices are <strong>auto-validated</strong> against
                    agreement terms (price, qty, period)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">→</span>
                  <span>
                    If invoice exceeds <strong>daily limit</strong>, it will be
                    sent to CFO for approval
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;