const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const BASE_ADDRESS = '0x75f39d9Bff76d376F3960028d98F324aAbB6c5e6';
const SOLANA_ADDRESS = 'FeB1jqjCFKyQ2vVTPLgYmZu1yLvBWhsGoudP46fhhF8z';
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '***ALCHEMY_KEY_REMOVED***';
const INFURA_KEY = process.env.INFURA_KEY || '2c3b9a01235c4c6db34ae7287adfe67f';

// Middleware
app.use(cors());
app.use(express.static('public'));

// Base provider (using public RPC as fallback - Alchemy/Infura might have rate limits)
const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// Solana connection
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// API: Get wallet balances
app.get('/api/balances', async (req, res) => {
  try {
    console.log('Fetching wallet balances...');
    
    // Fetch Base balance
    const baseBalance = await baseProvider.getBalance(BASE_ADDRESS);
    const baseEth = ethers.formatEther(baseBalance);
    
    // Fetch Solana balance
    const solanaPublicKey = new PublicKey(SOLANA_ADDRESS);
    const solanaBalance = await solanaConnection.getBalance(solanaPublicKey);
    const solanaSol = solanaBalance / LAMPORTS_PER_SOL;
    
    const result = {
      base: {
        address: BASE_ADDRESS,
        balance: baseEth,
        network: 'Base Mainnet'
      },
      solana: {
        address: SOLANA_ADDRESS,
        balance: solanaSol.toFixed(9),
        network: 'Solana Mainnet'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Balances fetched:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Wallet Dashboard running on port ${PORT}`);
  console.log(`📊 Monitoring:`);
  console.log(`   Base: ${BASE_ADDRESS}`);
  console.log(`   Solana: ${SOLANA_ADDRESS}`);
});
