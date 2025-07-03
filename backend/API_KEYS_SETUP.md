# 🔑 API Keys Setup Guide

## Required API Keys for BlitzProof Security Scanner

### 🚨 Critical API Keys (Required for Basic Functionality)

#### 1. **Etherscan API Key**
- **URL**: https://etherscan.io/apis
- **Steps**:
  1. Create an account on Etherscan
  2. Go to "My Account" → "API Keys"
  3. Create a new API key
  4. Copy the key to `ETHERSCAN_API_KEY` in your `.env`

#### 2. **PolygonScan API Key**
- **URL**: https://polygonscan.com/apis
- **Steps**:
  1. Create an account on PolygonScan
  2. Go to "My Account" → "API Keys"
  3. Create a new API key
  4. Copy the key to `POLYGONSCAN_API_KEY` in your `.env`

#### 3. **BSCScan API Key**
- **URL**: https://bscscan.com/apis
- **Steps**:
  1. Create an account on BSCScan
  2. Go to "My Account" → "API Keys"
  3. Create a new API key
  4. Copy the key to `BSCSCAN_API_KEY` in your `.env`

#### 4. **Arbiscan API Key**
- **URL**: https://arbiscan.io/apis
- **Steps**:
  1. Create an account on Arbiscan
  2. Go to "My Account" → "API Keys"
  3. Create a new API key
  4. Copy the key to `ARBISCAN_API_KEY` in your `.env`

#### 5. **Optimism API Key**
- **URL**: https://optimistic.etherscan.io/apis
- **Steps**:
  1. Create an account on Optimistic Etherscan
  2. Go to "My Account" → "API Keys"
  3. Create a new API key
  4. Copy the key to `OPTIMISM_API_KEY` in your `.env`

### 📝 Optional API Keys (For Extended Network Support)

These are optional but recommended for comprehensive multi-chain scanning:

- **Snowtrace (Avalanche)**: https://snowtrace.io/apis
- **FTMScan (Fantom)**: https://ftmscan.com/apis
- **BaseScan (Base)**: https://basescan.org/apis
- **LineaScan (Linea)**: https://lineascan.build/apis
- **ZKScan (zkSync)**: https://explorer.zksync.io/apis
- **ScrollScan (Scroll)**: https://scrollscan.com/apis
- **MantleScan (Mantle)**: https://explorer.mantle.xyz/apis
- **CeloScan (Celo)**: https://celoscan.io/apis
- **GnosisScan (Gnosis)**: https://gnosisscan.io/apis
- **MoonScan (Moonbeam)**: https://moonbeam.moonscan.io/apis
- **Harmony API**: https://explorer.harmony.one/apis
- **CronosScan**: https://cronoscan.com/apis
- **KlaytnScope**: https://scope.klaytn.com/apis
- **Metis API**: https://andromeda-explorer.metis.io/apis
- **BobaScan**: https://bobascan.com/apis

### 🔧 Environment Configuration

After getting your API keys, update your `.env` file:

```bash
# Replace "YourApiKeyToken" with your actual API keys
ETHERSCAN_API_KEY=your-actual-etherscan-key
POLYGONSCAN_API_KEY=your-actual-polygonscan-key
BSCSCAN_API_KEY=your-actual-bscscan-key
ARBISCAN_API_KEY=your-actual-arbiscan-key
OPTIMISM_API_KEY=your-actual-optimism-key
```

### ⚠️ Important Notes

1. **Rate Limits**: Most APIs have rate limits (usually 5 requests/second for free tier)
2. **Free Tiers**: All the above APIs offer free tiers sufficient for development
3. **Production**: Consider upgrading to paid tiers for production use
4. **Security**: Never commit API keys to version control
5. **Backup**: Keep your API keys in a secure location

### 🚀 Quick Start

For immediate testing, you can use the default `YourApiKeyToken` values, but you'll get limited functionality. For full features, get at least the 5 critical API keys listed above. 