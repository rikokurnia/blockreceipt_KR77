import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

const ReceiptSuccess = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-900">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-success-600 to-success-500 rounded-2xl p-12 text-center mb-8">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Receipt Successfully Recorded
          </h1>
          <p className="text-success-100 text-lg">to Blockchain</p>
          <div className="mt-4">
            <span className="px-4 py-2 bg-white/20 rounded-lg text-white font-mono">
              {receiptId || "RCP-2025-00123"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Blockchain Proof */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-6">
              🔗 Blockchain Proof
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-400 mb-1">
                  Transaction Hash
                </div>
                <div className="font-mono text-sm text-white break-all">
                  0xabc123...def789
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-1">
                  Block Number
                </div>
                <div className="text-white">#1,234,567</div>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-1">Network</div>
                <div className="text-white">Lisk Sepolia Testnet</div>
              </div>
              <Button variant="secondary" size="sm" className="w-full">
                View on Explorer →
              </Button>
            </div>
          </Card>

          {/* IPFS Storage */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-6">
              📦 IPFS Storage
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-400 mb-1">Content ID</div>
                <div className="font-mono text-sm text-white break-all">
                  QmX5g7...hN8p
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-1">File Hash</div>
                <div className="font-mono text-sm text-white break-all">
                  sha256:abc...
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full">
                View Original File →
              </Button>
            </div>
          </Card>
        </div>

        {/* Receipt Details */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Receipt Details
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-neutral-400 mb-1">Vendor</div>
              <div className="text-white">Hotel Mulia Jakarta</div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Amount</div>
              <div className="text-white">Rp 2,850,000</div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Date</div>
              <div className="text-white">2025-01-18</div>
            </div>
            <div>
              <div className="text-sm text-neutral-400 mb-1">Category</div>
              <div className="text-white">Travel</div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => navigate("/upload")}
          >
            Upload Another Receipt
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate("/dashboard")}
          >
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptSuccess;
