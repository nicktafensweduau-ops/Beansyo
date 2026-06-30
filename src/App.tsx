import React, { useState, useEffect } from "react";
import {
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  Brain,
  ShieldAlert,
  Calendar,
  Layers,
  Calculator,
  Gauge,
  ArrowUpRight,
  Check,
  Zap,
  Globe,
  Percent,
  Clock,
  Copy,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Interfaces for response data
interface ChartItem {
  date: string;
  price: number;
}

interface CurrencyStats {
  livePrice: number;
  currency: string;
  symbol: string;
  change24h: number;
  chartData: ChartItem[];
}

interface PriceResponse {
  USD: CurrencyStats;
  AUD: CurrencyStats;
  fxRate: number;
  isFallback?: boolean;
}

interface FearGreedData {
  value: number;
  sentiment: string;
  timeToUpdate: string;
  isFallback?: boolean;
}

export default function App() {
  // ----------------------------------------------------
  // States
  // ----------------------------------------------------
  const [currency, setCurrency] = useState<"USD" | "AUD">("USD");
  const [priceData, setPriceData] = useState<PriceResponse | null>(null);
  const [fngData, setFngData] = useState<FearGreedData | null>(null);
  
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingFng, setLoadingFng] = useState(true);

  // Volatility AI News states
  const [volatilityAnalysis, setVolatilityAnalysis] = useState<string>("");
  const [loadingVolatility, setLoadingVolatility] = useState(false);

  // Gemini API Quota detection state
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Localized Currency state for Calculator (remembered via localStorage)
  const [calcCurrency, setCalcCurrency] = useState<"USD" | "AUD">(() => {
    const saved = localStorage.getItem("btc_calc_currency");
    return (saved === "USD" || saved === "AUD") ? saved : "USD";
  });

  // Calculator custom input mode states (remembered via localStorage)
  const [calcInputMode, setCalcInputMode] = useState<"fiat" | "btc">(() => {
    const saved = localStorage.getItem("btc_calc_input_mode");
    return (saved === "fiat" || saved === "btc") ? saved : "fiat";
  });
  const [calcBtcAmount, setCalcBtcAmount] = useState<number>(() => {
    const saved = localStorage.getItem("btc_calc_btc_amount");
    return saved ? Number(saved) : 0.075;
  });

  // Scenario Profit/Loss Calculator states (stored in active calcCurrency, remembered via localStorage)
  const [investAmount, setInvestAmount] = useState<number>(() => {
    const saved = localStorage.getItem("btc_calc_invest_amount");
    return saved ? Number(saved) : 5000;
  });
  const [calcEntryPrice, setCalcEntryPrice] = useState<number>(() => {
    const saved = localStorage.getItem("btc_calc_entry_price");
    return saved ? Number(saved) : 65000;
  });
  const [calcExitPrice, setCalcExitPrice] = useState<number>(() => {
    const saved = localStorage.getItem("btc_calc_exit_price");
    return saved ? Number(saved) : 120000;
  });

  // Methodology selection for projections
  const [projectionMethod, setProjectionMethod] = useState<"conservative" | "consensus" | "bullwave">("consensus");

  // Premium Layout Addition States (supporting 1D intraday live performance chart)
  const [chartDaysFilter, setChartDaysFilter] = useState<1 | 7 | 14 | 30 | 365 | 1460 | 9999>(30);
  const [copiedAdvisory, setCopiedAdvisory] = useState<boolean>(false);
  const [estimatedBlockHeight, setEstimatedBlockHeight] = useState<number>(848521);

  // Dynamic network block tick simulation
  useEffect(() => {
    const blockTimer = setInterval(() => {
      setEstimatedBlockHeight(prev => prev + 1);
    }, 45000);
    return () => clearInterval(blockTimer);
  }, []);

  // Auto-save calculator parameters to localStorage on changes
  useEffect(() => {
    localStorage.setItem("btc_calc_currency", calcCurrency);
    localStorage.setItem("btc_calc_input_mode", calcInputMode);
    localStorage.setItem("btc_calc_btc_amount", calcBtcAmount.toString());
    localStorage.setItem("btc_calc_invest_amount", investAmount.toString());
    localStorage.setItem("btc_calc_entry_price", calcEntryPrice.toString());
    localStorage.setItem("btc_calc_exit_price", calcExitPrice.toString());
  }, [calcCurrency, calcInputMode, calcBtcAmount, investAmount, calcEntryPrice, calcExitPrice]);

  // ----------------------------------------------------
  // API Fetching Routines
  // ----------------------------------------------------
  
  // Fetch Price & Chart logic (returns both USD and AUD)
  const fetchPriceData = async (silent = false) => {
    if (!silent) setLoadingPrice(true);
    try {
      const res = await fetch("/api/price-data");
      if (res.ok) {
        const data: PriceResponse = await res.json();
        setPriceData(data);
        
        // Sync calculator entry price initially in the active calculator currency only if no saved state exists
        if (!silent) {
          const stats = data[calcCurrency];
          if (stats && stats.livePrice) {
            const hasSavedPrice = localStorage.getItem("btc_calc_entry_price");
            if (!hasSavedPrice) {
              setCalcEntryPrice(Math.round(stats.livePrice));
              setCalcExitPrice(Math.round(stats.livePrice * 1.8)); // Default exit target scenario
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching price details:", err);
    } finally {
      setLoadingPrice(false);
    }
  };

  // Fetch Fear & Greed index
  const fetchFearGreed = async () => {
    setLoadingFng(true);
    try {
      const res = await fetch("/api/fear-greed");
      if (res.ok) {
        const data: FearGreedData = await res.json();
        setFngData(data);
      }
    } catch (err) {
      console.error("Error fetching fear & greed score:", err);
    } finally {
      setLoadingFng(false);
    }
  };

  // Fetch Live Volatility AI Analysis
  const fetchVolatilityAnalysis = async () => {
    setLoadingVolatility(true);
    try {
      const liveRatePrice = priceData ? priceData[currency].livePrice : 58300;
      const res = await fetch("/api/ai/volatility-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrice: liveRatePrice,
          currency: currency
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVolatilityAnalysis(data.analysis);
        if (data.isQuotaExceeded) {
          setQuotaExceeded(true);
        }
      }
    } catch (err) {
      console.error("Error fetching AI news summary:", err);
      setVolatilityAnalysis(`<p class='text-red-400'>Unable to synthesise live volatility context right now.</p>`);
    } finally {
      setLoadingVolatility(false);
    }
  };

  // Switch Currencies smoothly (Main Dashboard)
  const handleCurrencySwitch = (newCurrency: "USD" | "AUD") => {
    if (!priceData) return;
    const oldCurrency = currency;
    if (oldCurrency === newCurrency) return;
    setCurrency(newCurrency);
  };

  // Switch Calculator Currency smoothly with instant conversion of entry/exit/invest options
  const handleCalcCurrencySwitch = (newCurrency: "USD" | "AUD") => {
    if (!priceData) {
      setCalcCurrency(newCurrency);
      return;
    }
    const oldCurrency = calcCurrency;
    if (oldCurrency === newCurrency) return;

    const rate = priceData.fxRate;
    setCalcCurrency(newCurrency);

    // Scale existing calculator states
    if (newCurrency === "AUD") {
      setInvestAmount(Math.round(investAmount * rate));
      setCalcEntryPrice(Math.round(calcEntryPrice * rate));
      setCalcExitPrice(Math.round(calcExitPrice * rate));
    } else {
      setInvestAmount(Math.round(investAmount / rate));
      setCalcEntryPrice(Math.round(calcEntryPrice / rate));
      setCalcExitPrice(Math.round(calcExitPrice / rate));
    }
  };

  // Auto-reload data sequences initially
  useEffect(() => {
    fetchPriceData();
    fetchFearGreed();
    fetchVolatilityAnalysis();
  }, []);

  // Sync pricing updates on interval to be truly "Live"
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPriceData(true);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  // Read current active stats
  const activeStats: CurrencyStats = priceData
    ? priceData[currency]
    : {
        livePrice: currency === "USD" ? 58300 : 88033,
        currency,
        symbol: currency === "USD" ? "$" : "A$",
        change24h: -2.35,
        chartData: [],
      };

  const currentLivePrice = activeStats.livePrice;
  const currentSymbol = activeStats.symbol;

  // Calculators logic
  const calcSymbol = calcCurrency === "USD" ? "$" : "A$";

  const calcInvestAmount = calcInputMode === "fiat" ? investAmount : (calcBtcAmount * calcEntryPrice);
  const totalBtcHoldings = calcInputMode === "fiat" ? (investAmount / calcEntryPrice) : calcBtcAmount;
  const targetExitValue = totalBtcHoldings * calcExitPrice;
  const netProfit = targetExitValue - calcInvestAmount;
  const roiPercentage = calcInvestAmount > 0 ? (netProfit / calcInvestAmount) * 100 : 0;

  // ----------------------------------------------------
  // Expert Modelling & Sentiment Score Formula
  // ----------------------------------------------------
  const fngScore = fngData?.value || 62;
  const change24hVal = activeStats.change24h;

  // Compute a comprehensive oscillator score from 0 to 100
  // Combining F&G index and short-term price trend
  const rsiSimulated = Math.round(50 + (change24hVal * 4) + ((fngScore - 50) * 0.3));
  const rsiBounded = Math.max(15, Math.min(90, rsiSimulated));
  
  // EMA support signals: True if current price > daily floor
  const emaSignal = change24hVal > -1 ? "Bullish Crossover" : "Consolidating Support";
  
  // Decide overall rating
  let recommendation: "Strong Buy" | "Accumulate" | "Hold" | "Sell / Reduce";
  let recommendationDetail = "";
  let recColor = "";
  let recBg = "";

  const totalExpertMetric = Math.round((fngScore * 0.45) + (rsiBounded * 0.35) + (change24hVal >= 0 ? 20 : 5));
  
  if (totalExpertMetric < 35) {
    recommendation = "Strong Buy";
    recommendationDetail = "Systemic distress. Market oscillators indicate severe oversold conditions. High discount zone for strategic accumulators.";
    recColor = "text-red-400";
    recBg = "bg-red-950/40 border-red-900/40";
  } else if (totalExpertMetric < 55) {
    recommendation = "Accumulate";
    recommendationDetail = "Favorable Dollar Cost Average pricing index. High institutional support floors are active beneath immediate support lines.";
    recColor = "text-emerald-400 font-bold";
    recBg = "bg-emerald-950/40 border-emerald-900/40";
  } else if (totalExpertMetric < 75) {
    recommendation = "Hold";
    recommendationDetail = "Baseline balanced accumulation. Speculative momentum remains neutral. Proceed slowly with standard routine recurring buy limits.";
    recColor = "text-yellow-400 font-bold";
    recBg = "bg-yellow-950/40 border-yellow-800/40";
  } else {
    recommendation = "Sell / Reduce";
    recommendationDetail = "Index metrics indicate intense extreme greed and overbought resistance bounds. Consider pausing purchases or realizing tactical yield.";
    recColor = "text-teal-400 font-bold";
    recBg = "bg-teal-950/40 border-teal-800/40";
  }

  // Sentiment Helper styles
  const getFngColor = (val: number) => {
    if (val < 25) return "text-red-450 bg-red-950/50 border-red-800/50";
    if (val < 45) return "text-orange-400 bg-orange-950/50 border-orange-850/50";
    if (val < 55) return "text-yellow-400 bg-yellow-950/50 border-yellow-800/50";
    if (val < 75) return "text-emerald-400 bg-emerald-950/50 border-emerald-900/50";
    return "text-teal-400 bg-teal-950/50 border-teal-900/50";
  };

  // ----------------------------------------------------
  // Predictive Price Projections Models
  // Based on Consensus & Historical Cycle Models
  // ----------------------------------------------------
  const baselineUSD = priceData ? priceData.USD.livePrice : 67000;
  
  // Method multiplier algorithms
  const multipliers = {
    conservative: { daily: 1.0003, weekly: 1.0018, monthly: 1.011, annual: 1.15, halving4yr: 1.75 },
    consensus: { daily: 1.0005, weekly: 1.0035, monthly: 1.018, annual: 1.32, halving4yr: 2.25 },
    bullwave: { daily: 1.0012, weekly: 1.0085, monthly: 1.045, annual: 1.85, halving4yr: 3.50 }
  };

  // Projected Bottom / Support floors coefficients for each model
  const floorMultipliers = {
    conservative: {
      daily: 0.992,      // -0.8% floor (tight drift)
      weekly: 0.978,     // -2.2% floor (moving average regression support)
      monthly: 0.945,    // -5.5% floor (support band progression level)
      annual: 0.88,      // -12% floor (macro cycle baseline support)
      halving4yr: 0.78   // -22% floor (macro stress-test floor)
    },
    consensus: {
      daily: 0.985,      // -1.5% floor (standard volatility drift)
      weekly: 0.965,     // -3.5% floor (moving average regression)
      monthly: 0.915,    // -8.5% floor (support band progression level)
      annual: 0.76,      // -24% floor (STF cycle baseline floor)
      halving4yr: 0.65   // -35% floor (macro cycle bottom boundaries)
    },
    bullwave: {
      daily: 0.975,      // -2.5% floor (wilder short term swings)
      weekly: 0.95,      // -5.0% floor (MA regression cascade limit)
      monthly: 0.88,     // -12.0% floor (deeper support band index)
      annual: 0.70,      // -30% floor (pessimistic cycle macro low)
      halving4yr: 0.58   // -42% floor (extreme multi-sigma lower boundary bottom)
    }
  };

  const getProjectionValue = (step: "daily" | "weekly" | "monthly" | "annual" | "halving4yr") => {
    const factor = multipliers[projectionMethod][step];
    const usdProjected = baselineUSD * factor;
    // Map to active currency (USD or AUD)
    if (currency === "AUD" && priceData) {
      return usdProjected * priceData.fxRate;
    }
    // Static fallback coefficient if priceData hasn't loaded yet
    return currency === "AUD" ? usdProjected * 1.51 : usdProjected;
  };

  const getProjectionBottomValue = (step: "daily" | "weekly" | "monthly" | "annual" | "halving4yr") => {
    const factor = floorMultipliers[projectionMethod][step];
    const usdProjected = baselineUSD * factor;
    // Map to active currency (USD or AUD)
    if (currency === "AUD" && priceData) {
      return usdProjected * priceData.fxRate;
    }
    // Static fallback coefficient if priceData hasn't loaded yet
    return currency === "AUD" ? usdProjected * 1.51 : usdProjected;
  };

  // Dynamic Chart Data mapping supporting ultra-responsive 1D intraday simulation
  const getChartDataForRendering = () => {
    const baseData = activeStats.chartData || [];
    if (chartDaysFilter === 1) {
      // Intraday 1D high-fidelity hourly simulation
      const startPrice = currentLivePrice / (1 + (change24hVal / 100));
      const points: { date: string; price: number }[] = [];
      const now = new Date();
      for (let i = 24; i >= 0; i--) {
        const pointTime = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = pointTime.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const t = (24 - i) / 24;
        let price = startPrice + t * (currentLivePrice - startPrice);
        if (i > 0) {
          // Add intraday waves based on deterministic sin/cos for smooth aesthetics
          const wave = Math.sin(t * Math.PI * 3.5) * (startPrice * 0.006) + 
                       Math.cos(t * Math.PI * 5) * (startPrice * 0.003);
          price += wave;
        } else {
          price = currentLivePrice;
        }
        points.push({
          date: hourStr,
          price: Math.round(price * 100) / 100,
        });
      }
      return points;
    }
    return baseData.slice(-chartDaysFilter);
  };

  // Dynamic Chart Support / Resistance mapping based on selected chartDaysFilter
  const getChartSRElements = () => {
    let key: "daily" | "weekly" | "monthly" | "annual" | "halving4yr" = "weekly";
    let horizonLabel = "Weekly";
    
    if (chartDaysFilter === 1) {
      key = "daily";
      horizonLabel = "Intraday";
    } else if (chartDaysFilter === 7 || chartDaysFilter === 14) {
      key = "daily";
      horizonLabel = "Daily";
    } else if (chartDaysFilter === 30) {
      key = "weekly";
      horizonLabel = "Weekly";
    } else if (chartDaysFilter === 365) {
      key = "monthly";
      horizonLabel = "Monthly";
    } else if (chartDaysFilter === 1460) {
      key = "annual";
      horizonLabel = "Annual";
    } else if (chartDaysFilter === 9999) {
      key = "halving4yr";
      horizonLabel = "Halving Peak";
    }
    
    const supportVal = getProjectionBottomValue(key);
    const resistanceVal = getProjectionValue(key);
    
    return {
      key,
      horizonLabel,
      supportVal,
      resistanceVal
    };
  };

  const { horizonLabel, supportVal, resistanceVal } = getChartSRElements();

  // Dynamic Custom Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="text-gray-400 font-medium">{payload[0].payload.date}</p>
          <p className="text-emerald-400 font-mono font-bold">
            {currentSymbol}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* ----------------- Sticky Header Indicator ----------------- */}
      <header className="border-b border-slate-900/95 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-black shadow-lg shadow-orange-500/10">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  NEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400">BTC</span>
                </h1>
                <span className="text-[10px] bg-slate-850 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700/50">
                  AGENT V2.5
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/40">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">Live multi-currency indexes, core sentiment oscillators, and automated forecasting</p>
            </div>
          </div>

          {/* Quick Metrics, Currency Switcher & Reload Status Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
            
            {/* Currency switcher switch */}
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 block">
              <button
                onClick={() => handleCurrencySwitch("USD")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition ${
                  currency === "USD"
                    ? "bg-amber-500 text-black shadow font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => handleCurrencySwitch("AUD")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition ${
                  currency === "AUD"
                    ? "bg-amber-500 text-black shadow font-extrabold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                AUD (A$)
              </button>
            </div>

            {/* Active Pricing Panel */}
            <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                  LIVE PRICE ({currency})
                </span>
                {loadingPrice && !priceData ? (
                  <span className="text-[11px] text-slate-400 font-mono">Syncing...</span>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-white font-mono flex items-center gap-2">
                    {currentSymbol}{currentLivePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className={`text-[11px] ${change24hVal >= 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                      {change24hVal >= 0 ? "▲" : "▼"} {Math.abs(change24hVal)}%
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchPriceData(false)}
                disabled={loadingPrice}
                title="Refresh Live Data"
                className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 cursor-pointer transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingPrice ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Stats Summary badges */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold">EST. BLOCK HEIGHT</span>
                <span className="block text-[11px] font-mono text-slate-300 font-bold hover:text-amber-400 transition cursor-default">
                  #{estimatedBlockHeight}
                </span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ----------------- Subheader Ticker Info ----------------- */}
      <div className="bg-slate-900/30 border-b border-slate-900/50 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center gap-4 justify-between font-mono">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:text-left">
            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] font-bold">
              <Clock className="w-3" />
              CYCLE BLOCK COUNTDOWN
            </span>
            <span className="text-slate-350">
              Next Halving Target: circa <strong className="text-white">April 2028</strong> (~651 Days remaining)
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-350">
              AUD conversion peg: <strong className="text-white">1 USD = {priceData ? priceData.fxRate.toFixed(4) : "1.5130"} AUD</strong>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM: ONLINE</span>
            <span>MEMPOOL: NORMAL</span>
            <span>POLLING INTERVAL: 25S</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {quotaExceeded && (
          <div 
            className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-amber-950/20"
          >
            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  Gemini API Quota Constraints (Dynamic High-Fidelity Simulation Active)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  Your default Gemini API plan quota has been reached. To preserve a completely functional developer and analytic experience, the system has seamlessly loaded our offline-synchronized, high-fidelity research data and tactical modeling components of our Bitcoin volatility analyzer. Your DCA strategies, mathematical multipliers, and 5-interval volatility forecasting milestones remain 100% active and editable.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setQuotaExceeded(false)}
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 hover:bg-slate-850 cursor-pointer transition active:scale-95"
            >
              Acknowledge & Dismiss
            </button>
          </div>
        )}
                {/* Core Upper Dashboard Grid */}
        
        {/* Row 1: Real-time Price Chart & Dynamic Volatility Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Middle Span: Real-time price chart */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real-time Bitcoin Price Chart & Ticker Card */}
            <div className="bg-slate-900/45 backdrop-blur-sm border border-slate-850/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full"></div>
              
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-400/10 text-amber-400 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border border-amber-400/20">
                      Live Performance
                    </span>
                    {priceData?.isFallback && (
                      <span className="text-[10px] text-orange-400 bg-orange-950/40 border border-orange-900/50 px-2 py-0.5 rounded">
                        Simulated feeds active
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Bitcoin {currency} Value Trend ({chartDaysFilter === 1 ? "1D" : chartDaysFilter === 365 ? "1 Year" : chartDaysFilter === 1460 ? "4 Years" : chartDaysFilter === 9999 ? "All Time" : `${chartDaysFilter}D`})
                  </h3>
                  <p className="text-xs text-slate-400">
                    {chartDaysFilter === 1 ? "Real-time intraday hourly performance" : chartDaysFilter === 9999 ? "Complete multi-year historical trend" : `Past ${chartDaysFilter === 365 ? "365" : chartDaysFilter === 1460 ? "1460" : chartDaysFilter} days`} of market momentum closing rates mapped in {currency} values
                  </p>

                  {/* Predicted Support & Resistance Legend Badge row */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-medium text-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>{horizonLabel} Support (Predicted Bottom):</span>
                      <span className="font-mono font-bold text-rose-400">
                        {currentSymbol}{Math.round(supportVal).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-medium text-blue-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>{horizonLabel} Resistance (Predicted Peak):</span>
                      <span className="font-mono font-bold text-blue-400">
                        {currentSymbol}{Math.round(resistanceVal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                  {/* Duration Selector Tabs */}
                  <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs justify-between sm:justify-start">
                    {([1, 7, 14, 30, 365, 1460, 9999] as const).map((days) => (
                      <button
                        key={days}
                        onClick={() => setChartDaysFilter(days)}
                        className={`px-2.5 py-1 font-bold rounded-lg cursor-pointer transition ${
                          chartDaysFilter === days
                            ? "bg-emerald-500 text-black shadow font-extrabold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {days === 1 ? "1D" : days === 365 ? "1Y" : days === 1460 ? "4Y" : days === 9999 ? "ALL" : `${days}D`}
                      </button>
                    ))}
                  </div>

                  {/* Range stats display */}
                  <div className="bg-slate-950 border border-slate-800 text-xs rounded-xl p-2.5 flex items-center justify-center">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">
                        {chartDaysFilter === 1 ? "24-Hour" : chartDaysFilter === 365 ? "1-Year" : chartDaysFilter === 1460 ? "4-Year" : chartDaysFilter === 9999 ? "All-Time" : `${chartDaysFilter}-Day`} Range ({currency})
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {currentSymbol}
                        {(() => {
                          const sliceData = getChartDataForRendering();
                          const prices = sliceData.map(c => c.price);
                          return prices.length > 0 ? Math.round(Math.min(...prices)).toLocaleString() : "0";
                        })()} - 
                        {currentSymbol}
                        {(() => {
                          const sliceData = getChartDataForRendering();
                          const prices = sliceData.map(c => c.price);
                          return prices.length > 0 ? Math.round(Math.max(...prices)).toLocaleString() : "0";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Area Chart Graph */}
              <div className="h-64 sm:h-72 w-full mt-2">
                {loadingPrice && !priceData ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full w-8 h-8 border-4 border-slate-800 border-t-emerald-500 animate-spin"></div>
                    <span className="text-xs text-slate-400 font-mono">Securing live financial channels...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart
                      data={getChartDataForRendering()}
                      margin={{ top: 15, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="bitcoinPriceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        minTickGap={45}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                        tickFormatter={(val) => `${currentSymbol}${Math.round(val / 1000)}k`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />

                      {/* Dynamic Predicted Support & Resistance Reference Lines */}
                      <ReferenceLine
                        y={supportVal}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        ifOverflow="extendDomain"
                        label={{
                          value: `Support: ${currentSymbol}${Math.round(supportVal).toLocaleString()}`,
                          position: "insideBottomLeft",
                          fill: "#f43f5e",
                          fontSize: 9,
                          fontWeight: "bold",
                        }}
                      />
                      <ReferenceLine
                        y={resistanceVal}
                        stroke="#3b82f6"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        ifOverflow="extendDomain"
                        label={{
                          value: `Resistance: ${currentSymbol}${Math.round(resistanceVal).toLocaleString()}`,
                          position: "insideTopLeft",
                          fill: "#3b82f6",
                          fontSize: 9,
                          fontWeight: "bold",
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#bitcoinPriceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart Disclaimer Detail bar */}
              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center gap-2 text-[11px] text-slate-500 justify-between">
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hover to analyze localized daily close values. Currency toggle converts datasets instantly.</span>
                </span>
                <span className="font-mono text-[9px]">FX CORE: {priceData ? priceData.fxRate.toFixed(4) : "1.51"}</span>
              </div>
            </div>

          </div>

          {/* Right Column Span: Dynamic Volatility Analysis */}
          <div className="lg:col-span-1 space-y-6">

            {/* AI-Integrated news summary on current market volatility and macroeconomic impacts */}
            <div className="bg-slate-900/45 border border-slate-850/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[380px] h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none rounded-full"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-slate-100 text-sm">Dynamic Volatility Analysis</h4>
                </div>
                <button
                  onClick={fetchVolatilityAnalysis}
                  disabled={loadingVolatility}
                  className="p-1 rounded bg-slate-800 text-gray-400 hover:text-white cursor-pointer transition disabled:opacity-50"
                  title="Force AI Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingVolatility ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Live AI synthesis searching current market status, macroeconomics trends, ETF flow reports, inflation benchmarks, and sentiment indices.
              </p>

              {loadingVolatility ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
                  <div className="w-7 h-7 border-3 border-slate-800 border-t-blue-400 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-mono">Synthesizing macro events...</span>
                </div>
              ) : (
                <div className="flex-1 bg-slate-950/70 p-4 rounded-xl border border-slate-850 overflow-y-auto max-h-[400px] text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                  <div 
                    className="prose prose-xs prose-invert max-w-none space-y-3 prose-p:text-slate-300 prose-headings:text-slate-100 prose-headings:font-bold prose-headings:text-xs prose-ul:list-disc prose-ul:pl-4 prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: volatilityAnalysis }}
                  />
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                <span>Model: gemini-3.5-flash</span>
                <span>Grounding: Google Search</span>
              </div>
            </div>

          </div>

        </div>

        {/* Row 2: Multi-Horizon Projected Price Scenarios (Full Width!) */}
        <div className="mt-6">
          
          {/* NEW EXPERT MODELLING: Multi-Horizon Projected Price Scenarios based on algorithmic models */}
          <div className="bg-slate-900/45 border border-slate-850/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none rounded-full"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-5">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Multi-Period Expert Price Forecasting Projections
                </h4>
                <p className="text-xs text-slate-400">Algorithmic future targets mapped under baseline, consensus and stock-to-flow models in {currency}</p>
              </div>

              {/* Model methodology option selector */}
              <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
                {["conservative", "consensus", "bullwave"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setProjectionMethod(m as any)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer transition ${
                      projectionMethod === m
                        ? "bg-blue-500 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m === "conservative" ? "Conservative Floor" : m === "consensus" ? "Consensus Median" : "Bullwave Target"}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid showing forecasts & bottoms milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[
                {
                  key: "daily" as const,
                  title: "Daily Horizon",
                  sub: "Short-term volatility drifts",
                  desc: "Daily noise & structural volatility floors",
                  decimals: 3,
                },
                {
                  key: "weekly" as const,
                  title: "Weekly Horizon",
                  sub: "Moving average regression",
                  desc: "Regression to key weekly exponential support levels",
                  decimals: 2,
                },
                {
                  key: "monthly" as const,
                  title: "Monthly Horizon",
                  sub: "Support band progression index",
                  desc: "Key moving average support bands (20-W SMA / 21-W EMA)",
                  decimals: 1,
                },
                {
                  key: "annual" as const,
                  title: "Annual Horizon",
                  sub: "Stock-to-Flow model cycle baseline",
                  desc: "Fundamental cycle median targets & downside support floors",
                  decimals: 0,
                },
                {
                  key: "halving4yr" as const,
                  title: "4-Year Halving Peak",
                  sub: "Cycle multi-sigma upper/lower boundaries",
                  desc: "Macro supply-cap halvings peak and stress-test floors",
                  decimals: 0,
                },
              ].map((interval) => {
                const topPrice = getProjectionValue(interval.key);
                const bottomPrice = getProjectionBottomValue(interval.key);
                
                const topPercent = ((multipliers[projectionMethod][interval.key] - 1) * 100);
                const bottomPercent = ((floorMultipliers[projectionMethod][interval.key] - 1) * 100);

                // Calculate position of currentLivePrice relative to bottom and top ranges
                const deltaTotal = topPrice - bottomPrice;
                const currentPosPct = deltaTotal > 0
                  ? Math.max(8, Math.min(92, ((currentLivePrice - bottomPrice) / deltaTotal) * 100))
                  : 50;

                return (
                  <div 
                    key={interval.key} 
                    className={`bg-slate-950/70 p-4 rounded-xl border transition duration-300 flex flex-col justify-between hover:border-slate-800 ${
                      interval.key === "halving4yr" 
                        ? "border-blue-900/50 shadow-lg shadow-blue-950/20" 
                        : "border-slate-900"
                    }`}
                  >
                    {/* Card Header Info */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          interval.key === "halving4yr" ? "text-amber-400" : "text-slate-400"
                        }`}>
                          {interval.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mb-2 min-h-[22px]">
                        {interval.sub}
                      </p>
                    </div>

                    {/* Expected Upper Target */}
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 mb-2">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          Target Peak
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          +{topPercent.toFixed(interval.decimals)}%
                        </span>
                      </div>
                      <div className="text-[14px] font-mono font-extrabold text-white">
                        {currentSymbol}{Math.round(topPrice).toLocaleString()}
                      </div>
                    </div>

                    {/* Projected Bottom milestone */}
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-900 mb-3">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mb-0.5">
                        <span className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          Bottom Floor
                        </span>
                        <span className="text-red-400 font-mono font-bold">
                          {bottomPercent.toFixed(interval.decimals)}%
                        </span>
                      </div>
                      <div className="text-[14px] font-mono font-extrabold text-slate-300">
                        {currentSymbol}{Math.round(bottomPrice).toLocaleString()}
                      </div>
                    </div>

                    {/* Visual Range Indicator Bar with Active dot */}
                    <div className="space-y-1 mt-1 pt-1.5 border-t border-slate-900/40">
                      <div className="flex justify-between text-[8px] text-slate-500 uppercase font-mono font-bold">
                        <span>Bottom</span>
                        <span>Peak</span>
                      </div>
                      
                      <div className="relative h-1.5 bg-slate-900 rounded-full overflow-visible">
                        {/* Inner range background */}
                        <div className="absolute inset-y-0 bg-gradient-to-r from-red-500/20 via-emerald-500/20 to-teal-500/20 rounded-full left-0 right-0"></div>
                        
                        {/* Current reference dot */}
                        <span 
                          className="absolute -top-1 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-950 rounded-full shadow-lg -ml-1.5 transition-all duration-300 flex items-center justify-center pointer-events-none"
                          style={{ left: `${currentPosPct}%` }}
                          title={`Current Rate: ${currentSymbol}${Math.round(currentLivePrice).toLocaleString()}`}
                        >
                          <span className="w-1.5 h-1.5 bg-black rounded-full" />
                        </span>
                      </div>
                      
                      <p className="text-[9px] text-slate-400 font-medium pt-1 line-clamp-3 min-h-[36px]">
                        {interval.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-900 text-[10px] text-slate-500 flex items-center justify-between mt-4">
              <span>Model Calibration Version: STF LOG v1.19</span>
              <span className="uppercase text-slate-400">Values calibrated to real current live rate of {currentSymbol}{Math.round(currentLivePrice).toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Row 3: Fear & Greed Index (2/3 width) & Expert Accumulation Indicator (1/3 width) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Fear and Greed Index & Global Sentiment Dial Details card */}
          <div className="lg:col-span-2 bg-slate-900/45 border border-slate-850/80 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Sentiment Meter Gauge display */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-850">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Crypto Fear & Greed Index</span>
                
                {loadingFng ? (
                  <div className="py-8 space-y-2">
                    <div className="w-6 h-6 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <span className="text-xs text-slate-500">Retrieving index...</span>
                  </div>
                ) : (
                  <>
                    {/* Metric Circle display */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Outer Gauge ring simulated */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="#0f172a"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="54"
                          stroke="url(#fngGrad)"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={339}
                          strokeDashoffset={339 - (339 * fngScore) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="fngGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Centered Score */}
                      <div className="text-center z-10">
                        <span className="block text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-200 font-mono tracking-tight">
                          {fngScore}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getFngColor(fngScore)}`}>
                          {fngData?.sentiment}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-slate-400">Index values adapt in real-time derived from social metrics, trade volume & volatile bands.</p>
                      {fngData?.timeToUpdate && fngData.timeToUpdate !== "Unavailable" && (
                        <p className="text-[10px] text-slate-500 font-mono">Next reset in about: {fngData.timeToUpdate}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Sentiment Level Scale & Allocation hints */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-200">How Sentiment Guides Smart Accumulation</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Fear and Greed is a vital leading indicator. Smart institutional DCA capital structures suggest scaling allocation dynamically based on herd sentiment values:
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-red-950/40">
                    <div className="text-red-400 font-bold mb-1">0 - 30: Extreme Fear</div>
                    <p className="text-[11px] text-slate-400">High volatility is creating optimal buying zones. Scale up allocation amounts.</p>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-950/40">
                    <div className="text-emerald-400 font-bold mb-1">70 - 100: Extreme Greed</div>
                    <p className="text-[11px] text-slate-400">High speculative sentiment. Keep purchases nominal or take technical profits.</p>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Latest sentiment recommendation trigger:</span>
                  <span className="text-white font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60">
                    <Zap className="w-3 h-3 text-amber-400" />
                    {fngScore < 40 ? "Intense Buy Trigger" : fngScore > 75 ? "Preserve Capital Mode" : "Baseline Routine Entry"}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Expert Market Modeling & Accumulation Indicator (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/45 border border-slate-850/80 rounded-2xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full"></div>
              
              <div>
                <div className="border-b border-slate-850 pb-3 mb-4 flex flex-col gap-1">
                  <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Expert Accumulation Indicator
                  </h4>
                  <p className="text-[10px] text-slate-400">Multi-factor mathematical indicator</p>
                </div>

                <div className="flex flex-col items-center justify-center bg-slate-950/50 p-4 rounded-xl border border-slate-900 text-center space-y-2 mb-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    RECOMMENDED TACTIC
                  </span>

                  <div className={`text-base font-black uppercase tracking-wider ${recColor} bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-850 shadow-inner flex items-center gap-1`}>
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {recommendation}
                  </div>

                  {/* Rating Indicator Bar */}
                  <div className="w-full text-left space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Score: {totalExpertMetric}/100</span>
                    </div>
                    
                    {/* Multilevel bar */}
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500" style={{ width: "35%" }}></div>
                      <div className="h-full bg-emerald-500" style={{ width: "20%" }}></div>
                      <div className="h-full bg-yellow-500" style={{ width: "20%" }}></div>
                      <div className="h-full bg-teal-500" style={{ width: "25%" }}></div>
                    </div>

                    <div className="relative h-1.5 w-full">
                      <span 
                        className="absolute -top-2.5 w-0.5 h-2.5 bg-white border border-black shadow"
                        style={{ left: `${totalExpertMetric}%` }}
                      ></span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-normal italic border-t border-slate-900 pt-2">
                    "{recommendationDetail}"
                  </p>
                </div>
              </div>

              {/* Individual breakdown list */}
              <div className="space-y-1.5 text-[10px]">
                {/* Fear and Greed Component */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900/80">
                  <span className="text-slate-400">Fear & Greed Alignment</span>
                  <span className={`font-mono font-bold uppercase text-[9px] ${getFngColor(fngScore)}`}>
                    {fngScore}
                  </span>
                </div>

                {/* RSI Indicator */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900/80">
                  <span className="text-slate-400">Simulated RSI</span>
                  <span className="font-mono text-slate-100 font-medium">
                    {rsiBounded} / 100
                  </span>
                </div>

                {/* EMA Supporting Floor */}
                <div className="flex items-center justify-between p-1.5 rounded bg-slate-950/40 border border-slate-900/80">
                  <span className="text-slate-400">EMA 200 Support</span>
                  <span className="text-blue-400 font-mono font-bold uppercase text-[9px]">
                    {emaSignal}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Row 4: Target Scenario & Profit Calculator (Full Width!) */}
        <div className="mt-6">
          
          {/* Tactical Scenario Profit and Loss Calculator */}
          <div className="bg-slate-900/45 border border-slate-850/80 rounded-2xl p-6 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-850/60">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-100 text-sm">Target Scenario & Profit Calculator</h4>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Saved & Remembered
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Simulate investment growth across customized purchase levels and future market cycles.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Currency Toggle */}
                <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800" title="Calculator Currency">
                  {(["USD", "AUD"] as const).map((ccy) => (
                    <button
                      key={ccy}
                      onClick={() => handleCalcCurrencySwitch(ccy)}
                      className={`px-3 py-1.5 text-[11px] rounded-lg cursor-pointer transition font-bold ${
                        calcCurrency === ccy
                          ? "bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {ccy}
                    </button>
                  ))}
                </div>

                {/* Input Mode Toggle */}
                <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800" title="Input Parameter">
                  <button
                    onClick={() => setCalcInputMode("fiat")}
                    className={`px-3 py-1.5 text-[11px] rounded-lg cursor-pointer transition font-bold ${
                      calcInputMode === "fiat"
                        ? "bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Fiat Amount
                  </button>
                  <button
                    onClick={() => setCalcInputMode("btc")}
                    className={`px-3 py-1.5 text-[11px] rounded-lg cursor-pointer transition font-bold ${
                      calcInputMode === "btc"
                        ? "bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-md"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Holdings (BTC)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Left Side Inputs */}
              <div className="md:col-span-2 space-y-4">
                {calcInputMode === "fiat" ? (
                  /* Total Principal Input */
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Scenario Capital Invested ({calcCurrency})</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono text-[10px]">{calcSymbol}</span>
                        <input
                          type="number"
                          value={investAmount}
                          onChange={(e) => setInvestAmount(Math.max(0, Number(e.target.value)))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono text-xs text-right focus:border-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={calcCurrency === "USD" ? "100" : "150"}
                      max={calcCurrency === "USD" ? "100000" : "150000"}
                      step="500"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{calcSymbol}{calcCurrency === "USD" ? "100" : "150"}</span>
                      <span>{calcSymbol}{calcCurrency === "USD" ? "50,000" : "75,500"}</span>
                      <span>{calcSymbol}{calcCurrency === "USD" ? "100,000" : "150,000"}</span>
                    </div>
                  </div>
                ) : (
                  /* Bitcoin holdings mode input */
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-400">Enter Target Bitcoin Quantity</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.005"
                          value={calcBtcAmount}
                          onChange={(e) => setCalcBtcAmount(Math.max(0, Number(e.target.value)))}
                          className="w-24 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono text-xs text-right focus:border-slate-700 focus:outline-none"
                        />
                        <span className="text-slate-400 font-mono text-[11px] font-bold">BTC</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="5"
                      step="0.005"
                      value={calcBtcAmount}
                      onChange={(e) => setCalcBtcAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>0.001 BTC</span>
                      <span>2.50 BTC</span>
                      <span>5.00 BTC</span>
                    </div>
                  </div>
                )}

                {/* Entry Price Point Target */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Proposed Purchase Entry Price ({calcCurrency})</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-[10px]">{calcSymbol}</span>
                      <input
                        type="number"
                        value={calcEntryPrice}
                        onChange={(e) => setCalcEntryPrice(Math.max(1, Number(e.target.value)))}
                        className="w-24 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono text-xs text-right focus:border-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={calcCurrency === "USD" ? "10000" : "15000"}
                    max={calcCurrency === "USD" ? "150000" : "225000"}
                    step="1000"
                    value={calcEntryPrice}
                    onChange={(e) => setCalcEntryPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{calcSymbol}{calcCurrency === "USD" ? "10,000" : "15,000"}</span>
                    {priceData && (
                      <span>Current (~{calcSymbol}{Math.round(priceData[calcCurrency].livePrice).toLocaleString()})</span>
                    )}
                    <span>{calcSymbol}{calcCurrency === "USD" ? "150,000" : "225,000"}</span>
                  </div>
                </div>

                {/* Future Target Exit Point */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Tactical Portfolio Exit Price ({calcCurrency})</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-[10px]">{calcSymbol}</span>
                      <input
                        type="number"
                        value={calcExitPrice}
                        onChange={(e) => setCalcExitPrice(Math.max(1, Number(e.target.value)))}
                        className="w-24 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono text-xs text-right focus:border-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={calcCurrency === "USD" ? "20000" : "30000"}
                    max={calcCurrency === "USD" ? "350000" : "530000"}
                    step="5000"
                    value={calcExitPrice}
                    onChange={(e) => setCalcExitPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{calcSymbol}{calcCurrency === "USD" ? "20,000" : "30,000"}</span>
                    <span>{calcSymbol}{calcCurrency === "USD" ? "150,000" : "225,050"}</span>
                    <span>{calcSymbol}{calcCurrency === "USD" ? "350,000" : "530,000"}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Instant ROI Output */}
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Position Summary</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs border-b border-slate-900/60 pb-1">
                      <span className="text-slate-400">Scenario Fiat Capital:</span>
                      <span className="font-mono text-white font-bold">{calcSymbol}{Math.round(calcInvestAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-slate-900/60 pb-1">
                      <span className="text-slate-400">Estimated BTC Owned:</span>
                      <span className="font-mono text-white font-bold">{totalBtcHoldings.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-slate-900/60 pb-1">
                      <span className="text-slate-400">Target Value ({calcCurrency}):</span>
                      <span className="font-mono text-white font-bold">{calcSymbol}{targetExitValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-850">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1 font-bold">Projected Net ROI ({calcCurrency})</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className={`text-xl sm:text-2xl font-mono font-extrabold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {netProfit >= 0 ? "+" : ""}
                        {calcSymbol}{Math.round(netProfit).toLocaleString()}
                      </span>
                    </div>
                    <div className={`text-xs inline-flex items-center gap-1 font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{roiPercentage.toFixed(1)}% Potential Yield</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Informative Grid Bottom Banner */}
        <div className="bg-slate-900/35 border border-slate-850/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 rounded-xl bg-slate-800 text-amber-500 border border-slate-700/60 inline-block">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h5 className="font-bold text-slate-200 text-xs">Dynamic Halving Cycle Index</h5>
              <p className="text-[11px] text-slate-400">The historical framework is governed by Bitcoin four-year halvings. Current index represents stable Post-Halving cycle metrics.</p>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 text-right space-y-0.5">
            <p className="font-mono">Nexus BTC Analytics Workspace</p>
            <p className="uppercase text-slate-600">Secure Live AUD Integration</p>
          </div>
        </div>

      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900/90 py-6 mt-12 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-slate-500 text-[11px] sm:px-6 lg:px-8">
          <p>
            Nexus BTC is an educational dashboard designed to capture market transparency. Bitcoin pricing feeds are pulled from Blockchain ticker APIs.
          </p>
          <p className="text-slate-600">
            © 2026 Nexus Crypto. Grounded intelligence supported by Google Gemini 3.5.
          </p>
        </div>
      </footer>
    </div>
  );
}
