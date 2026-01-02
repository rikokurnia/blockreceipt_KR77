// src/context/Web3Context.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  BLOCKCHAIN_CONFIG, 
  STORAGE_KEYS, 
  CONTRACT_ADDRESSES, 
  CONTRACT_ABIS 
} from "../utils/constants";

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // New State for Contracts
  const [contracts, setContracts] = useState({
    dailyLimitManager: null,
    purchaseAgreementManager: null,
    invoiceVerification: null,
    fraudDetection: null,
    zkVerifier: null
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Load user role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Helper: Initialize Contract Instances
// Helper: Initialize Contract Instances
  const initializeContracts = (signerOrProvider) => {
    try {
      if (!signerOrProvider) return;

      const dailyLimitManager = new ethers.Contract(
        CONTRACT_ADDRESSES.DAILY_LIMIT_MANAGER,
        CONTRACT_ABIS.DAILY_LIMIT_MANAGER,
        signerOrProvider
      );

      const purchaseAgreementManager = new ethers.Contract(
        CONTRACT_ADDRESSES.PURCHASE_AGREEMENT_MANAGER,
        CONTRACT_ABIS.PURCHASE_AGREEMENT_MANAGER,
        signerOrProvider
      );

      const invoiceVerification = new ethers.Contract(
        CONTRACT_ADDRESSES.INVOICE_VERIFICATION,
        CONTRACT_ABIS.INVOICE_VERIFICATION,
        signerOrProvider
      );

      const fraudDetection = new ethers.Contract(
        CONTRACT_ADDRESSES.FRAUD_DETECTION,
        CONTRACT_ABIS.FRAUD_DETECTION,
        signerOrProvider
      );

      // 🔥 TAMBAHKAN INI (ZK VERIFIER)
      const zkVerifier = new ethers.Contract(
        CONTRACT_ADDRESSES.ZK_INVOICE_VERIFIER,
        CONTRACT_ABIS.ZK_INVOICE_VERIFIER,
        signerOrProvider
      );
      
      setContracts({
        dailyLimitManager,
        purchaseAgreementManager,
        invoiceVerification,
        fraudDetection,
        zkVerifier, // 🔥 Masukkan ke state
      });

      console.log("Contracts Initialized Successfully (Termasuk ZK)");
    } catch (err) {
      console.error("Failed to initialize contracts:", err);
    }
  };

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setChainId(network.chainId);
        
        // Initialize Contracts with Signer
        initializeContracts(signer);
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);
      // Re-initialize might be needed if signer changes, typically handled by page reload on chain change
      window.location.reload(); 
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async (walletType = "metamask") => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      if (network.chainId !== BLOCKCHAIN_CONFIG.CHAIN_ID) {
        try {
          await switchNetwork();
        } catch (switchError) {
          throw new Error("Please switch to Lisk Sepolia network");
        }
      }

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);

      // CRITICAL: Initialize contracts immediately after connection
      initializeContracts(signer);

      return { success: true, account: accounts[0] };
    } catch (err) {
      console.error("Error connecting wallet:", err);
      let errorMessage = err.message;
      if (err.code === 4001) {
        errorMessage = "Connection request was rejected.";
      } 
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexValue(BLOCKCHAIN_CONFIG.CHAIN_ID) }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await addNetwork();
      } else {
        throw switchError;
      }
    }
  };

  const addNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ethers.utils.hexValue(BLOCKCHAIN_CONFIG.CHAIN_ID),
            chainName: BLOCKCHAIN_CONFIG.NETWORK_NAME,
            nativeCurrency: BLOCKCHAIN_CONFIG.CURRENCY,
            rpcUrls: [BLOCKCHAIN_CONFIG.RPC_URL],
            blockExplorerUrls: [BLOCKCHAIN_CONFIG.EXPLORER_URL],
          },
        ],
      });
    } catch (addError) {
      throw new Error("Failed to add network to wallet");
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setUserRole(null);
    setContracts({
      dailyLimitManager: null,
      purchaseAgreementManager: null,
      invoiceVerification: null,
      fraudDetection: null,
      zkVerifier: null
    });
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  };

  const selectRole = (role) => {
    setUserRole(role);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    contracts, // EXPOSED CONTRACTS
    isConnecting,
    error,
    userRole,
    isConnected: !!account,
    connectWallet,
    disconnect,
    selectRole,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};