import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api"; // 🔥 IMPORT API

const VendorDashboard = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending', 'active', 'history'

  // 🔥 REAL DATA STATES
  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Panggil 3 API sekaligus untuk mengisi semua tab
        const [approvalData, agreementsData, receiptsData] = await Promise.all([
          apiService.getApprovals('vendor'), // Khusus pending vendor
          apiService.getAgreements(),        // Untuk cari yang active
          apiService.getAllReceipts()        // Untuk history pembayaran
        ]);

        // 1. Map Pending Agreements
        const pending = (approvalData.agreements || []).map(agr => ({
            id: agr.id,
            company: "BlockReceipt Enterprise", // Hardcode nama PT kita
            category: "General", // Bisa update jika backend kirim kategori
            itemName: agr.title,
            specifications: "Standard Contract Specs", // Mock detail
            pricePerUnit: Number(agr.total_value), // Simplified
            totalQuantity: 1,
            totalValue: Number(agr.total_value),
            contractPeriod: { start: agr.start_date, end: agr.end_date },
            paymentTerms: agr.payment_terms,
            createdAt: agr.created_at,
            status: agr.status
        }));
        setPendingAgreements(pending);

        // 2. Map Active Agreements
        const active = agreementsData
            .filter(a => a.status === 'active' || a.status === 'pending_cfo') // Tampilkan juga yg nunggu CFO biar vendor tau progres
            .map(agr => {
                const mainItem = agr.items && agr.items.length > 0 ? agr.items[0] : null;
                return {
                    id: agr.id,
                    company: "BlockReceipt Enterprise",
                    category: agr.category?.name || "General",
                    itemName: mainItem ? mainItem.item_name : agr.title,
                    pricePerUnit: mainItem ? Number(mainItem.unit_price) : 0,
                    totalQuantity: mainItem ? mainItem.quantity : 1,
                    usedQuantity: 0, // Mock usage
                    totalValue: Number(agr.total_value),
                    contractPeriod: { start: agr.start_date, end: agr.end_date },
                    status: agr.status, // 'active' or 'pending_cfo'
                    lastInvoice: agr.created_at // Mock
                };
            });
        setActiveAgreements(active);

        // 3. Map Payment History (Receipts)
        const history = (receiptsData.data || [])
            .filter(r => r.status === 'verified')
            .map(r => ({
                id: `PAY-${r.id.slice(-4)}`,
                agreementId: "AGR-LINKED",
                invoiceId: r.id,
                amount: Number(r.total_amount),
                date: r.receipt_date,
                status: "paid",
                paidDate: r.updated_at // Anggap tanggal update verified = paid date
            }));
        setPaymentHistory(history);

      } catch (error) {
        console.error("Gagal load Vendor Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats Calculation
  const stats = {
    pendingReview: pendingAgreements.length,
    activeContracts: activeAgreements.filter(a => a.status === 'active').length,
    totalRevenue: paymentHistory.reduce((acc, p) => acc + p.amount, 0),
    pendingPayments: 0, // Mock dulu
  };

  // GSAP Animations
  useEffect(() => {
    if(loading) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".page-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
      tl.fromTo(".stat-card", { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 }, "-=0.3");
      tl.fromTo(".tab-button", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.2");
      tl.fromTo(".content-item", { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, "-=0.3");
    }, pageRef);
    return () => ctx.revert();
  }, [activeTab, loading]);

  const handleApprove = async (agreement) => {
      if(window.confirm(`Approve agreement ${agreement.id}?`)) {
          try {
              await apiService.submitAction({
                  id: agreement.id,
                  type: 'agreement',
                  action: 'approve',
                  role: 'vendor', // 🔥 PENTING: Role Vendor agar status jadi pending_cfo
                  note: 'Approved by Vendor Portal',
                  userId: 'vendor-abc'
              });
              alert("Agreement Approved! Sent to CFO.");
              // Refresh page simple way
              window.location.reload();
          } catch (error) {
              alert("Failed to approve: " + error.message);
          }
      }
  };

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`tab-button px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? "bg-slate-800 text-white shadow-lg"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === id
              ? "bg-cyan-500 text-black"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading Vendor Portal...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={pageRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="page-header mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-white/10 flex items-center justify-center">
              <span className="text-3xl">🏢</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Vendor Portal</h1>
              <p className="text-slate-400">PT Supplier ABC</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card bg-amber-900/10 border border-amber-500/20 p-5 rounded-2xl">
            <div className="text-amber-400 text-xs uppercase font-bold mb-2">Pending Review</div>
            <div className="text-3xl font-bold text-white">{stats.pendingReview}</div>
            <div className="text-[10px] text-amber-500/60 mt-1">Needs your action</div>
          </div>

          <div className="stat-card bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-2xl">
            <div className="text-emerald-400 text-xs uppercase font-bold mb-2">Active Contracts</div>
            <div className="text-3xl font-bold text-white">{stats.activeContracts}</div>
            <div className="text-[10px] text-emerald-500/60 mt-1">Currently running</div>
          </div>

          <div className="stat-card bg-slate-900/50 border border-white/5 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs uppercase font-bold mb-2">Total Revenue</div>
            <div className="text-xl font-bold text-white truncate">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-[10px] text-slate-500 mt-1">Lifetime earned</div>
          </div>

          <div className="stat-card bg-slate-900/50 border border-white/5 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs uppercase font-bold mb-2">Pending Payments</div>
            <div className="text-3xl font-bold text-white">{stats.pendingPayments}</div>
            <div className="text-[10px] text-slate-500 mt-1">Awaiting payment</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="pending" label="Pending Approval" count={pendingAgreements.length} />
          <TabButton id="active" label="Active Agreements" count={activeAgreements.length} />
          <TabButton id="history" label="Payment History" count={0} />
        </div>

        {/* TAB 1: Pending Agreements */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingAgreements.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">✅</div>
                <h3 className="text-white font-bold text-lg mb-2">No Pending Agreements</h3>
                <p className="text-slate-400">All proposals have been reviewed.</p>
              </Card>
            ) : (
              pendingAgreements.map((agreement) => (
                <Card key={agreement.id} className="content-item p-6 border-amber-500/20 hover:border-amber-500/40 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{agreement.itemName}</h3>
                        <Badge variant="warning" size="sm">Needs Your Approval</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-slate-500">Agreement ID:</span><span className="text-white font-mono ml-2">{agreement.id}</span></div>
                        <div><span className="text-slate-500">Company:</span><span className="text-white ml-2">{agreement.company}</span></div>
                        <div><span className="text-slate-500">Category:</span><span className="text-white ml-2">{agreement.category}</span></div>
                        <div><span className="text-slate-500">Created:</span><span className="text-white ml-2">{formatDate(agreement.createdAt)}</span></div>
                      </div>

                      <div className="bg-slate-800/30 rounded-lg p-4 mb-3">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Specifications</div>
                        <div className="text-sm text-white">{agreement.specifications}</div>
                      </div>

                      <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Price per Unit:</span>
                          <span className="text-white font-mono">{formatCurrency(agreement.pricePerUnit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Quantity:</span>
                          <span className="text-white font-bold">{agreement.totalQuantity} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Contract Period:</span>
                          <span className="text-white text-xs">{formatDate(agreement.contractPeriod.start)} to {formatDate(agreement.contractPeriod.end)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2">
                          <span className="text-cyan-400 font-bold">Total Value:</span>
                          <span className="text-cyan-400 font-mono font-bold text-lg">{formatCurrency(agreement.totalValue)}</span>
                        </div>
                      </div>
                    </div>
                    
                  <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 lg:w-64">
                      <div className="space-y-3">
                          {/* ✅ REVIEW & APPROVE (Navigation Fix) */}
                          <Button
                              variant="primary"
                              className="w-full bg-emerald-500 hover:bg-emerald-400"
                              onClick={(e) => {
                                  e.stopPropagation(); // Stop klik card di belakangnya
                                  navigate(`/vendor/agreements/${agreement.id}/review`); 
                              }}
                          >
                              ✓ Review & Approve
                          </Button>
                          
                          {/* 💬 REQUEST CHANGES (Reroute to Review Page) */}
                          <Button
                              variant="secondary"
                              className="w-full"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/vendor/agreements/${agreement.id}/review`); 
                              }}
                          >
                              💬 Request Changes
                          </Button>
                          
                          {/* ✕ DECLINE (Reroute to Review Page) */}
                          <Button
                              variant="ghost"
                              className="w-full text-red-400 hover:bg-red-500/10"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/vendor/agreements/${agreement.id}/review`); 
                              }}
                          >
                              ✕ Decline
                          </Button>
                      </div>
                  </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Active Agreements */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeAgreements.map((agreement) => {
              const usagePercent = (agreement.usedQuantity / agreement.totalQuantity) * 100;
              const remainingQty = agreement.totalQuantity - agreement.usedQuantity;

              return (
                <Card key={agreement.id} className="content-item p-6 hover:border-cyan-500/30 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{agreement.itemName}</h3>
                        <Badge variant={agreement.status === 'active' ? 'success' : 'warning'} size="sm" dot>
                          {agreement.status === 'active' ? 'Active' : 'Waiting CFO'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-slate-500">Agreement ID:</span><span className="text-cyan-400 font-mono ml-2">{agreement.id}</span></div>
                        <div><span className="text-slate-500">Category:</span><span className="text-white ml-2">{agreement.category}</span></div>
                      </div>

                      <div className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Used Quantity:</span>
                          <span className="text-white font-bold">{agreement.usedQuantity} / {agreement.totalQuantity} units</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Remaining:</span>
                          <span className="text-cyan-400 font-bold">{remainingQty} units</span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Usage Progress</span><span>{usagePercent.toFixed(0)}%</span></div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${usagePercent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* TAB 3: Payment History */}
        {activeTab === "history" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Payment ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="content-item hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-mono">{payment.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">{payment.invoiceId}</td>
                      <td className="px-6 py-4 text-sm text-white font-mono font-bold">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatDate(payment.date)}</td>
                      <td className="px-6 py-4"><Badge variant="success" size="sm" dot>Paid</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;