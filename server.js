const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const BASE_ADDRESS = '0x75f39d9Bff76d376F3960028d98F324aAbB6c5e6';
const SOLANA_ADDRESS = 'FeB1jqjCFKyQ2vVTPLgYmZu1yLvBWhsGoudP46fhhF8z';

// Middleware
app.use(cors());
app.use(express.static('public'));

// Providers
const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// API: Get wallet balances
app.get('/api/balances', async (req, res) => {
  try {
    // Fetch Base balance
    const baseBalance = await baseProvider.getBalance(BASE_ADDRESS);
    const baseEth = parseFloat(ethers.formatEther(baseBalance));
    
    // Fetch Solana balance
    const solanaPublicKey = new PublicKey(SOLANA_ADDRESS);
    const solanaBalance = await solanaConnection.getBalance(solanaPublicKey);
    const solanaSol = solanaBalance / LAMPORTS_PER_SOL;
    
    res.json({
      base: {
        address: BASE_ADDRESS,
        balance: baseEth,
        balanceFormatted: baseEth.toFixed(4),
        usd: (baseEth * 2500).toFixed(2) // Rough estimate
      },
      solana: {
        address: SOLANA_ADDRESS,
        balance: solanaSol,
        balanceFormatted: solanaSol.toFixed(4),
        usd: (solanaSol * 100).toFixed(2) // Rough estimate
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Wallet Dashboard running on port ${PORT}`);
  console.log(`📊 Monitoring:`);
  console.log(`   Base: ${BASE_ADDRESS}`);
  console.log(`   Solana: ${SOLANA_ADDRESS}`);
});
