# MetaMask Test Dapp Multichain for Stellar

A test dapp for the MetaMask Multichain API on Stellar.

## Prerequisites

- Node.js (version 18 or higher)
- Yarn package manager

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd test-dapp-stellar
yarn install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
# Default recipient address for testing transactions (Optional)
# If not provided, uses a default Stellar test address
VITE_DEFAULT_RECIPIENT=

# WalletConnect Project ID (Required for WalletConnect connector)
# Get your project ID from: https://cloud.reown.com/
VITE_WALLETCONNECT_PROJECT_ID=
```

**Note**: `VITE_WALLETCONNECT_PROJECT_ID` is only required when testing the WalletConnect connector.

### 3. Development

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:8081`.

### 4. Build for Production

```bash
yarn build
```

## Usage

Once the development server is running, you can:

1. Connect a Stellar wallet through the wallet modal (MetaMask, Freighter, LOBSTR, WalletConnect, etc.)
2. Test message signing functionality
3. Test USDC transfers
4. Test Stellar transaction XDR signing. The `Load Example XDR` action builds an example transaction from the
   connected account on the selected network, so the account must be funded on that network.
5. Test Soroban auth entry signing

## Configuration

The application supports multiple Stellar networks:

- **Public Network (Mainnet)**: Production network
- **Testnet**: Test network for development
- **Futurenet**: Future protocol testing network

Network configuration and contract addresses are managed in `src/config.ts`.
