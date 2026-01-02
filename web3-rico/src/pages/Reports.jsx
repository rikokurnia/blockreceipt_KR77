import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { formatCurrency, formatDate } from "../utils/helpers";
import { apiService } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Reports = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // --- STATE ---
  const [dateRange, setDateRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [includeBlockchainProof, setIncludeBlockchainProof] = useState(true);
  
  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  // Recent Files (Load from LocalStorage)
  const [recentFiles, setRecentFiles] = useState([]);
  const [fileSequence, setFileSequence] = useState(1); // 1. Sequence Counter State

  useEffect(() => {
    const savedFiles = JSON.parse(localStorage.getItem("recentReports") || "[]");
    const savedSeq = parseInt(localStorage.getItem("reportSequence") || "1");
    setRecentFiles(savedFiles);
    setFileSequence(savedSeq);
    apiService.getCategories().then(data => setCategoriesList(data.map(c => c.name)));
  }, []);

  // --- COLOR LOGIC ---
  const getReportStyle = (count) => {
    if (count === 0) return "bg-slate-800 text-slate-500 border-slate-700";
    if (count === 1) return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"; // Hijau (1 item)
    if (count > 1 && count <= 3) return "bg-blue-500/20 text-blue-500 border-blue-500/30"; // Biru (2-3 item)
    if (count > 3 && count <= 8) return "bg-red-500/20 text-red-500 border-red-500/30"; // Merah (4-8 item)
    return "bg-amber-500/20 text-amber-500 border-amber-500/30"; // Kuning (>8 item)
  };

  const fetchReportData = async () => {
      try {
          const data = await apiService.generateReportData({
              startDate: dateRange.start,
              endDate: dateRange.end,
              categories: selectedCategories
          });
          return data.map(item => ({
              date: item.receipt_date,
              vendor: item.vendor_name,
              category: item.category?.name || "General",
              total: Number(item.total_amount),
              status: item.status,
              txHash: item.blockchain_record?.tx_hash || "-"
          }));
      } catch (error) {
          console.error("Error fetching report:", error);
          return [];
      }
  };

  // --- DOWNLOAD HANDLERS (Same as before) ---
  const downloadPDF = (data, filename) => { /* ... PDF logic ... */ 
    const doc = new jsPDF();
    doc.text("BLOCKRECEIPT - Audit Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    autoTable(doc, {
        head: [["Date", "Vendor", "Category", "Amount", "Blockchain Proof (Tx Hash)"]],
        body: data.map(i => [
            formatDate(i.date), i.vendor, i.category, formatCurrency(i.total), i.txHash ? `${i.txHash.substring(0, 8)}...` : "-"
        ]),
        startY: 35,
    });
    doc.save(filename);
  };
  const downloadExcel = (data, filename) => { /* ... Excel logic ... */ 
    const ws = XLSX.utils.json_to_sheet(data.map(i => ({
        Date: formatDate(i.date), Vendor: i.vendor, Category: i.category, Amount: i.total, TxHash: i.txHash
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Data");
    XLSX.writeFile(wb, filename);
  };
  const downloadJSON = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- MAIN GENERATE FUNCTION ---
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
        const data = await fetchReportData();

        if (data.length === 0) {
            alert("No verified receipts found for the selected criteria.");
            setIsGenerating(false);
            return;
        }

        // 2. Process File
        const currentSeq = fileSequence;
        let ext = 'pdf';
        if (reportFormat === 'excel') ext = 'xlsx';
        if (reportFormat === 'json') ext = 'json';
        
        const filename = `Audit_Report_#${currentSeq}_(${data.length}_Items).${ext}`;

        // Download File
        if (reportFormat === "pdf") downloadPDF(data, filename);
        else if (reportFormat === "excel") downloadExcel(data, filename);
        else if (reportFormat === "json") downloadJSON(data, filename);

        // 3. Save History
        const newReport = {
          id: Date.now(),
          name: `Audit Report #${currentSeq} (${data.length} Items)`,
          date: new Date().toLocaleDateString(),
          type: reportFormat.toUpperCase(),
          count: data.length,
          filters: { start: dateRange.start, end: dateRange.end, cats: selectedCategories }
        };
        
        const updatedFiles = [newReport, ...recentFiles];
        setRecentFiles(updatedFiles);
        localStorage.setItem("recentReports", JSON.stringify(updatedFiles));

        // 4. Increment Sequence
        setFileSequence(currentSeq + 1);
        localStorage.setItem("reportSequence", (currentSeq + 1).toString());

        alert(`✅ Report #${currentSeq} Generated!`);

    } catch (error) {
        alert("Failed to generate report.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRedownload = async (report) => {
    const data = await apiService.generateReportData({
        startDate: report.filters.start,
        endDate: report.filters.end,
        categories: report.filters.cats
    });

    const filename = report.name.replace(/ /g, '_') + '.' + report.type.toLowerCase();

    if (report.type === 'PDF') downloadPDF(data, filename);
    else if (report.type === 'EXCEL') downloadExcel(data, filename);
    else downloadJSON(data.map(item => ({...item, total: Number(item.total_amount)})), filename);
  };
  
  // 🔥 FINAL FIX: RESET SEQUENCE COUNTER
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all report history?")) {
      setRecentFiles([]);
      localStorage.removeItem("recentReports");
      
      // RESET SEQUENCE COUNTER TO 1
      setFileSequence(1);
      localStorage.removeItem("reportSequence");

      alert("Report history cleared. Next report will be #1.");
    }
  };

  const toggleItem = (item, list, setList) => {
    setList((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  };

  useEffect(() => {
    if (showPreview) {
        fetchReportData().then(data => setPreviewData(data.slice(0, 5)));
    }
  }, [showPreview, dateRange, selectedCategories]);

  // Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".page-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
      tl.fromTo(".config-panel", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.4");
      tl.fromTo(".sidebar-item", { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.4");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const panel = document.querySelector(".preview-panel");
    if (panel) {
      if (showPreview) gsap.to(panel, { height: "auto", opacity: 1, marginTop: 32, duration: 0.5 });
      else gsap.to(panel, { height: 0, opacity: 0, marginTop: 0, duration: 0.4 });
    }
  }, [showPreview]);

  const sidebarFiles = recentFiles.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30" ref={containerRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="page-header mb-8 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">Report Generator</h1>
              <Badge variant="default" className="border-slate-700 text-slate-400">Audit Tools</Badge>
            </div>
            <p className="text-slate-400 max-w-xl">Create granular financial reports validated by blockchain proofs.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate("/dashboard")}>Cancel</Button>
            <Button variant="secondary" onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Hide Preview" : "Show Live Preview"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT: CONFIGURATION */}
          <div className="config-panel lg:col-span-2 space-y-6">
            <Card className="config-section bg-slate-900/50 border-white/5 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2"><span className="w-1 h-5 bg-cyan-500 rounded-full"></span> Time Period</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">From</label>
                  <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" />
                </div>
                <div className="group">
                  <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">To</label>
                  <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" />
                </div>
              </div>
            </Card>

            <Card className="config-section bg-slate-900/50 border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-purple-500 rounded-full"></span> Filters</h2>
              <div className="mb-6">
                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <button key={cat} onClick={() => toggleItem(cat, selectedCategories, setSelectedCategories)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedCategories.includes(cat) ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-slate-800 border-transparent text-slate-400 hover:border-slate-600"}`}>{cat}</button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="config-section bg-slate-900/50 border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-emerald-500 rounded-full"></span> Output Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[ { id: "pdf", label: "PDF Document", icon: "📄" }, { id: "excel", label: "Excel Spreadsheet", icon: "📊" }, { id: "json", label: "Raw JSON", icon: "code" } ].map((fmt) => (
                  <button key={fmt.id} onClick={() => setReportFormat(fmt.id)} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${reportFormat === fmt.id ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-600"}`}>
                    <span className={`text-2xl ${fmt.id === "json" ? "font-mono text-sm font-bold pt-1" : ""}`}>{fmt.icon}</span>
                    <span className="text-sm font-medium">{fmt.label}</span>
                  </button>
                ))}
              </div>
              
               <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${includeBlockchainProof ? "bg-cyan-900/20 border-cyan-500/30" : "bg-slate-800/50 border-slate-700"}`} onClick={() => setIncludeBlockchainProof(!includeBlockchainProof)}>
                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${includeBlockchainProof ? "bg-cyan-500 border-cyan-500" : "border-slate-500"}`}>
                  {includeBlockchainProof && <span className="text-black text-sm font-bold">✓</span>}
                </div>
                <div>
                  <div className={`font-medium ${includeBlockchainProof ? "text-cyan-400" : "text-slate-400"}`}>Include Blockchain Proofs</div>
                  <p className="text-xs text-slate-500">Embed TX Hash for every receipt.</p>
                </div>
              </div>
            </Card>

            <Button id="generate-btn" variant="primary" size="lg" className="w-full py-4 text-lg shadow-xl shadow-cyan-500/20 disabled:opacity-50" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Processing..." : "Generate Report"}
            </Button>
          </div>

          {/* RIGHT: RECENT FILES */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sidebar-item">
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Recent Files</h3>
                 {/* BINDING THE CLEAR BUTTON */}
                {recentFiles.length > 0 && (
                  <button 
                    onClick={handleClearHistory} 
                    className="text-xs text-red-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {recentFiles.length === 0 && <p className="text-slate-600 text-xs italic px-2">No generated reports yet.</p>}
                
                {sidebarFiles.map((report) => (
                  <div key={report.id} className="group bg-slate-900/80 border border-white/5 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer relative overflow-hidden flex items-center justify-between">
                    <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
                      {/* COLOR LOGIC ICON */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-inner border ${getReportStyle(report.count || 0)}`}>
                        {report.type === "PDF" ? "📄" : report.type === "EXCEL" ? "📊" : "{}"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{report.name}</div>
                        <div className="text-xs text-slate-500 flex gap-2"><span>{report.date}</span></div>
                      </div>
                    </div>
                     <button onClick={(e) => { e.stopPropagation(); handleRedownload(report); }} className="z-20 p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-all" title="Download Again">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3-3m3 3l3-3m-3 3V3" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
             <Card className="sidebar-item bg-gradient-to-b from-slate-800 to-slate-900 border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Did you know?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    PDF reports include clickable links to the Lisk Block Explorer for instant verification of every transaction.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* PREVIEW PANEL */}
        <div className="preview-panel overflow-hidden h-0 opacity-0">
          <Card className="bg-slate-900 border-t-4 border-t-cyan-500 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Live Preview</h2>
              <div className="text-sm text-slate-400">Showing {previewData.length} items</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Vendor</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3 rounded-r-lg">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {previewData.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-4 text-slate-500">No verified data found for preview.</td></tr>
                  ) : (
                      previewData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{row.vendor}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(row.date)}</td>
                          <td className="px-4 py-3"><Badge variant="default" size="sm">{row.category}</Badge></td>
                          <td className="px-4 py-3 font-mono text-emerald-400">{formatCurrency(row.total)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-cyan-600 truncate max-w-[100px]">{row.txHash}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;