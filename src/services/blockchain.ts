const ETHERSCAN_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY as string;
const TRONGRID_KEY  = import.meta.env.VITE_TRONGRID_API_KEY  as string;
const GOLDRUSH_KEY  = import.meta.env.VITE_GOLDRUSH_API_KEY  as string;

// ── Base58Check and SHA256 utilities for Tron ───────────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

export async function hexToBase58Check(hex: string): Promise<string> {
  if (!hex) return '';
  if (hex.startsWith('T')) return hex;
  
  hex = hex.replace(/^0x/, '');
  if (hex.length % 2 !== 0) hex = '0' + hex;
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  
  const hash1 = await sha256(bytes);
  const hash2 = await sha256(hash1);
  
  const finalBytes = new Uint8Array(bytes.length + 4);
  finalBytes.set(bytes);
  finalBytes.set(hash2.slice(0, 4), bytes.length);
  
  let value = 0n;
  for (let i = 0; i < finalBytes.length; i++) {
    value = (value * 256n) + BigInt(finalBytes[i]);
  }
  
  let result = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    result = BASE58_ALPHABET[remainder] + result;
    value = value / 58n;
  }
  
  for (let i = 0; i < finalBytes.length; i++) {
    if (finalBytes[i] === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }
  
  return result;
}

// ── Multi-Asset CoinGecko Live Price Cache ───────────────────────────────────
export interface CryptoPrices {
  ETH: number;
  BTC: number;
  BNB: number;
  MATIC: number;
  SOL: number;
  TRX: number;
  USDT: number;
}

let cachedPrices: CryptoPrices = {
  ETH: 3420,
  BTC: 64500,
  BNB: 580,
  MATIC: 0.55,
  SOL: 155,
  TRX: 0.155,
  USDT: 1.0,
};
let lastFetchTime = 0;

export async function getCryptoPrices(): Promise<CryptoPrices> {
  const now = Date.now();
  if (now - lastFetchTime < 60000) {
    return cachedPrices;
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,binancecoin,matic-network,solana,tron,tether&vs_currencies=usd'
    );
    if (res.ok) {
      const data = await res.json();
      cachedPrices = {
        ETH: data.ethereum?.usd ?? cachedPrices.ETH,
        BTC: data.bitcoin?.usd ?? cachedPrices.BTC,
        BNB: data.binancecoin?.usd ?? cachedPrices.BNB,
        MATIC: data['matic-network']?.usd ?? cachedPrices.MATIC,
        SOL: data.solana?.usd ?? cachedPrices.SOL,
        TRX: data.tron?.usd ?? cachedPrices.TRX,
        USDT: data.tether?.usd ?? 1.0,
      };
      lastFetchTime = now;
    }
  } catch (e) {
    console.warn('Failed to fetch live prices from CoinGecko, using cache:', e);
  }
  return cachedPrices;
}

export interface RawTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  gasUsed?: string;
  gasPrice?: string;
  chain?: string;
}

export interface CounterpartyInfo {
  address: string;
  count: number;
  totalValue: string;
  tokenSymbol?: string;
  lastSeen?: string;
  type?: 'exchange' | 'mixer' | 'wallet' | 'contract';
  name?: string;
  chain?: string;
}

export interface PortfolioAsset {
  chain: string;
  symbol: string;
  name: string;
  balance: number;
  formatted: string;
  balanceUSD: string;
  quote: number;
}

export interface WalletAnalysis {
  address: string;
  chain: string;
  balance: string;
  balanceUSD: string;
  portfolio?: PortfolioAsset[];
  txCount: number;
  firstSeen: string;
  lastSeen: string;
  recentTxs: RawTx[];
  riskScore: number;
  riskFactors: string[];
  typology: string;
  counterparties: CounterpartyInfo[];
}

// ── Known Entities Database ──────────────────────────────────────────────────
export const KNOWN_MIXERS = new Set([
  '0x722122df12d4e14e13ac3b6895a86e84145b6967',
  '0x12d66f87a04a9e220c9d5078be80d0f598a0b4c4',
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936',
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
  '0xa160cdab225685da1d56aa342ad8841c3b53f291',
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3',
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144',
  '0x07687e702b410fa43f4cb4af7fa097918ffd2730',
  '0x23773e65ed146a459667ffd4d73fb7c904726d51',
  '0x22aaa7720ddd5388a3c0a3333430953c68f1849b',
  '0x03893a7c7463ae47d46bc7f091665f1893656003',
  '0x2717c5e28cf931547b621a5dddb772ab6a35b701',
  '0xd21be7248e0197ee08e0c20d4a96debdac3d20af',
  '0x4736dcf1b7a3d580672cce6e7c65cd5cc9cfba9d',
  '0x55c5bd1de9f68b3e1e5ececb97e12a6d55aca14d',
  '0x3b3e3ec1d45c02c97ec8d0c5a60b55cb5e7c82d9',
  '0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a',
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
]);

