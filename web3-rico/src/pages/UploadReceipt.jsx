import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import gsap from "gsap"; // Tetap import untuk animasi simple
import { ethers } from "ethers";
import { apiService } from "../services/api";
import { useNotify } from "../context/NotificationSystem";
import { useWeb3 } from "../context/Web3Context";

// 🔑 CONFIGURATION
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash";

const formatThousand = (num) => {
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(str.toString().replace(/\./g, ""));
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });
};

const UploadReceipt = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { contracts, account } = useWeb3();
  const containerRef = useRef();

  // DATA REAL
  const [agreements, setAgreements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyLimits, setDailyLimits] = useState({});

  // State Standar
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extracted data
  const [extractedData, setExtractedData] = useState(null);
  const [isInvoiceUploaded, setIsInvoiceUploaded] = useState(false);

  // Agreement Selection
  const [selectedAgreement, setSelectedAgreement] = useState("");
  const [agreementData, setAgreementData] = useState(null);

  // Validation Results
  const [validationResults, setValidationResults] = useState(null);

  const [formData, setFormData] = useState({
    vendor: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    items: [{ id: 1, description: "", quantity: 1, unitPrice: 0, total: 0 }],
    taxAmount: 0,
    extractedTotal: 0,
  });

  // INITIAL LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agreementsData, categoriesData, limitsData] = await Promise.all([
          apiService.getAgreements(),
          apiService.getCategories(),
          apiService.getDailyLimits()
        ]);
        
        const limitMap = {};
        limitsData.forEach(limit => {
            if (limit.category && limit.category.name) {
                limitMap[limit.category.name] = Number(limit.limit_amount);
            }
        });
        setDailyLimits(limitMap);
        setCategories(categoriesData);

        const formattedAgreements = agreementsData.map(agr => {
            const catName = agr.category?.name || "General";
            const mainItem = agr.items && agr.items.length > 0 ? agr.items[0] : null;
            return {
                id: agr.id,
                vendor: agr.vendor.name,
                category: catName,
                itemName: mainItem ? mainItem.item_name : "General Contract",
                pricePerUnit: mainItem ? Number(mainItem.unit_price) : 0,
                totalValue: Number(agr.total_value),
                totalQuantity: mainItem ? mainItem.quantity : 0,
                usedQuantity: 0,
                remainingQty: mainItem ? mainItem.quantity : 0,
                contractPeriod: { 
                    start: agr.start_date.split('T')[0], 
                    end: agr.end_date.split('T')[0] 
                },
                status: agr.status
            };
        });
        setAgreements(formattedAgreements);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };
    fetchData();

    // Simple Entry Animation
    gsap.fromTo(".fade-in-entry", 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.2 }
    );
  }, []);

  const handleAgreementSelect = (agreementId) => {
    const agreement = agreements.find((a) => a.id === agreementId);
    if (!agreement) return;

    setAgreementData(agreement);
    setValidationResults(null);
    setExtractedData(null);
    setIsInvoiceUploaded(false);
    setPreview(null);
    setFile(null);
    setFormData({
      vendor: "",
      invoiceNumber: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      items: [{ id: 1, description: "", quantity: 1, unitPrice: 0, total: 0 }],
      taxAmount: 0,
      extractedTotal: 0,
    });
  };

  const calculateSubtotal = () => formData.items.reduce((acc, item) => acc + item.total, 0);
  const calculateGrandTotal = () => calculateSubtotal() + Number(formData.taxAmount);

  // --- VALIDATION CORE LOGIC ---
  const performValidation = () => {
    if (!agreementData || !formData) {
      setValidationResults(null);
      return;
    }

    const results = {
      priceMatch: { valid: true, message: "" },
      qtyAvailable: { valid: true, message: "" },
      contractValid: { valid: true, message: "" },
      dailyLimit: { valid: true, message: "", needsCFO: false },
    };

    // 1. Price Match (Toleransi 5jt)
    const invoiceTotal = calculateGrandTotal();
    const agreementTotal = agreementData.totalValue;
    if (Math.abs(invoiceTotal - agreementTotal) > 5000000) { 
      results.priceMatch = {
        valid: false,
        message: `Mismatch! Agreement: ${formatCurrency(agreementTotal)} vs Invoice: ${formatCurrency(invoiceTotal)}`,
      };
    } else {
        results.priceMatch = { valid: true, message: "✅ Price Match Verified" };
    }

    // 2. Quantity (Mock Logic: Pass if > 0)
    const requestedQty = formData.items.reduce((acc, i) => acc + i.quantity, 0);
    if(requestedQty > 0) {
        results.qtyAvailable = { valid: true, message: "✅ Quantity Available" };
    } else {
        results.qtyAvailable = { valid: false, message: "❌ Invalid Quantity" };
    }

    // 3. Period
    const invoiceDate = new Date(formData.date);
    const startDate = new Date(agreementData.contractPeriod.start);
    const endDate = new Date(agreementData.contractPeriod.end);
    invoiceDate.setHours(0,0,0,0);
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    if (invoiceDate < startDate || invoiceDate > endDate) {
      results.contractValid = {
        valid: false,
        message: `Date outside contract period (${agreementData.contractPeriod.start} - ${agreementData.contractPeriod.end})`,
      };
    } else {
        results.contractValid = { valid: true, message: "✅ Contract Period Valid" };
    }

    // 4. Daily Limit Check
    const categoryLimit = dailyLimits[agreementData.category] || 50000000;
    const currentTotal = calculateGrandTotal();
    const isOverLimit = currentTotal > categoryLimit;
    const isPriceMismatch = !results.priceMatch.valid;

    if (isOverLimit || isPriceMismatch) {
      results.dailyLimit = {
        valid: true, // Tombol tetap aktif tapi warna orange
        needsCFO: true, 
        message: isPriceMismatch 
          ? "⚠️ Flagged for CFO: Price mismatch detected" 
          : `Exceeds daily limit! Total: ${formatCurrency(currentTotal)} > Limit: ${formatCurrency(categoryLimit)}`,
      };
    }

    setValidationResults(results);
  };

  useEffect(() => {
    // Jalankan validasi setiap kali data berubah
    if (isInvoiceUploaded && agreementData) {
      performValidation();
    }
  }, [formData, agreementData, isInvoiceUploaded]);

  // AI SCANNING
  const scanReceiptWithAI = async (imageFile) => {
    setIsScanning(true);
    setScanStatus("🔒 Securing Connection...");
    setExtractedData(null);
    setValidationResults(null);

    try {
      if (!API_KEY) throw new Error("API Key Missing");

      setScanStatus("🤖 Gemini AI Analyzing...");
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const base64Data = await fileToBase64(imageFile);
      const imagePart = { inlineData: { data: base64Data, mimeType: imageFile.type } };

      const prompt = `Extract invoice data to JSON: {"vendor": "str", "invoiceNumber": "str", "date": "YYYY-MM-DD", "items": [{"description": "str", "quantity": number, "unitPrice": number}], "taxAmount": number}`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
      const data = JSON.parse(text);

      setScanStatus("✅ Extraction Complete!");

      const mappedItems = data.items.map((item, idx) => ({
        id: Date.now() + idx,
        description: item.description || "Item",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      }));

      const totalCalculated = mappedItems.reduce((sum, i) => sum + i.total, 0);

      const extractedInfo = {
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber || "",
        date: data.date || new Date().toISOString().split("T")[0],
        items: mappedItems,
        taxAmount: Number(data.taxAmount) || 0,
        extractedTotal: totalCalculated,
      };

      setExtractedData(extractedInfo);
      setFormData({
        vendor: extractedInfo.vendor,
        invoiceNumber: extractedInfo.invoiceNumber,
        date: extractedInfo.date,
        category: agreementData?.category || "",
        items: mappedItems,
        taxAmount: extractedInfo.taxAmount,
        extractedTotal: totalCalculated,
      });

      // 🔥 CRITICAL: Set Invoice Uploaded TRUE to reveal form
      setIsInvoiceUploaded(true);

    } catch (error) {
      console.log("Using Mock Data due to AI Error:", error);
      // Fallback Mock
      const mockResult = {
        vendor: "MOCK VENDOR PT",
        invoiceNumber: "INV-MOCK-001",
        date: new Date().toISOString().split("T")[0],
        items: [{ id: Date.now(), description: "Item Jasa", quantity: 1, unitPrice: 100000, total: 100000 }],
        taxAmount: 0,
        extractedTotal: 100000,
      };
      setExtractedData(mockResult);
      setFormData({ ...mockResult, category: agreementData?.category || "" });
      setIsInvoiceUploaded(true);
    } finally {
        setIsScanning(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedAgreement) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      scanReceiptWithAI(selectedFile);
    }
  };

  const handleItemChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          let cleanValue = value;
          if (field === "quantity" || field === "unitPrice") {
            cleanValue = parseNumber(value);
          }
          const updated = { ...item, [field]: cleanValue };
          if (field === "quantity" || field === "unitPrice") {
            updated.total = Number(updated.quantity) * Number(updated.unitPrice);
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const handleSubmit = async () => {
    if (!account) { notify.error("Wallet Not Connected"); return; }
    if (!contracts.invoiceVerification) { notify.error("Blockchain Not Ready"); return; }

    setIsSubmitting(true);
    try {
        const invoiceTotal = calculateGrandTotal();
        const totalQty = formData.items.reduce((acc, i) => acc + i.quantity, 0);
        const invoiceId = `INV-${Date.now()}`;
        
        notify.info("Initiating Transaction", "Please confirm in your wallet...");
        
        const tx = await contracts.invoiceVerification.submitInvoice(
            invoiceId,
            selectedAgreement,
            formData.invoiceNumber,
            Math.floor(new Date(formData.date).getTime() / 1000),
            Math.floor(Date.now() / 1000),
            totalQty,
            invoiceTotal,
            1,
            "QmIPFSMock", "QmDeliveryMock", []
        );

        notify.info("Mining Transaction", "Waiting for block confirmation...");
        await tx.wait();

        // Sync DB
        const status = validationResults?.dailyLimit.needsCFO ? 'needs_cfo' : 'verified';
        const payload = {
            vendorName: formData.vendor,
            invoiceNumber: formData.invoiceNumber,
            date: formData.date,
            totalAmount: invoiceTotal,
            taxAmount: formData.taxAmount,
            items: formData.items,
            agreementId: selectedAgreement, 
            userId: "9b4a727a-31ec-488a-9b5f-3a9c5a04fa22", // Mock User
            status: status,
            txHash: tx.hash
        };

        await apiService.submitReceipt(payload);

        if (status === 'verified') {
            notify.success("Minted & Verified", `Hash: ${tx.hash.substring(0, 10)}...`);
        } else {
            notify.warning("Submitted for Approval", "Transaction recorded but flagged for CFO.");
        }
        setTimeout(() => navigate("/dashboard"), 2000);

    } catch (error) {
        console.error("Submission Error:", error);
        notify.error("Transaction Failed", error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = !selectedAgreement || !isInvoiceUploaded || isSubmitting;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050A14] text-slate-300 p-6 md:p-12 selection:bg-cyan-500/30">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4 fade-in-entry">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center backdrop-blur-md">
            <span className="text-cyan-400 font-bold text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Submit Invoice</h1>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">On-Chain Verification</p>
          </div>
        </div>

        {/* Step 1: Agreement */}
        <div className="fade-in-entry mb-6 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyan-500 rounded-full"></span>
            Step 1: Select Purchase Agreement
          </h3>
          <select
            value={selectedAgreement}
            onChange={(e) => { setSelectedAgreement(e.target.value); handleAgreementSelect(e.target.value); }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none"
          >
            <option value="">-- Select Active Agreement --</option>
            {agreements.map((agr) => (
              <option key={agr.id} value={agr.id}>{agr.id} - {agr.itemName} ({agr.vendor})</option>
            ))}
          </select>
        </div>

        {/* Step 2: Upload */}
        <div className="fade-in-entry mb-6 bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyan-500 rounded-full"></span>
            Step 2: Upload Invoice
          </h3>
          <div className="relative group">
            <div
              onClick={() => selectedAgreement && !isScanning && document.getElementById("fileInput").click()}
              className={`relative border border-dashed rounded-2xl p-8 min-h-[200px] flex flex-col justify-center items-center bg-[#0B1120] ${
                !selectedAgreement ? "opacity-50 cursor-not-allowed border-slate-700" : "border-white/10 hover:border-cyan-500/30 cursor-pointer"
              }`}
            >
              <input id="fileInput" type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={!selectedAgreement || isScanning} />
              {isScanning ? <div className="text-cyan-400 font-bold animate-pulse">{scanStatus}</div> : preview ? <img src={preview} alt="Invoice" className="h-64 object-contain" /> : <div className="text-center text-slate-400">Click to Upload Invoice Image</div>}
            </div>
          </div>
        </div>

        {/* Step 3: Validations (PASTI MUNCUL JIKA ADA HASIL) */}
        {validationResults && (
           <div className="fade-in-entry mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 1. Price Match */}
             <div className={`p-4 rounded-xl border flex items-center gap-3 ${validationResults.priceMatch.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/30"}`}>
                 <span className="text-xl">{validationResults.priceMatch.valid ? "✅" : "❌"}</span>
                 <div className="text-sm font-bold text-slate-300">
                    {validationResults.priceMatch.valid ? "Price Match" : "Price Mismatch"}
                 </div>
             </div>

             {/* 2. Quantity */}
             <div className={`p-4 rounded-xl border flex items-center gap-3 ${validationResults.qtyAvailable.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/30"}`}>
                 <span className="text-xl">{validationResults.qtyAvailable.valid ? "✅" : "❌"}</span>
                 <div className="text-sm font-bold text-slate-300">Quantity Check</div>
             </div>

             {/* 3. Date */}
             <div className={`p-4 rounded-xl border flex items-center gap-3 ${validationResults.contractValid.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/30"}`}>
                 <span className="text-xl">{validationResults.contractValid.valid ? "✅" : "❌"}</span>
                 <div className="text-sm font-bold text-slate-300">
                    {validationResults.contractValid.valid ? "Date within Period" : "Date Expired"}
                 </div>
             </div>

             {/* 4. CFO Warning (Full Width) */}
             {validationResults.dailyLimit.needsCFO && (
               <div className="md:col-span-2 p-4 rounded-xl border bg-amber-500/5 border-amber-500/30 flex items-center gap-3">
                 <span className="text-3xl">⚠️</span>
                 <div className="flex-1">
                   <div className="font-bold text-sm text-amber-400">Requires CFO Approval</div>
                   <div className="text-xs text-amber-300 mt-1">{validationResults.dailyLimit.message}</div>
                 </div>
               </div>
             )}
           </div>
        )}

        {/* FORM EDITABLE DETAILS (PASTI MUNCUL) */}
        {isInvoiceUploaded && (
          <div className="fade-in-entry bg-[#0B1120] border border-white/5 rounded-xl p-6 mt-8">
            <h3 className="text-white font-bold mb-4 text-lg border-b border-white/10 pb-2">Editable Invoice Details</h3>

            <div className="mb-4">
               <label className="text-slate-500 text-xs font-bold mb-1 block">Invoice Date</label>
               <input 
                 type="date" 
                 value={formData.date}
                 onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                 className="bg-slate-900 border border-white/10 rounded px-3 py-2 text-white text-sm w-full outline-none focus:border-cyan-500"
               />
            </div>

            <div className="space-y-3 mb-6">
              {formData.items.map((item) => (
                <div key={item.id} className="bg-slate-900/30 border border-white/5 rounded-lg p-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-500">Description</label>
                        <input value={item.description} onChange={(e) => handleItemChange(item.id, "description", e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-500">Quantity</label>
                         <input type="text" value={formatThousand(item.quantity)} onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white text-center" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-500">Unit Price (Rp)</label>
                         <input type="text" value={formatThousand(item.unitPrice)} onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white text-right" />
                      </div>
                   </div>
                   <div className="mt-2 text-right text-xs text-slate-400">Item Total: {formatCurrency(item.total)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-lg mb-6">
               <span className="text-sm text-slate-400">Grand Total</span>
               <span className="text-xl font-bold text-cyan-400">{formatCurrency(calculateGrandTotal())}</span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-4 font-bold rounded-lg text-sm uppercase bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                className={`flex-[2] py-4 font-bold rounded-lg text-sm uppercase transition-all shadow-lg flex justify-center items-center gap-2 ${
                  isSubmitDisabled
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : validationResults?.dailyLimit.needsCFO
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/30"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30"
                }`}
              >
                {isSubmitting ? "Processing..." : validationResults?.dailyLimit.needsCFO ? "⚠️ Submit for CFO Approval" : "🚀 Auto-Approve & Mint"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadReceipt;