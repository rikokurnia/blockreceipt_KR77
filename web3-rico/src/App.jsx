import { Routes, Route, Navigate } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
// import { NotificationProvider } from "./components/NotificationSystem";

// Pages - Phase 1
import Landing from "./pages/Landing";
import WalletConnection from "./pages/WalletConnection";
import UploadReceipt from "./pages/UploadReceipt";
import ReceiptSuccess from "./pages/ReceiptSuccess";
import Pricing from "./pages/Pricing";

// Pages - Phase 2 (Finance Team & CFO)
import AuditorSubmissions from "./pages/AuditorSubmissions";
import FinanceDashboard from "./pages/FinanceDashboard";
import CFODashboard from "./pages/CFODashboard";
import Reports from "./pages/Reports";

// Pages - Phase 3 (ZK Proofs)
import ZKDashboard from "./pages/ZKDashboard";
import ZKGenerator from "./pages/ZKGenerator";
import ZKVerification from "./pages/ZKVerification";

// PHASE 1 CRITICAL PAGES
import DailyLimitSettings from "./pages/DailyLimitSettings";
import AgreementCreate from "./pages/AgreementCreate";
import AgreementList from "./pages/AgreementList";
import CFOApprovals from "./pages/CFOApprovals";

// PHASE 2 - VENDOR PAGES
import VendorDashboard from "./pages/VendorDashboard";
import AgreementReview from "./pages/AgreementReview";
import { NotificationProvider } from "./pages/NotificationSystem";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isConnected, userRole } = useWeb3();

  if (!isConnected) {
    return <Navigate to="/connect" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "finance") {
      return <Navigate to="/finance/dashboard" replace />;
    } else if (userRole === "auditor") {
      return <Navigate to="/upload" replace />;
    } else if (userRole === "cfo") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <NotificationProvider>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Landing />} />
        <Route path="/connect" element={<WalletConnection />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* ===== FINANCE TEAM ROUTES ===== */}
        <Route
          path="/finance/dashboard"
          element={
            <ProtectedRoute allowedRoles={["finance"]}>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={["auditor", "finance"]}>
              <UploadReceipt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditor/submissions"
          element={
            <ProtectedRoute allowedRoles={["auditor", "finance"]}>
              <AuditorSubmissions />
            </ProtectedRoute>
          }
        />

        {/* ===== AGREEMENT MANAGEMENT (Finance Team + CFO) ===== */}
        <Route
          path="/agreements"
          element={
            <ProtectedRoute allowedRoles={["auditor", "finance", "cfo"]}>
              <AgreementList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agreements/create"
          element={
            <ProtectedRoute allowedRoles={["auditor", "finance"]}>
              <AgreementCreate />
            </ProtectedRoute>
          }
        />

        {/* ===== CFO ROUTES ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <CFODashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/daily-limits"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <DailyLimitSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <CFOApprovals />
            </ProtectedRoute>
          }
        />

        {/* ===== ZK PROOF ROUTES (CFO Only) ===== */}
        <Route
          path="/zk/dashboard"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <ZKDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zk/generate"
          element={
            <ProtectedRoute allowedRoles={["cfo"]}>
              <ZKGenerator />
            </ProtectedRoute>
          }
        />
        <Route path="/zk/verify/:proofId" element={<ZKVerification />} />

        {/* ===== VENDOR ROUTES ===== */}
        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/agreements/:agreementId/review"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <AgreementReview />
            </ProtectedRoute>
          }
        />

        {/* ===== SHARED ROUTES ===== */}
        <Route
          path="/receipt/:receiptId"
          element={
            <ProtectedRoute>
              <ReceiptSuccess />
            </ProtectedRoute>
          }
        />

        {/* ===== FALLBACK ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
