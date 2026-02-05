const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const BASE_ADDRESS = '0x75f39d9Bff76d376F3960028d98F324aAbB6c5e6';
const SOLANA_ADDRESS = 'FeB1jqjCFKyQ2vVTPLgYmZu1yLvBWhsGoudP46fhhF8z';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '-LT-z6GeOON19ntqfyoG2';

// Middleware
app.use(cors());
app.use(express.static('public'));

// Providers
const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const alchemyBaseUrl = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const alchemySolanaUrl = `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

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

// API: Get token balances with prices
app.get('/api/tokens', async (req, res) => {
  try {
    const tokens = [];
    
    // Fetch Base ERC-20 tokens using Alchemy
    try {
      const baseTokensResponse = await axios.post(alchemyBaseUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [BASE_ADDRESS]
      });
      
      if (baseTokensResponse.data.result && baseTokensResponse.data.result.tokenBalances) {
        for (const token of baseTokensResponse.data.result.tokenBalances) {
          if (token.tokenBalance && token.tokenBalance !== '0x0') {
            // Get token metadata
            const metadataResponse = await axios.post(alchemyBaseUrl, {
              jsonrpc: '2.0',
              id: 1,
              method: 'alchemy_getTokenMetadata',
              params: [token.contractAddress]
            });
            
            const metadata = metadataResponse.data.result;
            if (metadata) {
              const balance = parseInt(token.tokenBalance, 16);
              const decimals = metadata.decimals || 18;
              const formatted = balance / Math.pow(10, decimals);
              
              if (formatted > 0.000001) {  // Filter dust
                tokens.push({
                  address: token.contractAddress,
                  symbol: metadata.symbol || 'UNKNOWN',
                  name: metadata.name || 'Unknown Token',
                  balance: formatted,
                  decimals: decimals,
                  network: 'base',
                  logo: metadata.logo
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Base tokens:', error.message);
    }
    
    // Fetch Solana SPL tokens using Alchemy
    try {
      const solanaTokensResponse = await axios.post(alchemySolanaUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          SOLANA_ADDRESS,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' }
        ]
      });
      
      if (solanaTokensResponse.data.result && solanaTokensResponse.data.result.value) {
        for (const accountInfo of solanaTokensResponse.data.result.value) {
          const parsedInfo = accountInfo.account.data.parsed.info;
          const balance = parsedInfo.tokenAmount.uiAmount;
          
          if (balance > 0.000001) {  // Filter dust
            tokens.push({
              address: parsedInfo.mint,
              symbol: 'SPL',  // Will be enriched by DexScreener
              name: 'SPL Token',
              balance: balance,
              decimals: parsedInfo.tokenAmount.decimals,
              network: 'solana',
              logo: null
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Solana tokens:', error.message);
    }
    
    // Get prices from DexScreener for all tokens
    for (const token of tokens) {
      try {
        const chainId = token.network === 'base' ? 'base' : 'solana';
        const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${token.address}`;
        const priceResponse = await axios.get(dexUrl);
        
        if (priceResponse.data.pairs && priceResponse.data.pairs.length > 0) {
          const pair = priceResponse.data.pairs[0];
          token.price = parseFloat(pair.priceUsd) || 0;
          token.value = token.balance * token.price;
          token.priceChange24h = parseFloat(pair.priceChange?.h24) || 0;
          
          // Update symbol/name from DexScreener if better
          if (pair.baseToken && pair.baseToken.symbol) {
            token.symbol = pair.baseToken.symbol;
            token.name = pair.baseToken.name || token.name;
          }
        } else {
          token.price = 0;
          token.value = 0;
          token.priceChange24h = 0;
        }
      } catch (error) {
        token.price = 0;
        token.value = 0;
        token.priceChange24h = 0;
      }
    }
    
    // Sort by value (highest first)
    tokens.sort((a, b) => b.value - a.value);
    
    res.json({ 
      tokens,
      total_value: tokens.reduce((sum, t) => sum + t.value, 0),
      count: tokens.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
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