export const KNOWN_EXCHANGE_MAP: Record<string, string> = {
  // Binance (ETH, BSC, Tron, BTC)
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance',
  '0x564286362092d8e7936f0549571a803b203aaced': 'Binance',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': 'Binance',
  '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87': 'Binance',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance 15',
  '0xdfd5293d8e347dfee59e53b21095066f12555914': 'Binance 16',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 8',
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503': 'Binance Cold Storage',
  '0x55d398326f99059ff775485246999027b3197955': 'Tether / Binance USD',
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': 'Binance Hot Wallet',
  'tknvqhbhqkmsidrqjp3jhaqkfa7r3nhmfe':         'Binance Tron',
  't9yd14nj9j7xabh4dhgxkzhbvcmhprxqpr':         'Binance Tron Hot',
  '12cbqbqevefngk3jvsrwhln1vdmg79bznk':         'Binance BTC Sweeper',
  '34xp4vrpdwne57w9xrevyu9q25594x4z7e':         'Binance BTC Cold',

  // OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX 1',
  '0x236f9f97e0eb3f6861c980d329d8ae9e900a50b7': 'OKX 2',
  '0xa7efae728d2936e78bda97dc1b33974704f016f9': 'OKX 3',
  '0x5041ed759dd4afc3a72b8192c143f72f4724081a': 'OKX 4',
  '0xa003923485ab5392695570fb0cbb173ec2353ef8': 'OKX Hot',

  // Bybit
  '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9': 'Bybit 1',
  '0x1062a747393198f70f71ec65a582423dba7e5ab3': 'Bybit 2',
  '0xee5b5b9230e3400b804492b5ec9712b74360c8d8': 'Bybit Hot',

  // KuCoin
  '0x2b5634c42055806a59e9107ed44d43c426e99b38': 'KuCoin 1',
  '0xe176ebe47d621b984a73036b9da5d834411ef734': 'KuCoin 2',
  '0x0059b14e35dab1b4eee1e2926c7a5660da66f747': 'KuCoin 3',
  '0xd6216fc19db775df9774a6e33526131da7d19a2c': 'KuCoin 4',

  // Coinbase
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase 1',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase 2',
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': 'Coinbase 3',
  '0x3cd751e370439e93c03118fb443f13444fb31b05': 'Coinbase 4',

  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken 1',
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': 'Kraken 2',

  // Bitfinex & Gate.io & Indian Exchanges
  '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch / DEX Aggregator',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': 'Bitfinex',
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': 'Gate.io',
  '0x5c985e89dde482efe97ea9f1950ad149eb73829b': 'WazirX',
  '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa': 'CoinDCX',
};

export const KNOWN_EXCHANGES = new Set(Object.keys(KNOWN_EXCHANGE_MAP));

// ── Chain detection ────────────────────────────────────────────────────────
export function detectChain(addr: string, userChoice?: string): 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'tron' | 'bitcoin' | 'solana' | 'unknown' {
  const choice = userChoice?.toLowerCase() || '';
  if (choice.includes('tron') || choice.includes('trx')) return 'tron';
  if (choice.includes('btc') || choice.includes('bitcoin')) return 'bitcoin';
  if (choice.includes('solana') || choice.includes('sol')) return 'solana';
  if (choice.includes('bnb') || choice.includes('bsc') || choice.includes('binance')) return 'bsc';
  if (choice.includes('polygon') || choice.includes('matic')) return 'polygon';
  if (choice.includes('arbitrum')) return 'arbitrum';
  if (choice.includes('eth') || choice.includes('ethereum')) return 'ethereum';

  if (/^0x[0-9a-fA-F]{40}$/.test(addr)) return 'ethereum';
  if (/^T[0-9A-Za-z]{33}$/.test(addr)) return 'tron';
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr)) return 'bitcoin';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return 'solana';
  
  return 'unknown';
}

// ── Risk scoring ───────────────────────────────────────────────────────────
export function computeRisk(txs: RawTx[], addr: string): { score: number; factors: string[]; typology: string } {
  const factors: string[] = [];
  let score = 15;

  const addrLower = addr.toLowerCase();
  const isKnownExchange = !!KNOWN_EXCHANGE_MAP[addrLower];

  if (isKnownExchange) {
    return {
      score: 25,
      factors: [`Identified institutional infrastructure: ${KNOWN_EXCHANGE_MAP[addrLower]}`],
      typology: `Exchange / VASP Infrastructure (${KNOWN_EXCHANGE_MAP[addrLower]})`,
    };
  }

  if (txs.length === 0) return { score: 10, factors: ['No recent on-chain transactions'], typology: 'Inactive / Fresh Address' };

  if (txs.length >= 100) { score += 20; factors.push('Extremely high transaction frequency'); }
  else if (txs.length >= 10) { score += 10; factors.push('Elevated transaction frequency'); }

  // Check for mixer interactions
  let mixerHits = 0;
  for (const t of txs) {
    if (KNOWN_MIXERS.has((t.from || '').toLowerCase()) || KNOWN_MIXERS.has((t.to || '').toLowerCase())) {
      mixerHits++;
    }
  }
  if (mixerHits > 0) {
    score += 35;
    factors.push(`Direct interaction with sanctioned mixing protocol (${mixerHits} transfers)`);
  }

  // Check for exchange off-ramping
  let exchangeHits = 0;
  for (const t of txs) {
    if (KNOWN_EXCHANGE_MAP[(t.from || '').toLowerCase()] || KNOWN_EXCHANGE_MAP[(t.to || '').toLowerCase()]) {
      exchangeHits++;
    }
  }
  if (exchangeHits > 0) {
    score += 15;
    factors.push(`Direct interaction with known VASP/Exchange cluster (${exchangeHits} transfers)`);
  }

  // Peeling chain fan-out
  const uniquePeers = new Set<string>();
  txs.forEach((t) => {
    if (t.from && t.from.toLowerCase() !== addr.toLowerCase()) uniquePeers.add(t.from.toLowerCase());
    if (t.to && t.to.toLowerCase() !== addr.toLowerCase()) uniquePeers.add(t.to.toLowerCase());
  });
  if (uniquePeers.size >= 8) {
    score += 18;
    factors.push(`Wide counterparty fan-out (${uniquePeers.size} distinct peers)`);
  }

  score = Math.min(Math.max(score, 5), 98);

  let typology = 'Standard Wallet Activity';
  if (score >= 75) typology = 'High Risk — Suspected Multi-Hop Layering / Off-Ramping';
  else if (score >= 50) typology = 'Moderate Risk — Transit & Intermediary Structuring';
  else if (score >= 25) typology = 'Low Risk — Typical Peer Transfers';

  return { score, factors, typology };
}

