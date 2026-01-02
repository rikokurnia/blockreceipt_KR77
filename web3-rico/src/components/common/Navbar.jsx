// ==================== NAVBAR COMPONENT ====================
// src/components/common/Navbar.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";
import Button from "./Button";
import BlockChainLogo from "../../assets/BlockChain-logo.png";

// Helper function
const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { account, disconnect, isConnected, userRole } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleConnect = () => {
    navigate("/connect");
  };

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={cn(
        "navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || location.pathname !== "/"
          ? "bg-primary-800/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={BlockChainLogo} alt="BlockReceipt Logo" className="w-12 h-12" />            {/* <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              {/* <span className="text-white font-bold text-xl">BR</span> */}
            <span className="text-xl font-bold text-white">BlockReceipt</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isConnected && userRole === "auditor" && (
              <>
                <Link
                  to="/upload"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive("/upload")
                      ? "text-secondary-400"
                      : "text-neutral-300 hover:text-white"
                  )}
                >
                  Upload Receipt
                </Link>
                <Link
                  to="/auditor/submissions"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive("/auditor/submissions")
                      ? "text-secondary-400"
                      : "text-neutral-300 hover:text-white"
                  )}
                >
                  My Submissions
                </Link>
              </>
            )}

            {isConnected && userRole === "cfo" && (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive("/dashboard")
                      ? "text-secondary-400"
                      : "text-neutral-300 hover:text-white"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  to="/reports"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive("/reports")
                      ? "text-secondary-400"
                      : "text-neutral-300 hover:text-white"
                  )}
                >
                  Reports
                </Link>
              </>
            )}

            {!isConnected && (
              <>
                <a
                  href="/#features"
                  className="text-neutral-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Features
                </a>
                <Link
                  to="/pricing"
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive("/pricing")
                      ? "text-secondary-400"
                      : "text-neutral-300 hover:text-white"
                  )}
                >
                  Pricing
                </Link>
              </>
            )}
          </div>

          {/* Connect Wallet / Account */}
          <div className="hidden md:flex items-center gap-4">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="w-2 h-2 bg-success-500 rounded-full" />
                  <span className="text-sm text-neutral-300">
                    {formatAddress(account)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-neutral-300 text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-800 border-t border-neutral-700">
          <div className="px-4 py-4 space-y-3">
            {isConnected && userRole === "auditor" && (
              <>
                <Link
                  to="/upload"
                  className="block text-neutral-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Upload Receipt
                </Link>
                <Link
                  to="/auditor/submissions"
                  className="block text-neutral-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Submissions
                </Link>
              </>
            )}

            {isConnected && userRole === "cfo" && (
              <>
                <Link
                  to="/dashboard"
                  className="block text-neutral-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/reports"
                  className="block text-neutral-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reports
                </Link>
              </>
            )}

            <div className="pt-4 border-t border-neutral-700">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700 mb-3">
                    <div className="w-2 h-2 bg-success-500 rounded-full" />
                    <span className="text-sm text-neutral-300">
                      {formatAddress(account)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnect}
                  className="w-full"
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
