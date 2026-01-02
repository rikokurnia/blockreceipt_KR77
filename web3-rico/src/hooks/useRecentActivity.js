import { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";
import { getAuditorName, formatBlockchainDate } from "../utils/formatters";

export const useRecentActivity = () => {
  const { contracts, provider } = useWeb3();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!contracts.invoiceVerification || !provider) return;

      try {
        setLoading(true);

        // 1. Definisikan Event yang mau diambil
        // Kita ambil event 'InvoiceSubmitted' sebagai tanda aktivitas baru
        const filter = contracts.invoiceVerification.filters.InvoiceSubmitted();
        
        // 2. Ambil logs (batasi 1000 blok terakhir agar tidak berat/timeout)
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 5000); // 5000 blok terakhir (Lisk cepat, ini aman)
        
        const logs = await contracts.invoiceVerification.queryFilter(filter, fromBlock);

        // 3. Process Logs (Mapping menjadi format tabel)
        // Kita perlu mengambil timestamp blok untuk setiap event
        const processedLogs = await Promise.all(
          logs.map(async (log) => {
            const block = await provider.getBlock(log.blockNumber);
            const { invoiceId, agreementId } = log.args;

            // Di sini kita ambil siapa yang men-submit transaksi (msg.sender dari tx)
            // Note: Event args tidak selalu punya address, kita ambil dari transaksi receipt jika perlu
            // Tapi untuk efisiensi, kita ambil tx details
            const tx = await provider.getTransaction(log.transactionHash);

            return {
              id: log.transactionHash, // Unique Key
              action: "Invoice Submitted",
              documentRef: invoiceId,
              agreementRef: agreementId,
              user: getAuditorName(tx.from), // SOLUSI NAMA AUDITOR
              userAddress: tx.from,
              timestamp: formatBlockchainDate(block.timestamp),
              rawTimestamp: block.timestamp,
              status: "Pending Check" // Default status awal
            };
          })
        );

        // 4. Sortir dari yang terbaru
        const sortedLogs = processedLogs.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

        setActivities(sortedLogs);
      } catch (error) {
        console.error("Error fetching blockchain events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Opsional: Listen to real-time events
    const listener = (invoiceId, agreementId, event) => {
       // Logic untuk update real-time bisa ditambahkan di sini
       // Untuk sekarang, kita fetch ulang saja biar simpel
       fetchEvents();
    };

    if (contracts.invoiceVerification) {
        contracts.invoiceVerification.on("InvoiceSubmitted", listener);
    }

    return () => {
      if (contracts.invoiceVerification) {
        contracts.invoiceVerification.off("InvoiceSubmitted", listener);
      }
    };
  }, [contracts.invoiceVerification, provider]);

  return { activities, loading };
};