// ── Counterparty aggregation ───────────────────────────────────────────────
export function aggregateCounterparties(
  txs: RawTx[],
  selfAddr: string,
  nativeSymbol: string = 'ETH',
): CounterpartyInfo[] {
  const map = new Map<string, { address: string; count: number; total: number; tokenSymbol: string; lastSeen: string; chain?: string }>();

  for (const t of txs) {
    const peer = (t.from || '').toLowerCase() === selfAddr.toLowerCase() ? t.to : t.from;
    if (!peer || peer.toLowerCase() === selfAddr.toLowerCase()) continue;

    const sym = t.tokenSymbol || nativeSymbol;
    const rawVal = parseFloat((t.value || '0').replace(/,/g, ''));
    const val = isNaN(rawVal) ? 0 : rawVal;

    const key = peer.toLowerCase();
    const prev = map.get(key) ?? { address: peer, count: 0, total: 0, tokenSymbol: sym, lastSeen: t.timeStamp, chain: t.chain };
    map.set(key, {
      address: prev.address || peer,
      count: prev.count + 1,
      total: prev.total + val,
      tokenSymbol: sym,
      lastSeen: t.timeStamp > prev.lastSeen ? t.timeStamp : prev.lastSeen,
      chain: t.chain || prev.chain,
    });
  }

  // Sort prioritizing counterparties with non-zero total value or high transaction counts
  return [...map.values()]
    .sort((a, b) => {
      const aLower = a.address.toLowerCase();
      const bLower = b.address.toLowerCase();
      const aSpecial = KNOWN_MIXERS.has(aLower) || !!KNOWN_EXCHANGE_MAP[aLower] ? 1 : 0;
      const bSpecial = KNOWN_MIXERS.has(bLower) || !!KNOWN_EXCHANGE_MAP[bLower] ? 1 : 0;
      if (aSpecial !== bSpecial) return bSpecial - aSpecial;
      if (a.total > 0 && b.total === 0) return -1;
      if (b.total > 0 && a.total === 0) return 1;
      return b.count - a.count;
    })
    .slice(0, 24)
    .map(({ address, count, total, tokenSymbol, chain }) => {
      const lower = address.toLowerCase();
      let type: CounterpartyInfo['type'] = 'wallet';
      let name: string | undefined;

      if (KNOWN_MIXERS.has(lower)) {
        type = 'mixer';
        name = 'Sanctioned Mixer';
      } else if (KNOWN_EXCHANGE_MAP[lower]) {
        type = 'exchange';
        name = KNOWN_EXCHANGE_MAP[lower];
      }

      return {
        address,
        count,
        totalValue: total > 0
          ? `${total < 0.0001 ? '<0.0001' : total.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${tokenSymbol}`
          : `Active Transfer (${count} tx)`,
        tokenSymbol,
        type,
        name,
        chain,
      };
    });
}

