import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api";
import { useNotify } from "../context/NotificationSystem";
import { useWeb3 } from "../context/Web3Context"; // Import Web3

const CFOApprovals = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { account } = useWeb3(); // Ambil akun CFO
  const [searchParams] = useSearchParams();
  const pageRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "agreements"); 
  const [modalState, setModalState] = useState({ open: false, type: null, item: null });
  const [approvalNote, setApprovalNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // New Loading State

  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [invoicesOverLimit, setInvoicesOverLimit] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]); 

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, limitsData] = await Promise.all([
        apiService.getApprovals('cfo'),
        apiService.getDailyLimits()
      ]);

      const limitMap = {};
      limitsData.forEach(l => {
          if (l.category && l.category.name) {
              limitMap[l.category.name] = Number(l.limit_amount);
          }
      });

      const agreements = data.agreements.map(agr => ({
        id: agr.id,
        vendor: agr.vendor?.name,
        category: "General",
        itemName: agr.title,
        pricePerUnit: Number(agr.total_value), 
        totalQuantity: 1, 
        totalValue: Number(agr.total_value),
        contractPeriod: { start: agr.start_date, end: agr.end_date },
        paymentTerms: agr.payment_terms,
        createdBy: "Finance Team",
        createdAt: agr.created_at,
        vendorApprovedAt: agr.updated_at,
        type: 'agreement'
      }));
      setPendingAgreements(agreements);

      const invoices = data.invoices.map(inv => {
        const categoryName = inv.category?.name || "General";
        const actualLimit = limitMap[categoryName] || 50000000; 

        return {
          id: inv.id,
          agreementId: "AGR-LINKED",
          vendor: inv.vendor_name,
          category: categoryName,
          itemName: inv.items && inv.items.length > 0 ? inv.items[0].description : "Mixed Items",
          amount: Number(inv.total_amount),
          quantity: inv.items ? inv.items.reduce((s, i) => s + i.quantity, 0) : 1,
          date: inv.receipt_date,
          dailyLimit: actualLimit,
          todaySpending: 0, 
          totalAfter: Number(inv.total_amount),
          submittedBy: "Finance Team",
          reason: `Exceeds limit (${formatCurrency(actualLimit)})`,
          type: 'invoice'
        };
      });
      setInvoicesOverLimit(invoices);

      setFraudAlerts(invoices.map(inv => ({
        ...inv,
        fraudType: "Limit Violation",
        expectedPrice: 0,
        submittedPrice: inv.amount,
        difference: 0,
        differencePercent: 0,
        status: "unreviewed",
        timestamp: inv.date
      })));

    } catch (error) {
      console.error("Gagal load approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".page-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
      gsap.fromTo(".tab-item", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" });
      gsap.fromTo(".approval-item", { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" });
    }, pageRef);
    return () => ctx.revert();
  }, [activeTab, loading]);

  const handleApprove = (item, type) => {
    setModalState({ open: true, type: 'approve', item: { ...item, approvalType: type } });
    setApprovalNote("");
  };

  const handleReject = (item, type) => {
    setModalState({ open: true, type: 'reject', item: { ...item, approvalType: type } });
    setApprovalNote("");
  };

  // 🔥 CORE: APPROVAL LOGIC
  const confirmAction = async () => {
    if (!account) {
        notify.error("Access Denied", "Please connect CFO wallet first.");
        return;
    }

    setIsProcessing(true); // Start Loading
    const actionType = modalState.type; // 'approve' or 'reject'
    const status = actionType === 'approve' ? 'verified' : 'rejected';

    try {
        // 1. Update Database (Backend)
        await apiService.submitAction({
            id: modalState.item.id,
            type: modalState.item.type, // 'invoice' or 'agreement'
            action: actionType,
            status: status, // Kirim status eksplisit
            note: approvalNote,
            userId: "cfo-user-id-123", // Mock CFO ID
            role: "cfo"
        });

        // 2. Notifikasi
        if (actionType === 'approve') {
             notify.success(
                "Audit Completed", 
                `Item ${modalState.item.id} has been verified and status updated on-chain record.`
             );
        } else {
             notify.error("Transaction Rejected", `The item ${modalState.item.id} has been rejected.`);
        }

        setModalState({ open: false, type: null, item: null });
        loadData(); // Refresh Data Dashboard

    } catch (error) {
        console.error("Approval Error:", error);
        notify.error("Action Failed", error.message || "Could not process approval.");
    } finally {
        setIsProcessing(false);
    }
  };

  const TabButton = ({ id, label, count, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`tab-item px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
        activeTab === id
          ? "bg-slate-800 text-white shadow-lg"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          activeTab === id ? "bg-cyan-500 text-black" : "bg-slate-700 text-slate-300"
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-500">Loading Approvals...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={pageRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="page-header mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-white/10 flex items-center justify-center">
              <span className="text-3xl">👨‍💼</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">CFO Approval Center</h1>
              <p className="text-slate-400">Review and approve pending agreements, invoices, and fraud alerts</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="agreements" label="Pending Agreements" count={pendingAgreements.length} icon="📋" />
          <TabButton id="invoices" label="Invoices Over Limit" count={invoicesOverLimit.length} icon="💰" />
          <TabButton id="fraud" label="Fraud Alerts" count={fraudAlerts.length} icon="🚨" />
        </div>

        {activeTab === "agreements" && (
          <div className="space-y-4">
            {pendingAgreements.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">✅</div>
                <h3 className="text-white font-bold text-lg mb-2">No Pending Agreements</h3>
                <p className="text-slate-400">All agreements have been reviewed.</p>
              </Card>
            ) : (
              pendingAgreements.map((agreement) => (
                <Card key={agreement.id} className="approval-item p-6 hover:border-cyan-500/30 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{agreement.itemName}</h3>
                        <Badge variant="warning" size="sm">Awaiting Approval</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-slate-500">Agreement ID:</span><span className="text-white font-mono ml-2">{agreement.id}</span></div>
                        <div><span className="text-slate-500">Vendor:</span><span className="text-white ml-2">{agreement.vendor}</span></div>
                        <div><span className="text-slate-500">Category:</span><span className="text-white ml-2">{agreement.category}</span></div>
                        <div><span className="text-slate-500">Created By:</span><span className="text-white ml-2">{agreement.createdBy}</span></div>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between border-t border-white/10 pt-2">
                          <span className="text-cyan-400 font-bold">Total Value:</span>
                          <span className="text-cyan-400 font-mono font-bold text-lg">{formatCurrency(agreement.totalValue)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 lg:w-64">
                      <div className="space-y-3">
                        <Button variant="primary" className="w-full bg-emerald-500 hover:bg-emerald-400" onClick={() => handleApprove(agreement, 'agreement')}>✓ Approve Agreement</Button>
                        <Button variant="secondary" className="w-full" onClick={() => navigate(`/agreements`)}>View Full Details</Button>
                        <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10" onClick={() => handleReject(agreement, 'agreement')}>✕ Reject</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-4">
            {invoicesOverLimit.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">✅</div>
                <h3 className="text-white font-bold text-lg mb-2">No Invoices Over Limit</h3>
                <p className="text-slate-400">All invoices are within daily limits.</p>
              </Card>
            ) : (
              invoicesOverLimit.map((invoice) => (
                <Card key={invoice.id} className="approval-item p-6 border-amber-500/20 hover:border-amber-500/40 transition-all">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-white">{invoice.itemName}</h3>
                        <Badge variant="warning" size="sm">Over Limit</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><span className="text-slate-500">Invoice ID:</span><span className="text-white font-mono ml-2">{invoice.id}</span></div>
                        <div><span className="text-slate-500">Category:</span><span className="text-cyan-400 font-bold ml-2">{invoice.category}</span></div>
                        <div><span className="text-slate-500">Vendor:</span><span className="text-white ml-2">{invoice.vendor}</span></div>
                        <div><span className="text-slate-500">Date:</span><span className="text-white ml-2">{formatDate(invoice.date)}</span></div>
                      </div>
                      <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Daily Limit:</span><span className="text-white font-mono">{formatCurrency(invoice.dailyLimit)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">This Invoice:</span><span className="text-amber-400 font-mono font-bold">{formatCurrency(invoice.amount)}</span></div>
                        <div className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded">⚠️ Exceeds limit by {formatCurrency(invoice.amount - invoice.dailyLimit)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6 lg:w-64">
                      <div className="space-y-3">
                        <Button variant="primary" className="w-full bg-emerald-500 hover:bg-emerald-400" onClick={() => handleApprove(invoice, 'invoice')}>✓ Approve Invoice</Button>
                        <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10" onClick={() => handleReject(invoice, 'invoice')}>✕ Reject</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "fraud" && (
          <div className="space-y-4">
             {fraudAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">🛡️</div>
                <h3 className="text-white font-bold text-lg mb-2">No Fraud Alerts</h3>
                <p className="text-slate-400">System is clean.</p>
              </Card>
            ) : (
                fraudAlerts.map((fraud) => (
                    <Card key={fraud.id} className="approval-item p-6 border-red-500/30 hover:border-red-500/50 transition-all bg-red-900/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xl">🚨</div>
                            <div>
                                <h3 className="text-xl font-bold text-red-400">{fraud.fraudType}</h3>
                                <p className="text-sm text-slate-400">Anomaly Detected</p>
                            </div>
                        </div>
                        <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 text-sm text-white mb-4">
                            Transaction {fraud.id} flagged for abnormal amount: {formatCurrency(fraud.amount)}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="w-full text-red-400" onClick={() => handleReject(fraud, 'invoice')}>Reject & Flag</Button>
                        </div>
                    </Card>
                ))
            )}
          </div>
        )}
      </div>

      {modalState.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {modalState.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to {modalState.type} this {modalState.item?.approvalType}?
              <br />
              <span className="text-white font-mono text-sm">{modalState.item?.id}</span>
            </p>

            <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Note (Optional)</label>
                <textarea 
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none" 
                    rows="3"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Add comments..."
                />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setModalState({ open: false, type: null, item: null })} disabled={isProcessing}>Cancel</Button>
              <Button 
                variant={modalState.type === 'approve' ? 'primary' : 'secondary'} 
                className={`flex-1 ${modalState.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400 text-white'}`} 
                onClick={confirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                        Processing...
                    </span>
                ) : (
                    modalState.type === 'approve' ? '✓ Confirm' : '✕ Reject'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CFOApprovals;