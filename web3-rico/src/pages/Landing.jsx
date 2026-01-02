import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/common/Navbar"; // Asumsi path navbar
import microchip from "../assets/microchip.png";
import shield from "../assets/shield.png";
gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  const navigate = useNavigate();
  const mainRef = useRef(null);

  // State untuk Pricing Toggle (Monthly/Yearly) - UX Interaktif
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ========================================================
      // 1. HERO SECTION ANIMATION
      // ========================================================
      const heroTl = gsap.timeline();

      // Text Reveal Effect (Masking)
      heroTl.fromTo(
        ".hero-text-mask",
        { y: 100, skewY: 7, opacity: 0 },
        {
          y: 0,
          skewY: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
          ease: "power4.out",
        }
      );

      // Floating 3D Card Entry
      heroTl.fromTo(
        ".hero-card-visual",
        { scale: 0.8, opacity: 0, rotationY: 25, rotationX: 10 },
        {
          scale: 1,
          opacity: 1,
          rotationY: -5,
          rotationX: 5,
          duration: 1.5,
          ease: "power2.out",
        },
        "-=1"
      );

      // Background Ambient Movement
      gsap.to(".ambient-glow", {
        x: "random(-100, 100)",
        y: "random(-50, 50)",
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 2,
      });

      // ========================================================
      // 2. FEATURES (BENTO GRID) ANIMATION
      // ========================================================
      gsap.fromTo(
        ".bento-item",
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#features",
            start: "top 70%",
          },
        }
      );

      // ========================================================
      // 3. WORKFLOW (PIPELINE) ANIMATION
      // ========================================================
      const pipelineTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#workflow",
          start: "top 60%",
          end: "bottom bottom",
          toggleActions: "play none none reverse",
        },
      });

      // Reveal Cards
      pipelineTl.fromTo(
        ".workflow-step",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.2 }
      );

      // Draw the Beam Line
      pipelineTl.fromTo(
        ".connector-line-path",
        { strokeDasharray: 1000, strokeDashoffset: 1000 },
        { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" },
        "-=0.5"
      );

      // Activate Nodes
      pipelineTl.to(
        ".workflow-node",
        {
          backgroundColor: "#06b6d4", // Cyan
          boxShadow: "0 0 15px #06b6d4",
          scale: 1.2,
          duration: 0.3,
          stagger: 0.4,
        },
        "-=1.5"
      );

      // ========================================================
      // 4. PRICING ANIMATION
      // ========================================================
      gsap.fromTo(
        ".pricing-card",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)", // Sedikit memantul
          scrollTrigger: {
            trigger: "#pricing",
            start: "top 75%",
          },
        }
      );
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans"
    >
      <Navbar />

      {/* ==================================================================
          SECTION 1: HERO (THE LIVING LEDGER)
      ================================================================== */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          {/* Glowing Orbs */}
          <div className="ambient-glow absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-800/20 rounded-full blur-[120px]" />
          <div className="ambient-glow absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-800/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div>
            <div className="overflow-hidden mb-2">
              <div className="hero-text-mask flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-wider uppercase">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                Enterprise Ready Web3
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              <div className="overflow-hidden">
                <span className="hero-text-mask block">Receipts that</span>
              </div>
              <div className="overflow-hidden">
                <span className="hero-text-mask block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
                  Don't Just Exist.
                </span>
              </div>
              <div className="overflow-hidden">
                <span className="hero-text-mask block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  They Prove.
                </span>
              </div>
            </h1>

            <div className="overflow-hidden mb-8">
              <p className="hero-text-mask text-lg text-slate-400 leading-relaxed max-w-lg">
                Eliminate expense fraud with AI-extraction and Immutable
                Blockchain Verification. The first audit trail that math can
                prove.
              </p>
            </div>

            <div className="overflow-hidden">
              <div className="hero-text-mask flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/connect")}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-cyan-50 transition-all hover:scale-105 active:scale-95"
                >
                  Launch Dashboard
                </button>
                <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2">
                  <span>▶</span> Watch Demo
                </button>
              </div>
            </div>
          </div>

          {/* Visual: 3D Floating Glass Card */}
          <div className="hero-card-visual relative hidden lg:block perspective-1000">
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] bg-gradient-to-b from-slate-800/40 to-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
              {/* Scan Line Animation */}
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]"></div>

              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="font-mono text-xs text-slate-500">
                  IPFS: QmYw...8x2
                </div>
              </div>

              {/* Receipt Content Placeholder */}
              <div className="space-y-4 flex-1 opacity-80">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Vendor</span>
                  <span className="text-white font-medium">Amazon AWS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-medium">$2,450.00</span>
                </div>
                <div className="h-px bg-white/10 my-4"></div>
                <div className="h-24 bg-white/5 rounded-lg border border-white/5 p-3">
                  <div className="text-xs text-slate-500 mb-2">
                    AI Extraction Confidence
                  </div>
                  <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-green-400 w-[98%] h-full"></div>
                  </div>
                  <div className="text-right text-xs text-green-400 mt-1">
                    98.5%
                  </div>
                </div>
              </div>

              {/* Verification Badge */}
              <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-lg">
                  ✓
                </div>
                <div>
                  <div className="text-sm font-bold text-green-400">
                    On-Chain Verified
                  </div>
                  <div className="text-xs text-green-400/60">
                    Block #18293402
                  </div>
                </div>
              </div>
            </div>

            {/* Abstract Elements behind card */}
            <div className="absolute -z-10 -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          SECTION 2: WHY BLOCKRECEIPT (BENTO GRID LAYOUT)
      ================================================================== */}
      <section id="features" className="py-24 bg-[#080808] relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why <span className="text-cyan-400">BlockReceipt?</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for the paranoid CFO. Auditable by design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
            {/* Item 1: Large (Span 2 cols) */}
            <div className="bento-item md:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-cyan-500/30 transition-colors group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-32 h-32" fill="#50e7fa" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Immutability Engine
              </h3>
              <p className="text-slate-400 max-w-md">
                Once a receipt is hashed and minted, it cannot be altered. Not
                by you, not by us, not by anyone. The ultimate truth for
                auditors.
              </p>
            </div>

            {/* Item 2: Standard */}
            <div className="bento-item bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-colors group">
              <div className="w-12 h-12  rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                <img src={microchip}></img>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI OCR</h3>
              <p className="text-slate-400 text-sm">
                Extracts vendor, date, and amount in milliseconds.
              </p>
            </div>

            {/* Item 3: Standard */}
            <div className="bento-item bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                💾
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                IPFS Storage
              </h3>
              <p className="text-slate-400 text-sm">
                Decentralized file storage ensures 100% uptime availability.
              </p>
            </div>

            {/* Item 4: Large (Span 2 cols) - Highlight ZK Proof */}
            <div className="bento-item md:col-span-2 bg-gradient-to-br from-[#111] to-cyan-900/20 border border-cyan-500/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold text-white">
                    Zero-Knowledge Proofs
                  </h3>
                  <span className="px-2 py-1 bg-cyan-500 text-black text-xs font-bold rounded uppercase">
                    Pro Feature
                  </span>
                </div>
                <p className="text-slate-300 max-w-lg">
                  Prove that expenses are within budget limits without revealing
                  the actual amounts to third-party verifiers. Privacy meets
                  Compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          SECTION 3: FROM PAPER TO BLOCK (DIGITAL CONVEYOR)
      ================================================================== */}
      <section
        id="workflow"
        className="py-32 bg-[#050505] overflow-hidden relative"
      >
        {/* Background Beam Track */}
        <div className="hidden lg:block absolute top-[55%] left-0 w-full h-px bg-white/10 -translate-y-1/2"></div>
        <svg className="hidden lg:block absolute top-[55%] left-0 w-full h-4 -translate-y-1/2 pointer-events-none z-0">
          <path
            className="connector-line-path"
            d="M 0 8 L 3000 8"
            stroke="url(#conveyorGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="conveyorGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              From Paper to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Block
              </span>
            </h2>
            <p className="text-slate-400">
              The automated pipeline for financial truth.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="workflow-step relative group">
              <div className="workflow-node absolute left-1/2 lg:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full border border-slate-600 z-20 lg:-mt-12 lg:top-1/2"></div>
              <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-600 font-bold">
                  01
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Upload & Digitize
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Auditor uploads receipt. System performs Hash calculation
                  (SHA-256) to fingerprint the file instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="workflow-step relative group">
              <div className="workflow-node absolute left-1/2 lg:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full border border-slate-600 z-20 lg:-mt-12 lg:top-1/2"></div>
              <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-600 font-bold">
                  02
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Mint & Consensus
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Smart contract executes. The unique hash is minted onto the
                  Lisk Blockchain. IPFS pins the file.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="workflow-step relative group">
              <div className="workflow-node absolute left-1/2 lg:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full border border-slate-600 z-20 lg:-mt-12 lg:top-1/2"></div>
              <div className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
                <div className="text-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-600 font-bold">
                  03
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Proof & Audit
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  CFO receives a Verifiable Credential. ZK Proofs generated for
                  external auditors to verify without viewing data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          SECTION 4: CHOOSE YOUR PLAN (ACCESS CARDS)
      ================================================================== */}
      <section id="pricing" className="py-24 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Choose Your Access</h2>

            {/* Toggle Switch */}
            <div className="flex items-center gap-4 p-1 bg-white/5 rounded-full border border-white/10">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  isAnnual
                    ? "bg-white text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Yearly{" "}
                <span className="text-xs text-green-600 font-bold ml-1">
                  -20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="pricing-card bg-[#111] border border-white/5 p-10 rounded-3xl hover:bg-white/5 transition-all group">
              <h3 className="text-xl font-medium text-slate-400 mb-4">
                Starter
              </h3>
              <div className="text-5xl font-bold text-white mb-2">$0</div>
              <p className="text-slate-500 text-sm mb-8">
                Forever free for small teams.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "50 Receipts / mo",
                  "Standard AI OCR",
                  "Lisk Testnet Only",
                  "Community Support",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                    {item}
                  </li>
                ))}
              </ul>

              <button className="w-full py-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white hover:text-black transition-all">
                Start Building
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="pricing-card relative bg-gradient-to-b from-slate-900 to-black border border-cyan-500/30 p-10 rounded-3xl shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Enterprise Choice
              </div>

              <h3 className="text-xl font-medium text-cyan-400 mb-4">
                Pro Compliance
              </h3>
              <div className="text-5xl font-bold text-white mb-2">
                {isAnnual ? "$79" : "$99"}
                <span className="text-lg text-slate-500 font-normal">/mo</span>
              </div>
              <p className="text-slate-500 text-sm mb-8">
                Full audit power for scaling finance teams.
              </p>

              <ul className="space-y-4 mb-10">
                {[
                  "Unlimited Receipts",
                  "Lisk Mainnet Verification",
                  "Zero-Knowledge Proofs",
                  "Dedicated IPFS Node",
                  "Priority Support",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></span>
                    {item}
                  </li>
                ))}
              </ul>

              <button className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-cyan-50 hover:scale-[1.02] transition-all shadow-lg">
                Get Pro Access
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center text-slate-600 text-sm bg-[#050505]">
        <p>&copy; 2025 BlockReceipt Inc. Secured by Lisk.</p>
      </footer>
    </div>
  );
};

export default Landing;