// ── EVM Multi-Chain Parallel Aggregator (Blockscout v2 + GoldRush + Public RPC) ──────
const BLOCKSCOUT_CHAINS = [
  { baseUrl: 'https://eth.blockscout.com', chainName: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://cloudflare-eth.com' },
  { baseUrl: 'https://bsc.blockscout.com', chainName: 'BNB Chain', symbol: 'BNB', rpcUrl: 'https://binance.llamarpc.com' },
  { baseUrl: 'https://polygon.blockscout.com', chainName: 'Polygon', symbol: 'POL', rpcUrl: 'https://polygon-rpc.com' },
  { baseUrl: 'https://base.blockscout.com', chainName: 'Base', symbol: 'ETH', rpcUrl: 'https://mainnet.base.org' },
  { baseUrl: 'https://arbitrum.blockscout.com', chainName: 'Arbitrum', symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  { baseUrl: 'https://optimism.blockscout.com', chainName: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io' },
];

async function fetchBlockscoutChain(baseUrl: string, chainName: string, symbol: string, address: string, prices: CryptoPrices) {
  try {
    const [accRes, txRes, tokenTxRes, tokensRes] = await Promise.all([
      fetch(`${baseUrl}/api/v2/addresses/${address}`).catch(() => null),
      fetch(`${baseUrl}/api/v2/addresses/${address}/transactions`).catch(() => null),
      fetch(`${baseUrl}/api/v2/addresses/${address}/token-transfers`).catch(() => null),
      fetch(`${baseUrl}/api/v2/addresses/${address}/tokens`).catch(() => null),
    ]);

    let bal = 0;
    let quote = 0;
    const portfolio: PortfolioAsset[] = [];
    const txs: RawTx[] = [];
    const seenTxHashes = new Set<string>();

    // 1. Native coin balance
    if (accRes && accRes.ok) {
      const accData = await accRes.json();
      const coinBalWei = accData.coin_balance || '0';
      bal = parseFloat(coinBalWei) / 1e18;
      const rate = parseFloat(accData.exchange_rate || String(symbol === 'ETH' ? prices.ETH : symbol === 'POL' ? prices.MATIC : symbol === 'BNB' ? prices.BNB : 1));
      quote = bal * rate;
      if (bal > 0) {
        portfolio.push({
          chain: chainName,
          symbol,
          name: `${chainName} Native Asset`,
          balance: bal,
          formatted: `${bal < 0.0001 ? '<0.0001' : bal.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`,
          balanceUSD: `$${quote.toFixed(2)}`,
          quote,
        });
      }
    }

    // 2. Token balances (ERC-20 / BEP-20)
    if (tokensRes && tokensRes.ok) {
      try {
        const tokensData = await tokensRes.json();
        const tokenItems = Array.isArray(tokensData.items) ? tokensData.items : [];
        for (const item of tokenItems) {
          const tInfo = item.token || {};
          const dec = parseInt(tInfo.decimals || '18', 10);
          const tVal = parseFloat(item.value || '0') / Math.pow(10, dec);
          if (tVal > 0) {
            const tSym = tInfo.symbol || 'TOKEN';
            const tRate = parseFloat(tInfo.exchange_rate || (tSym.includes('USD') ? '1.0' : '0'));
            const tQuote = tVal * tRate;
            quote += tQuote;
            portfolio.push({
              chain: chainName,
              symbol: tSym,
              name: tInfo.name || tSym,
              balance: tVal,
              formatted: `${tVal < 0.0001 ? '<0.0001' : tVal.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${tSym}`,
              balanceUSD: `$${tQuote.toFixed(2)}`,
              quote: tQuote,
            });
          }
        }
      } catch {
        // token parsing optional
      }
    }

    // 3. Regular native transactions
    if (txRes && txRes.ok) {
      const txData = await txRes.json();
      const items = Array.isArray(txData.items) ? txData.items : [];
      for (const t of items) {
        const hash = t.hash || '';
        if (hash) seenTxHashes.add(hash.toLowerCase());
        const valEth = parseFloat(t.value || '0') / 1e18;
        const fromAddr = t.from?.hash || '';
        const toAddr = t.to?.hash || '';
        const ts = t.timestamp ? Math.floor(new Date(t.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);

        txs.push({
          hash,
          from: fromAddr,
          to: toAddr,
          value: String(valEth),
          timeStamp: String(ts),
          tokenSymbol: symbol,
          tokenDecimal: '18',
          chain: chainName,
          isError: t.status === 'ok' ? '0' : '1',
        });
      }
    }

    // 4. Token transfers (USDT, USDC, BUSD deposits & withdrawals)
    if (tokenTxRes && tokenTxRes.ok) {
      try {
        const tokenTxData = await tokenTxRes.json();
        const items = Array.isArray(tokenTxData.items) ? tokenTxData.items : [];
        for (const tt of items) {
          const hash = tt.transaction_hash || tt.hash || '';
          const dec = parseInt(tt.token?.decimals || tt.total?.decimals || '18', 10);
          const tokVal = parseFloat(tt.total?.value || '0') / Math.pow(10, dec);
          const tokSym = tt.token?.symbol || 'USDT';
          const fromAddr = tt.from?.hash || '';
          const toAddr = tt.to?.hash || '';
          const ts = tt.timestamp ? Math.floor(new Date(tt.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000);

          txs.push({
            hash: hash || `tx-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            from: fromAddr,
            to: toAddr,
            value: String(tokVal),
            timeStamp: String(ts),
            tokenSymbol: tokSym,
            tokenDecimal: String(dec),
            chain: chainName,
            isError: '0',
          });
        }
      } catch {
        // token tx parsing optional
      }
    }

    return { chainName, symbol, bal, quote, portfolio, txs };
  } catch {
    return { chainName, symbol, bal: 0, quote: 0, portfolio: [], txs: [] };
  }
}

async function fetchRpcBalance(rpcUrl: string, address: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'], id: 1 }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    if (json.result) {
      const wei = BigInt(json.result);
      return Number(wei) / 1e18;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function analyzeMultiChainEvm(address: string, userChoice?: string): Promise<WalletAnalysis> {
  const prices = await getCryptoPrices();
  const portfolio: PortfolioAsset[] = [];
  const allTxs: RawTx[] = [];
  const seenTxHashes = new Set<string>();

  const pushTx = (t: RawTx) => {
    const key = `${t.chain || ''}-${t.hash || ''}-${t.tokenSymbol || ''}-${t.from || ''}-${t.to || ''}`.toLowerCase();
    if (t.hash && seenTxHashes.has(key)) return;
    if (t.hash) seenTxHashes.add(key);
    allTxs.push(t);
  };

  const pushAsset = (p: PortfolioAsset) => {
    const existing = portfolio.find((x) => x.chain === p.chain && x.symbol.toLowerCase() === p.symbol.toLowerCase());
    if (existing) {
      if (p.quote >= existing.quote || p.balance >= existing.balance) {
        existing.balance = p.balance;
        existing.formatted = p.formatted;
        existing.balanceUSD = p.balanceUSD;
        existing.quote = p.quote;
      }
    } else {
      portfolio.push(p);
    }
  };

  // 1. Ingest from GoldRush Covalent API across BSC (BNB Chain), Ethereum, Polygon, Arbitrum, Base, Optimism
  if (GOLDRUSH_KEY) {
    const covalentChains = [
      { goldrushName: 'bsc-mainnet', chainName: 'BNB Chain', symbol: 'BNB', price: prices.BNB },
      { goldrushName: 'eth-mainnet', chainName: 'Ethereum', symbol: 'ETH', price: prices.ETH },
      { goldrushName: 'matic-mainnet', chainName: 'Polygon', symbol: 'POL', price: prices.MATIC },
      { goldrushName: 'arbitrum-mainnet', chainName: 'Arbitrum', symbol: 'ETH', price: prices.ETH },
      { goldrushName: 'base-mainnet', chainName: 'Base', symbol: 'ETH', price: prices.ETH },
      { goldrushName: 'optimism-mainnet', chainName: 'Optimism', symbol: 'ETH', price: prices.ETH },
    ];

    const cPromises = covalentChains.map(async (c) => {
      try {
        const [balRes, txRes] = await Promise.all([
          fetch(`https://api.covalenthq.com/v1/${c.goldrushName}/address/${address}/balances_v2/?key=${GOLDRUSH_KEY}`).then(r => r.json()).catch(() => null),
          fetch(`https://api.covalenthq.com/v1/${c.goldrushName}/address/${address}/transactions_v3/?key=${GOLDRUSH_KEY}`).then(r => r.json()).catch(() => null),
        ]);

        if (balRes?.data?.items) {
          for (const it of balRes.data.items) {
            const dec = it.contract_decimals || 18;
            const bal = parseFloat(it.balance || '0') / Math.pow(10, dec);
            const quote = it.quote || (bal * (it.contract_ticker_symbol === 'USDT' || it.contract_ticker_symbol === 'USDC' || it.contract_ticker_symbol === 'BUSD' ? 1.0 : c.price));
            if (bal > 0) {
              pushAsset({
                chain: c.chainName,
                symbol: it.contract_ticker_symbol || c.symbol,
                name: it.contract_name || 'Token',
                balance: bal,
                formatted: `${bal < 0.0001 ? '<0.0001' : bal.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${it.contract_ticker_symbol || c.symbol}`,
                balanceUSD: `$${quote.toFixed(2)}`,
                quote,
              });
            }
          }
        }

        if (txRes?.data?.items) {
          for (const t of txRes.data.items) {
            let tokenSym = c.symbol;
            let tokenDec = 18;
            let val = parseFloat(t.value || '0') / 1e18;
            let fromAddr = t.from_address || '';
            let toAddr = t.to_address || '';

            // Parse decoded BEP-20 / ERC-20 token transfers
            if (t.log_events && t.log_events.length > 0) {
              for (const log of t.log_events) {
                if (log.decoded && (log.decoded.name === 'Transfer' || log.decoded.name === 'transfer') && log.decoded.params) {
                  const valParam = log.decoded.params.find((p: any) => p.name === 'value' || p.name === '_value');
                  const fromParam = log.decoded.params.find((p: any) => p.name === 'from' || p.name === '_from');
                  const toParam = log.decoded.params.find((p: any) => p.name === 'to' || p.name === '_to');

                  if (valParam || fromParam || toParam) {
                    tokenSym = log.sender_contract_ticker_symbol || log.sender_name || (c.chainName === 'BNB Chain' ? 'USDT' : 'TOKEN');
                    tokenDec = log.sender_contract_decimals || (tokenSym === 'USDT' || tokenSym === 'USDC' ? (c.chainName === 'BNB Chain' ? 18 : 6) : 18);
                    if (valParam) {
                      val = parseFloat(valParam.value || '0') / Math.pow(10, tokenDec);
                    }
                    if (fromParam?.value) fromAddr = fromParam.value;
                    if (toParam?.value) toAddr = toParam.value;
                  }
                }
              }
            }

            pushTx({
              hash: t.tx_hash,
              from: fromAddr,
              to: toAddr,
              value: val > 0 ? (val < 0.0001 ? '<0.0001' : val.toLocaleString('en-US', { maximumFractionDigits: 6 })) : '0',
              tokenSymbol: tokenSym,
              tokenDecimal: String(tokenDec),
              timeStamp: String(Math.floor(new Date(t.block_signed_at).getTime() / 1000)),
              chain: c.chainName,
              isError: t.successful === false ? '1' : '0',
            });
          }
        }
      } catch {
        // chain query optional
      }
    });

    await Promise.all(cPromises);
  }

  // 2. Query Etherscan Unified v2 and classic endpoints for Ethereum
  try {
    const etherscanUrl = ETHERSCAN_KEY
      ? `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_KEY}`
      : `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`;

    const [balRes, txRes, tokRes] = await Promise.all([
      fetch(etherscanUrl).catch(() => null),
      ETHERSCAN_KEY ? fetch(`https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=50&apikey=${ETHERSCAN_KEY}`).catch(() => null) : null,
      ETHERSCAN_KEY ? fetch(`https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=50&apikey=${ETHERSCAN_KEY}`).catch(() => null) : null,
    ]);

    if (balRes && balRes.ok) {
      const balData = await balRes.json();
      if (balData.status === '1' && balData.result) {
        const nativeBal = parseFloat(balData.result) / 1e18;
        const q = nativeBal * prices.ETH;
        pushAsset({
          chain: 'Ethereum',
          symbol: 'ETH',
          name: 'Ethereum Native',
          balance: nativeBal,
          formatted: `${nativeBal < 0.0001 && nativeBal > 0 ? '<0.0001' : nativeBal.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ETH`,
          balanceUSD: `$${q.toFixed(2)}`,
          quote: q,
        });
      }
    }

    if (txRes && txRes.ok) {
      const txData = await txRes.json();
      if (Array.isArray(txData.result)) {
        txData.result.forEach((t: any) => {
          const val = parseFloat(t.value || '0') / 1e18;
          pushTx({
            hash: t.hash || '',
            from: t.from || '',
            to: t.to || '',
            value: val > 0 ? (val < 0.0001 ? '<0.0001' : val.toLocaleString('en-US', { maximumFractionDigits: 6 })) : '0',
            timeStamp: t.timeStamp || String(Math.floor(Date.now() / 1000)),
            tokenSymbol: 'ETH',
            tokenDecimal: '18',
            chain: 'Ethereum',
            isError: t.isError || '0',
          });
        });
      }
    }

    if (tokRes && tokRes.ok) {
      const tokData = await tokRes.json();
      if (Array.isArray(tokData.result)) {
        tokData.result.forEach((tt: any) => {
          const dec = parseInt(tt.tokenDecimal || '18', 10);
          const val = parseFloat(tt.value || '0') / Math.pow(10, dec);
          const sym = tt.tokenSymbol || 'USDT';
          pushTx({
            hash: tt.hash || '',
            from: tt.from || '',
            to: tt.to || '',
            value: val > 0 ? (val < 0.0001 ? '<0.0001' : val.toLocaleString('en-US', { maximumFractionDigits: 6 })) : '0',
            timeStamp: tt.timeStamp || String(Math.floor(Date.now() / 1000)),
            tokenSymbol: sym,
            tokenDecimal: String(dec),
            chain: 'Ethereum',
            isError: '0',
          });
        });
      }
    }
  } catch {
    // etherscan query optional
  }

  // 3. Parallel Direct Blockscout & Public RPC Node Queries across all EVM networks
  const blockscoutPromises = BLOCKSCOUT_CHAINS.map((c) =>
    fetchBlockscoutChain(c.baseUrl, c.chainName, c.symbol, address, prices)
  );
  const rpcPromises = BLOCKSCOUT_CHAINS.map(async (c) => {
    try {
      const rpcBal = await fetchRpcBalance(c.rpcUrl, address);
      if (rpcBal >= 0) {
        const rate = c.symbol === 'ETH' ? prices.ETH : c.symbol === 'POL' ? prices.MATIC : c.symbol === 'BNB' ? prices.BNB : 1;
        const q = rpcBal * rate;
        if (rpcBal > 0 || !portfolio.some((x) => x.chain === c.chainName && x.symbol === c.symbol)) {
          pushAsset({
            chain: c.chainName,
            symbol: c.symbol,
            name: `${c.chainName} Native Asset`,
            balance: rpcBal,
            formatted: `${rpcBal < 0.0001 && rpcBal > 0 ? '<0.0001' : rpcBal.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} ${c.symbol}`,
            balanceUSD: `$${q.toFixed(2)}`,
            quote: q,
          });
        }
      }
    } catch {}
  });

  const [bsResults] = await Promise.all([
    Promise.all(blockscoutPromises),
    Promise.all(rpcPromises),
  ]);

  for (const br of bsResults) {
    if (br.portfolio.length > 0) {
      br.portfolio.forEach((p) => pushAsset(p));
    }
    if (br.txs.length > 0) {
      br.txs.forEach((t) => pushTx(t));
    }
  }

  // Sort transactions by timestamp desc
  allTxs.sort((a, b) => parseInt(b.timeStamp || '0', 10) - parseInt(a.timeStamp || '0', 10));

  // Determine primary active chain accurately from discovered transactions and holdings
  const chainTxCount: Record<string, number> = {};
  for (const t of allTxs) {
    const c = t.chain || 'Ethereum';
    chainTxCount[c] = (chainTxCount[c] || 0) + 1;
  }

  let primaryChain = 'Ethereum';
  if (userChoice && userChoice !== 'Auto Detect') {
    primaryChain = userChoice.includes('BNB') || userChoice.includes('BSC') ? 'BNB Chain' :
                   userChoice.includes('Polygon') || userChoice.includes('Matic') ? 'Polygon' :
                   userChoice.includes('Arbitrum') ? 'Arbitrum' :
                   userChoice.includes('Base') ? 'Base' :
                   userChoice.includes('Optimism') ? 'Optimism' :
                   userChoice.includes('Tron') ? 'Tron' :
                   userChoice.includes('Bitcoin') ? 'Bitcoin' :
                   userChoice.includes('Solana') ? 'Solana' : 'Ethereum';
  } else if (portfolio.some((p) => p.balance > 0)) {
    const highestAsset = [...portfolio].filter((p) => p.balance > 0).sort((a, b) => b.quote - a.quote)[0];
    if (highestAsset) primaryChain = highestAsset.chain;
  } else if (Object.keys(chainTxCount).length > 0) {
    const topChain = Object.entries(chainTxCount).sort((a, b) => b[1] - a[1])[0];
    primaryChain = topChain[0];
  } else {
    primaryChain = 'Ethereum';
  }

  // Ensure primary native asset is in portfolio
  const nativeSymbol = primaryChain === 'BNB Chain' ? 'BNB' : primaryChain === 'Polygon' ? 'POL' : 'ETH';
  const existingPrimary = portfolio.find((p) => p.chain === primaryChain && p.symbol === nativeSymbol);
  if (!existingPrimary) {
    portfolio.unshift({
      chain: primaryChain,
      symbol: nativeSymbol,
      name: `${primaryChain} Native Asset`,
      balance: 0,
      formatted: `0.0000 ${nativeSymbol}`,
      balanceUSD: '$0.00',
      quote: 0,
    });
  }

  // Calculate accurate total USD portfolio balance
  const totalUSD = portfolio.reduce((acc, p) => acc + (p.quote || 0), 0);

  // Build summary balance string matching explorer
  let balanceStr = `0.0000 ${nativeSymbol}`;
  const nonZeroAssets = portfolio.filter((p) => p.balance > 0);
  const primaryNative = portfolio.find((p) => p.chain === primaryChain && p.symbol === nativeSymbol);

  if (primaryNative && primaryNative.balance > 0) {
    const otherAssets = nonZeroAssets.filter((p) => p !== primaryNative);
    if (otherAssets.length > 0) {
      balanceStr = `${primaryNative.formatted} (+${otherAssets.length} tokens)`;
    } else {
      balanceStr = primaryNative.formatted;
    }
  } else if (nonZeroAssets.length > 0) {
    balanceStr = nonZeroAssets.slice(0, 2).map((p) => p.formatted).join(' · ');
  } else if (primaryNative) {
    balanceStr = primaryNative.formatted;
  }

  const { score, factors, typology } = computeRisk(allTxs, address);

  const sortedTimestamps = allTxs
    .map((t) => parseInt(t.timeStamp || '0', 10))
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);

  const firstSeen = sortedTimestamps[0]
    ? new Date(sortedTimestamps[0] * 1000).toLocaleDateString('en-IN')
    : 'N/A';
  const lastSeen = sortedTimestamps[sortedTimestamps.length - 1]
    ? new Date(sortedTimestamps[sortedTimestamps.length - 1] * 1000).toLocaleDateString('en-IN')
    : 'N/A';

  return {
    address,
    chain: primaryChain,
    balance: balanceStr,
    balanceUSD: `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    portfolio,
    txCount: allTxs.length,
    firstSeen,
    lastSeen,
    recentTxs: allTxs.slice(0, 40),
    riskScore: score,
    riskFactors: factors,
    typology,
    counterparties: aggregateCounterparties(allTxs, address, nativeSymbol),
  };
}


// ── Tron Live Analysis (TronGrid API with TRC-20 Support) ───────────────────
export async function analyzeTronWallet(address: string): Promise<WalletAnalysis> {
  const prices = await getCryptoPrices();
  const headers: Record<string, string> = {};
  if (TRONGRID_KEY) headers['TRON-PRO-API-KEY'] = TRONGRID_KEY;

  const [accRes, txRes, trc20Res] = await Promise.all([
    fetch(`https://api.trongrid.io/v1/accounts/${address}`, { headers }).catch(() => null),
    fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=50&order_by=block_timestamp,desc`, { headers }).catch(() => null),
    fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50&order_by=block_timestamp,desc`, { headers }).catch(() => null),
  ]);

  const accData = accRes && accRes.ok ? await accRes.json() : {};
  const txData = txRes && txRes.ok ? await txRes.json() : {};
  const trc20Data = trc20Res && trc20Res.ok ? await trc20Res.json() : {};

  const balTrx = accData.data?.[0]?.balance
    ? (accData.data[0].balance / 1e6).toFixed(2)
    : '0';

  const portfolio: PortfolioAsset[] = [];
  let totalUSD = parseFloat(balTrx) * prices.TRX;

  if (parseFloat(balTrx) > 0) {
    portfolio.push({
      chain: 'Tron',
      symbol: 'TRX',
      name: 'TRON Native',
      balance: parseFloat(balTrx),
      formatted: `${balTrx} TRX`,
      balanceUSD: `$${totalUSD.toFixed(2)}`,
      quote: totalUSD,
    });
  }

  // Parse TRC-20 token balances in account
  if (Array.isArray(accData.data?.[0]?.trc20)) {
    for (const tokenMap of accData.data[0].trc20) {
      for (const [contractAddr, rawVal] of Object.entries(tokenMap)) {
        const valUsdt = parseFloat(String(rawVal)) / 1e6;
        if (valUsdt > 0) {
          totalUSD += valUsdt;
          portfolio.push({
            chain: 'Tron',
            symbol: 'USDT',
            name: 'Tether USD (TRC-20)',
            balance: valUsdt,
            formatted: `${valUsdt.toLocaleString()} USDT`,
            balanceUSD: `$${valUsdt.toFixed(2)}`,
            quote: valUsdt,
          });
        }
      }
    }
  }

  const rawTxs: RawTx[] = [];

  // Parse regular Tron transactions
  if (Array.isArray(txData.data)) {
    for (const t of txData.data) {
      let from = address;
      let to = address;
      let val = '0';
      let tokenSymbol: string | undefined = 'TRX';
      let tokenDecimal: string | undefined = '6';

      const contract = t.raw_data?.contract?.[0];
      if (contract) {
        const valObj = contract.parameter?.value;
        const type = contract.type;

        if (valObj) {
          if (valObj.owner_address) from = await hexToBase58Check(valObj.owner_address);
          if (type === 'TransferContract' && valObj.to_address) {
            to = await hexToBase58Check(valObj.to_address);
            val = String((valObj.amount ?? 0) / 1e6);
          }
        }
      }

      rawTxs.push({
        hash: t.txID as string ?? '',
        from,
        to,
        value: val,
        timeStamp: String(Math.floor(((t.block_timestamp as number) ?? 0) / 1000)),
        tokenSymbol,
        tokenDecimal,
        chain: 'Tron',
        isError: '0',
      });
    }
  }

  // Parse dedicated TRC-20 transactions (USDT Transfers)
  if (Array.isArray(trc20Data.data)) {
    for (const tt of trc20Data.data) {
      const dec = tt.token_info?.decimals || 6;
      const tokVal = parseFloat(tt.value || '0') / Math.pow(10, dec);
      const sym = tt.token_info?.symbol || 'USDT';

      rawTxs.push({
        hash: tt.transaction_id || '',
        from: tt.from || '',
        to: tt.to || '',
        value: String(tokVal),
        timeStamp: String(Math.floor(((tt.block_timestamp as number) ?? Date.now()) / 1000)),
        tokenSymbol: sym,
        tokenDecimal: String(dec),
        chain: 'Tron',
        isError: '0',
      });
    }
  }

  // Sort by timestamp desc
  rawTxs.sort((a, b) => parseInt(b.timeStamp || '0', 10) - parseInt(a.timeStamp || '0', 10));

  const { score, factors, typology } = computeRisk(rawTxs, address);

  const sortedTimestamps = rawTxs
    .map((t) => parseInt(t.timeStamp || '0', 10))
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);

  const firstSeen = sortedTimestamps[0]
    ? new Date(sortedTimestamps[0] * 1000).toLocaleDateString('en-IN')
    : 'N/A';
  const lastSeen = sortedTimestamps[sortedTimestamps.length - 1]
    ? new Date(sortedTimestamps[sortedTimestamps.length - 1] * 1000).toLocaleDateString('en-IN')
    : 'N/A';

  const balanceStr = portfolio.length > 0
    ? portfolio.slice(0, 2).map((p) => p.formatted).join(' · ')
    : `${balTrx} TRX`;

  return {
    address,
    chain: 'Tron',
    balance: balanceStr,
    balanceUSD: `$${totalUSD.toFixed(2)}`,
    portfolio,
    txCount: rawTxs.length,
    firstSeen,
    lastSeen,
    recentTxs: rawTxs.slice(0, 30),
    riskScore: score,
    riskFactors: factors,
    typology,
    counterparties: aggregateCounterparties(rawTxs, address, 'TRX'),
  };
}

// ── Bitcoin Live Analysis (Blockstream Public API + Mempool Fallback) ──────
export async function analyzeBitcoinWallet(address: string): Promise<WalletAnalysis> {
  const prices = await getCryptoPrices();

  let addrData: any = null;
  let txsData: any[] = [];

  try {
    const [addrRes, txsRes] = await Promise.all([
      fetch(`https://blockstream.info/api/address/${address}`).catch(() => null),
      fetch(`https://blockstream.info/api/address/${address}/txs`).catch(() => null),
    ]);

    if (addrRes && addrRes.ok) {
      addrData = await addrRes.json();
      txsData = txsRes && txsRes.ok ? await txsRes.json() : [];
    }
  } catch {
    // fallback to mempool.space
    try {
      const [addrRes, txsRes] = await Promise.all([
        fetch(`https://mempool.space/api/address/${address}`).catch(() => null),
        fetch(`https://mempool.space/api/address/${address}/txs`).catch(() => null),
      ]);
      if (addrRes && addrRes.ok) {
        addrData = await addrRes.json();
        txsData = txsRes && txsRes.ok ? await txsRes.json() : [];
      }
    } catch {
      // offline
    }
  }

  const funded = addrData?.chain_stats?.funded_txo_sum ?? 0;
  const spent = addrData?.chain_stats?.spent_txo_sum ?? 0;
  const satoshis = Math.max(0, funded - spent);
  const btcBal = (satoshis / 1e8).toFixed(6);
  const usd = parseFloat(btcBal) * prices.BTC;

  const rawTxs: RawTx[] = (Array.isArray(txsData) ? txsData : []).map((t) => {
    let from = 'External Inflow';
    let to = address;
    let valueSat = 0;

    if (t.vin && t.vin.length > 0) {
      from = t.vin[0]?.prevout?.scriptpubkey_address || 'Bitcoin Input';
    }

    if (t.vout && t.vout.length > 0) {
      const match = t.vout.find((o: any) => o.scriptpubkey_address === address);
      if (match) {
        valueSat = match.value ?? 0;
        to = address;
      } else {
        to = t.vout[0]?.scriptpubkey_address || 'Bitcoin Output';
        valueSat = t.vout[0]?.value ?? 0;
      }
    }

    return {
      hash: t.txid ?? '',
      from,
      to,
      value: String(valueSat / 1e8),
      timeStamp: String(t.status?.block_time ?? Math.floor(Date.now() / 1000)),
      tokenSymbol: 'BTC',
      tokenDecimal: '8',
      chain: 'Bitcoin',
    };
  });

  const { score, factors, typology } = computeRisk(rawTxs, address);

  const sortedTimestamps = rawTxs
    .map((t) => parseInt(t.timeStamp || '0', 10))
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);

  const firstSeen = sortedTimestamps[0]
    ? new Date(sortedTimestamps[0] * 1000).toLocaleDateString('en-IN')
    : 'N/A';
  const lastSeen = sortedTimestamps[sortedTimestamps.length - 1]
    ? new Date(sortedTimestamps[sortedTimestamps.length - 1] * 1000).toLocaleDateString('en-IN')
    : 'N/A';

  return {
    address,
    chain: 'Bitcoin',
    balance: `${btcBal} BTC`,
    balanceUSD: `$${usd.toFixed(2)}`,
    portfolio: [
      {
        chain: 'Bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin Native',
        balance: parseFloat(btcBal),
        formatted: `${btcBal} BTC`,
        balanceUSD: `$${usd.toFixed(2)}`,
        quote: usd,
      }
    ],
    txCount: addrData?.chain_stats?.tx_count ?? rawTxs.length,
    firstSeen,
    lastSeen,
    recentTxs: rawTxs.slice(0, 30),
    riskScore: score,
    riskFactors: factors,
    typology,
    counterparties: aggregateCounterparties(rawTxs, address, 'BTC'),
  };
}

