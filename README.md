# CoinVault

CoinVault is a multi-chain staking and governance platform for the Ethereum ecosystem. Users can stake ETH, earn rewards, and participate in on-chain governance.

Candidates extend the existing Express API so it can read data from smart contracts. 

---

## Take-Home Assessment

### Objective

Add a new API to this shared backend that integrates with smart contracts and returns on-chain data.

### Requirements

1. Work in this repository. Do not create a new project from scratch. Implement your solution in the existing backend.
2. Add a new API named `[YourName]Apitest`. Replace `[YourName]` with your name (for example, `WesleyApitest`).
3. Fetch information from a smart contract through that API. You may use any of the contracts in this project, or another public contract of your choice.
4. No frontend is required. Logging the result to the console (or returning it from the API) is sufficient to demonstrate your work.

### Suggested approach

- Add your route, controller, and any contract-integration logic under `backend/`.
- Use `ethers.js` (already included) to read contract data.
- Contract ABIs are available in `lib/abis/`. Solidity sources are in `contracts/`.
- Register the new route in `backend/app.js`.

### Submission

Complete the task by the end of the day and share one of the following:

- A short video demonstrating the API (request and console/API response), or
- A link to a public repository with your changes

Send the video or repository link to the hiring contact.

---

## Overview

CoinVault combines:

- Staking: deposit ETH, receive dETH, stake for sETH, and track rewards
- Governance: create proposals, vote, and execute outcomes on-chain
- Backend services: Express APIs for application data, plus contract reads for on-chain state

## Technology stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express |
| Blockchain | ethers.js, Solidity (ERC-20) |
| Database | MongoDB (Mongoose) |
| Frontend (reference only) | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |

## Smart contracts

The platform uses four core contracts:

| Contract | Role |
| --- | --- |
| DepositETH (dETH) | ERC-20 token minted when users deposit ETH |
| StakedETH (sETH) | ERC-20 token minted when users stake dETH |
| Governance | Proposal creation, voting, and execution |
| StakingDashboard | Staking statistics and leaderboard data |

ABIs: `lib/abis/`  
Sources: `contracts/`

## Getting started

### Prerequisites

- Node.js 18 or later (20 recommended)
- npm
- Optional: an Ethereum RPC URL (Holesky or another network) for live contract reads

### Installation

```bash
npm install
```

### Run the backend only

```bash
npm run backend
```

### Run backend and frontend together

```bash
npm run dev
```



## Project structure

```text
CoinVault/
├── app/                    # Next.js App Router pages (reference)
├── components/             # React UI components (reference)
├── contracts/              # Solidity contract sources
├── hooks/                  # Frontend React hooks
├── lib/
│   └── abis/               # Contract ABIs for ethers.js
├── public/                 # Static assets
├── styles/                 # Global styles
└── backend/                # Express API (assessment work goes here)
    ├── app.js              # Route registration
    ├── index.js            # Server entry point
    ├── config/             # Environment and database config
    ├── controllers/        # Request handlers
    ├── routes/             # API routes
    ├── models/             # Mongoose models
    ├── middlewares/        # Auth, validation, helpers
    └── utils/              # Shared utilities
```


