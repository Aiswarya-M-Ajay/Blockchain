# DAO Certificate Management Platform

A decentralized autonomous organization (DAO) platform for managing certificates on the blockchain. Built with React, Ethers.js, and Solidity smart contracts.

## Features

- Token-based governance system
- Certificate proposal and issuance
- Role-based access control
- Proposal lifecycle management (Create → Vote → Queue → Execute)
- Token delegation capabilities

## Technology Stack

- Frontend: React with Vite
- Blockchain Interaction: ethers.js v6
- UI Components: Material-UI
- Smart Contracts: Solidity
- Development Environment: Hardhat
- Network: Sepolia Testnet

## Project Structure

```
DAO_PROJECT/
├── ui/                    # Frontend React application
│   ├── src/
│   │   ├── contracts/    # Contract ABIs
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main application component
├── contracts/            # Smart contract source files
└── scripts/             # Deployment scripts
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd ui
   npm install
   ```
3. Configure MetaMask:
   - Connect to Sepolia Testnet
   - Ensure you have some Sepolia ETH

4. Start the development server:
   ```bash
   npm run dev
   ```

## Smart Contracts

The platform uses the following smart contracts:

- GovToken: Governance token for voting
- TimeLock: Time-locked execution of proposals
- Cert: Certificate management
- MyGovernor: Main governance contract

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