// ── Solana Live Analysis (Solana Public RPC) ────────────────────────────────
export async function analyzeSolanaWallet(address: string): Promise<WalletAnalysis> {
  const prices = await getCryptoPrices();

  let lamports = 0;
  let sigs: any[] = [];

  try {
    const res = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      lamports = data.result?.value ?? 0;
    }

    const sigRes = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getSignaturesForAddress',
        params: [address, { limit: 20 }],
      }),
    });

    if (sigRes.ok) {
      const sigData = await sigRes.json();
      sigs = sigData.result ?? [];
    }
  } catch {
    // Solana RPC offline
  }

  const solBal = (lamports / 1e9).toFixed(4);
  const usd = parseFloat(solBal) * prices.SOL;

  const rawTxs: RawTx[] = sigs.map((s) => ({
    hash: s.signature ?? '',
    from: s.err ? 'Failed Signature' : 'Solana Transaction',
    to: address,
    value: '0',
    timeStamp: String(s.blockTime ?? Math.floor(Date.now() / 1000)),
    isError: s.err ? '1' : '0',
    tokenSymbol: 'SOL',
    tokenDecimal: '9',
    chain: 'Solana',
  }));

  const { score, factors, typology } = computeRisk(rawTxs, address);

  return {
    address,
    chain: 'Solana',
    balance: `${solBal} SOL`,
    balanceUSD: `$${usd.toFixed(2)}`,
    portfolio: [
      {
        chain: 'Solana',
        symbol: 'SOL',
        name: 'Solana Native',
        balance: parseFloat(solBal),
        formatted: `${solBal} SOL`,
        balanceUSD: `$${usd.toFixed(2)}`,
        quote: usd,
      }
    ],
    txCount: sigs.length,
    firstSeen: sigs[sigs.length - 1]?.blockTime
      ? new Date(sigs[sigs.length - 1].blockTime * 1000).toLocaleDateString('en-IN')
      : 'N/A',
    lastSeen: sigs[0]?.blockTime
      ? new Date(sigs[0].blockTime * 1000).toLocaleDateString('en-IN')
      : 'N/A',
    recentTxs: rawTxs,
    riskScore: score,
    riskFactors: factors,
    typology,
    counterparties: aggregateCounterparties(rawTxs, address, 'SOL'),
  };
}

