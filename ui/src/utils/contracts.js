import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config';

// ABI imports
import GovTokenABI from '../contracts/GovToken.json';
import TimeLockABI from '../contracts/TimeLock.json';
import CertABI from '../contracts/Cert.json';
import GovernorABI from '../contracts/MyGovernor.json';

export const getProvider = () => {
  if (!window.ethereum) throw new Error("Please install MetaMask!");
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getContracts = async (signer) => {
  const govToken = new ethers.Contract(CONTRACT_ADDRESSES.GovToken, GovTokenABI.abi, signer);
  const timeLock = new ethers.Contract(CONTRACT_ADDRESSES.TimeLock, TimeLockABI.abi, signer);
  const cert = new ethers.Contract(CONTRACT_ADDRESSES.Cert, CertABI.abi, signer);
  const governor = new ethers.Contract(CONTRACT_ADDRESSES.MyGovernor, GovernorABI.abi, signer);

  return {
    govToken,
    timeLock,
    cert,
    governor
  };
};

export const getProposalState = (state) => {
  const states = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed"
  ];
  return states[state] || "Unknown";
};
