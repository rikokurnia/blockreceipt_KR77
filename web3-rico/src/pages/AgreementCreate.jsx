import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { apiService } from "../services/api"; // IMPORT API SERVICE

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

const AgreementCreate = () => {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [step, setStep] = useState(1); // 1: Form, 2: Review, 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedAgreement, setGeneratedAgreement] = useState(null);

  // DATA MASTER DARI DB
  const [dbVendors, setDbVendors] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    vendor: "", // Ini akan menyimpan vendorID
    category: "", // Ini akan menyimpan categoryID
    items: [
      {
        id: 1,
        itemName: "",
        specifications: "",
        pricePerUnit: 0,
        quantity: 1,
      },
    ],
    contractPeriod: {
      start: new Date().toISOString().split("T")[0],
      end: "",
    },
    paymentTerms: "full", // 'full' or 'installment'
    installments: [{ id: 1, milestone: "", quantity: 0, amount: 0 }],
    draftContract: null,
  });

  // LOAD DATA MASTER ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vData, cData] = await Promise.all([
          apiService.getVendors(),
          apiService.getCategories(),
        ]);
        setDbVendors(vData);
        setDbCategories(cData);
      } catch (err) {
        console.error("Gagal load data master", err);
      }
    };
    loadData();
  }, []);

  // Helpers untuk menampilkan Nama Vendor/Kategori di Review Page (karena state nyimpen ID)
  const getVendorName = (id) => dbVendors.find((v) => v.id === id)?.name || id;
  const getCategoryName = (id) =>
    dbCategories.find((c) => c.id === id)?.name || id;

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".step-indicator",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(2)",
        }
      );

      gsap.fromTo(
        ".form-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [step]);

  // ===== ITEM MANAGEMENT =====
  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          itemName: "",
          specifications: "",
          pricePerUnit: 0,
          quantity: 1,
        },
      ],
    }));
  };

  const handleRemoveItem = (id) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          let cleanValue = value;
          if (field === "pricePerUnit" || field === "quantity") {
            cleanValue = parseNumber(value);
          }
          return { ...item, [field]: cleanValue };
        }
        return item;
      }),
    }));
  };

  // ===== INSTALLMENT MANAGEMENT =====
  const handleAddInstallment = () => {
    setFormData((prev) => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          id: Date.now(),
          milestone: "",
          quantity: 0,
          amount: 0,
        },
      ],
    }));
  };

  const handleRemoveInstallment = (id) => {
    if (formData.installments.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      installments: prev.installments.filter((i) => i.id !== id),
    }));
  };

  const handleInstallmentChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      installments: prev.installments.map((inst) => {
        if (inst.id === id) {
          const updated = {
            ...inst,
            [field]: field === "quantity" ? parseNumber(value) : value,
          };

          // Auto-calculate amount based on total agreement amount
          if (field === "quantity") {
            const totalAmount = calculateTotalAmount();
            const totalQty = formData.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            updated.amount =
              totalQty > 0 ? (updated.quantity / totalQty) * totalAmount : 0;
          }

          return updated;
        }
        return inst;
      }),
    }));
  };

  // ===== CALCULATIONS =====
  const calculateTotalAmount = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.pricePerUnit * item.quantity;
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const totalAmount = calculateTotalAmount();
  const totalQuantity = calculateTotalQuantity();
  const installmentTotal = formData.installments.reduce(
    (acc, i) => acc + i.amount,
    0
  );

  // ===== SUBMIT KE BACKEND =====
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. Transform Data sesuai format Backend (server.ts)
      const payload = {
        vendorId: formData.vendor,
        categoryId: formData.category,
        title: `Purchase Agreement - ${new Date().toLocaleDateString()}`,
        startDate: formData.contractPeriod.start,
        endDate: formData.contractPeriod.end,
        paymentTerms:
          formData.paymentTerms === "full" ? "Full Payment" : "Installment",
        // Mapping item fields
        items: formData.items.map((item) => ({
          itemName: item.itemName,
          specifications: item.specifications,
          quantity: item.quantity,
          unitPrice: item.pricePerUnit, // Di backend namanya unitPrice
        })),
        // Hardcode User ID (Finance Admin) sementara
        createdBy: "8a2cad46-8d21-46b7-b93c-a3ce1a418001",
      };

      // 2. Call API
      const result = await apiService.createAgreement(payload);

      // 3. Update State Success
      const agreement = {
        id: result.data.id, // ID asli dari DB (AGR-2025-...)
        ...formData,
        vendor: getVendorName(formData.vendor), // Tampilkan nama, bukan ID
        category: getCategoryName(formData.category), // Tampilkan nama, bukan ID
        totalAmount,
        totalQuantity,
        status: "Waiting Vendor Approval",
        createdAt: new Date().toISOString(),
        createdBy: "Finance Team",
      };

      setGeneratedAgreement(agreement);
      setIsSubmitting(false);
      setStep(3);
    } catch (error) {
      alert("Error: " + error.message);
      setIsSubmitting(false);
    }
  };

  const StepIndicator = ({ num, label, active }) => (
    <div className="step-indicator flex flex-col items-center relative">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 ${
          active || step > num
            ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            : "bg-slate-800 text-slate-500 border border-slate-700"
        }`}
      >
        {step > num ? "✓" : num}
      </div>
      <span
        className={`mt-2 text-xs font-medium uppercase tracking-wider transition-colors ${
          active ? "text-cyan-400" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );

  // Validation
  const isFormValid = () => {
    if (
      !formData.vendor ||
      !formData.category ||
      !formData.contractPeriod.end
    ) {
      return false;
    }

    const hasValidItems = formData.items.every(
      (item) => item.itemName && item.pricePerUnit > 0 && item.quantity > 0
    );

    if (!hasValidItems) return false;

    if (
      formData.paymentTerms === "installment" &&
      Math.abs(installmentTotal - totalAmount) > 1
    ) {
      return false;
    }

    return true;
  };

  return (
    <div
      className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-cyan-500/30"
      ref={pageRef}
    >
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge
            variant="default"
            className="mb-4 border-slate-700 text-slate-400"
          >
            Finance Team Portal
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-3">
            Create Purchase Agreement
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Initiate a new purchase agreement with vendor. Agreement will be
            sent for vendor approval, then CFO final approval.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="relative flex justify-center items-center gap-16 mb-12">
          <div className="absolute top-6 left-1/4 right-1/4 h-0.5 bg-slate-800 -z-10"></div>
          <div
            className="absolute top-6 left-1/4 h-0.5 bg-cyan-500 transition-all duration-700 -z-10"
            style={{
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
              left: "25%",
            }}
          ></div>

          <StepIndicator num={1} label="Details" active={step === 1} />
          <StepIndicator num={2} label="Review" active={step === 2} />
          <StepIndicator num={3} label="Submit" active={step === 3} />
        </div>

        {/* STEP 1: Agreement Details */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="form-section p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-cyan-500 rounded-full"></span>
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Vendor *
                  </label>
                  <select
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {/* MODIFIKASI: Menggunakan Data dari DB */}
                    {dbVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all"
                    required
                  >
                    <option value="">Select Category</option>
                    {/* MODIFIKASI: Menggunakan Data dari DB */}
                    {dbCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Items Details */}
            <Card className="form-section p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                  Items Details
                </h3>
                <button
                  onClick={handleAddItem}
                  className="text-sm bg-purple-500 hover:bg-purple-400 text-white font-bold px-4 py-2 rounded-lg transition-all"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/30 border border-white/5 rounded-xl p-5 group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-white">
                        Item #{idx + 1}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "itemName",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Laptop Dell Latitude 5420"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-all placeholder-slate-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Specifications
                        </label>
                        <textarea
                          value={item.specifications}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "specifications",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Intel i5, 8GB RAM, 256GB SSD"
                          rows="2"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-all placeholder-slate-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            Price per Unit (IDR) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                              Rp
                            </span>
                            <input
                              type="text"
                              value={formatThousand(item.pricePerUnit)}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "pricePerUnit",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-right focus:border-purple-500/50 outline-none transition-all font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            Quantity *
                          </label>
                          <input
                            type="text"
                            value={formatThousand(item.quantity)}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white text-center focus:border-purple-500/50 outline-none transition-all font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                            Subtotal
                          </label>
                          <div className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-purple-400 text-right font-mono font-bold">
                            {formatCurrency(item.pricePerUnit * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Total Items</span>
                  <span className="text-lg font-bold text-white">
                    {formData.items.length} item(s)
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Total Quantity</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {totalQuantity} units
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-sm font-bold text-purple-400">
                    Total Agreement Value
                  </span>
                  <span className="text-2xl font-bold text-purple-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Contract Period */}
            <Card className="form-section p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                Contract Period
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.contractPeriod.start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractPeriod: {
                          ...formData.contractPeriod,
                          start: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all [color-scheme:dark]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.contractPeriod.end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractPeriod: {
                          ...formData.contractPeriod,
                          end: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-all [color-scheme:dark]"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Payment Terms */}
            <Card className="form-section p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                Payment Terms
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="full"
                      checked={formData.paymentTerms === "full"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    <div
                      className={`p-4 border-2 rounded-xl transition-all ${
                        formData.paymentTerms === "full"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-slate-900/30"
                      }`}
                    >
                      <div className="font-bold text-white mb-1">
                        Full Payment
                      </div>
                      <div className="text-xs text-slate-400">
                        Single payment after delivery
                      </div>
                    </div>
                  </label>

                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="installment"
                      checked={formData.paymentTerms === "installment"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="hidden"
                    />
                    {/* <div
                      className={`p-4 border-2 rounded-xl transition-all ${
                        formData.paymentTerms === "installment"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-slate-900/30"
                      }`}
                    >
                      <div className="font-bold text-white mb-1">
                        Installment Payment
                      </div>
                      <div className="text-xs text-slate-400">
                        Multiple payments by milestone
                      </div>
                    </div> */}
                  </label>
                </div>

                {formData.paymentTerms === "installment" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    {formData.installments.map((inst, idx) => (
                      <div
                        key={inst.id}
                        className="bg-slate-800/30 border border-white/5 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-white">
                            Milestone {idx + 1}
                          </span>
                          {formData.installments.length > 1 && (
                            <button
                              onClick={() => handleRemoveInstallment(inst.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              Milestone Name
                            </label>
                            <input
                              type="text"
                              value={inst.milestone}
                              onChange={(e) =>
                                handleInstallmentChange(
                                  inst.id,
                                  "milestone",
                                  e.target.value
                                )
                              }
                              placeholder={`Milestone ${idx + 1}`}
                              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              Quantity (units)
                            </label>
                            <input
                              type="text"
                              value={formatThousand(inst.quantity)}
                              onChange={(e) =>
                                handleInstallmentChange(
                                  inst.id,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-sm text-white text-center focus:border-cyan-500/50 outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              Amount
                            </label>
                            <div className="text-sm text-white font-mono font-bold bg-slate-950 border border-white/10 rounded px-3 py-2">
                              {formatCurrency(inst.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleAddInstallment}
                      className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-cyan-500 transition-all"
                    >
                      + Add Milestone
                    </button>

                    {Math.abs(installmentTotal - totalAmount) > 1 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400">
                        ⚠️ Installment total ({formatCurrency(installmentTotal)}
                        ) doesn't match agreement total (
                        {formatCurrency(totalAmount)})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="form-section flex gap-4">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => navigate("/agreements")}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-[2]"
                onClick={() => setStep(2)}
                disabled={!isFormValid()}
              >
                Continue to Review →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="form-section p-8">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                Review Agreement Details
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Vendor
                    </div>
                    {/* MODIFIKASI: Tampilkan Nama, bukan ID */}
                    <div className="text-white font-medium">
                      {getVendorName(formData.vendor)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Category
                    </div>
                    {/* MODIFIKASI: Tampilkan Nama, bukan ID */}
                    <div className="text-white font-medium">
                      {getCategoryName(formData.category)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Contract Period
                    </div>
                    <div className="text-white font-medium">
                      {formData.contractPeriod.start} to{" "}
                      {formData.contractPeriod.end}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      Payment Terms
                    </div>
                    <div className="text-white font-medium">
                      {formData.paymentTerms === "full"
                        ? "Full Payment"
                        : `Installment (${formData.installments.length} milestones)`}
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-white/10 pt-6">
                  <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Items ({formData.items.length})
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/30 border border-white/5 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-white font-bold mb-1">
                              {idx + 1}. {item.itemName}
                            </div>
                            {item.specifications && (
                              <div className="text-xs text-slate-400">
                                {item.specifications}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm mt-3 pt-3 border-t border-white/10">
                          <div>
                            <span className="text-slate-500">Price/Unit: </span>
                            <span className="text-white font-mono font-bold">
                              {formatCurrency(item.pricePerUnit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Qty: </span>
                            <span className="text-white font-mono font-bold">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">Total: </span>
                            <span className="text-purple-400 font-mono font-bold">
                              {formatCurrency(
                                item.pricePerUnit * item.quantity
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.paymentTerms === "installment" && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="text-sm font-bold text-white mb-3">
                      Payment Milestones
                    </div>
                    <div className="space-y-2">
                      {formData.installments.map((inst, idx) => (
                        <div
                          key={inst.id}
                          className="flex justify-between items-center bg-slate-800/30 px-4 py-2 rounded"
                        >
                          <span className="text-slate-400 text-sm">
                            {inst.milestone || `Milestone ${idx + 1}`} -{" "}
                            {inst.quantity} units
                          </span>
                          <span className="text-white font-mono font-bold">
                            {formatCurrency(inst.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">
                        Total Items
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formData.items.length}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">
                        Total Quantity
                      </div>
                      <div className="text-xl font-bold text-white">
                        {totalQuantity} units
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-cyan-500/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">
                        Total Agreement Value
                      </span>
                      <span className="text-3xl font-bold text-cyan-400">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="form-section bg-amber-900/10 border border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="text-amber-400 font-bold mb-1">
                  Review Carefully
                </h4>
                <p className="text-sm text-amber-200/70">
                  Once submitted, this agreement will be sent to the vendor for
                  approval. After vendor approval, it will require CFO final
                  approval before becoming active.
                </p>
              </div>
            </div>

            <div className="form-section flex gap-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                ← Back to Edit
              </Button>
              <Button
                variant="primary"
                className="flex-[2]"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    Submitting Draft...
                  </span>
                ) : (
                  "Submit Agreement Draft"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && generatedAgreement && (
          <div className="text-center space-y-8">
            <div className="form-section">
              <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-6 animate-bounce-subtle">
                ✓
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Agreement Draft Created!
              </h2>
              <p className="text-slate-400 mb-6">
                Your purchase agreement has been submitted for vendor approval.
              </p>

              <div className="inline-flex items-center gap-3 bg-slate-900/50 border border-white/10 rounded-xl px-6 py-3">
                <span className="text-sm text-slate-400">Agreement ID:</span>
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {generatedAgreement.id}
                </span>
              </div>
            </div>

            <Card className="form-section text-left p-6">
              <h3 className="font-bold text-white mb-4">What's Next?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-white font-medium">Vendor Review</div>
                    <div className="text-slate-400 text-xs">
                      Vendor will be notified to review and approve this
                      agreement
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-white font-medium">CFO Approval</div>
                    <div className="text-slate-400 text-xs">
                      After vendor approval, CFO will give final approval
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      Smart Contract Created
                    </div>
                    <div className="text-slate-400 text-xs">
                      Agreement will be minted to blockchain and become active
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="form-section flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/agreements")}
              >
                View All Agreements
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setGeneratedAgreement(null);
                  setFormData({
                    vendor: "",
                    category: "",
                    items: [
                      {
                        id: 1,
                        itemName: "",
                        specifications: "",
                        pricePerUnit: 0,
                        quantity: 1,
                      },
                    ],
                    contractPeriod: {
                      start: new Date().toISOString().split("T")[0],
                      end: "",
                    },
                    paymentTerms: "full",
                    installments: [
                      { id: 1, milestone: "", quantity: 0, amount: 0 },
                    ],
                    draftContract: null,
                  });
                }}
              >
                Create Another Agreement
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgreementCreate;