// ── Unified Master Multi-Chain Tracing Entrypoint ───────────────────────────
export async function analyzeWallet(
  address: string,
  userChoice?: string,
): Promise<WalletAnalysis> {
  const trimmed = address.trim();
  const chainType = detectChain(trimmed, userChoice);

  if (chainType === 'unknown') {
    throw new Error('Unsupported wallet address format. Please enter a valid Ethereum/EVM (0x), Tron (T), Bitcoin (1/3/bc1), or Solana address.');
  }

  try {
    if (chainType === 'tron') {
      return await analyzeTronWallet(trimmed);
    } else if (chainType === 'bitcoin') {
      return await analyzeBitcoinWallet(trimmed);
    } else if (chainType === 'solana') {
      return await analyzeSolanaWallet(trimmed);
    } else {
      return await analyzeMultiChainEvm(trimmed, userChoice);
    }
  } catch (err) {
    console.warn(`Direct API query returned error for ${trimmed}:`, err);
  }

  // Gracefully return authentic empty state if network is unreachable
  const chainName = userChoice || (
    chainType === 'tron' ? 'Tron' :
    chainType === 'bitcoin' ? 'Bitcoin' :
    chainType === 'solana' ? 'Solana' :
    chainType === 'bsc' ? 'BNB Chain' :
    chainType === 'polygon' ? 'Polygon' :
    chainType === 'arbitrum' ? 'Arbitrum' :
    'Ethereum'
  );

  return {
    address: trimmed,
    chain: chainName,
    balance: `0.0000 ${chainType === 'tron' ? 'TRX' : chainType === 'bitcoin' ? 'BTC' : chainType === 'solana' ? 'SOL' : 'ETH'}`,
    balanceUSD: '$0.00',
    portfolio: [],
    txCount: 0,
    firstSeen: 'N/A',
    lastSeen: 'N/A',
    recentTxs: [],
    riskScore: 10,
    riskFactors: ['No on-chain transaction history detected'],
    typology: 'Inactive / Fresh Address',
    counterparties: [],
  };
}

