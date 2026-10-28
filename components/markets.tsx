"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Area, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, Bar, ComposedChart, ReferenceLine,
} from "recharts"
import {
  TrendingUp, TrendingDown, RefreshCw, Clock, DollarSign,
  Activity, BarChart2,
} from "lucide-react"
import { RefreshButton } from "@/components/ui/refresh-button"
import { PageHeader } from "@/components/ui/page-header"
import { TOKENS as TOKEN_IDS, SEMANTIC } from "@/lib/design-tokens"

type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number }
type MarketToken = {
  symbol: keyof typeof TOKEN_IDS
  name: string
  description: string
  basePrice: number
  color: string
  colorDim: string
  volatility: number
  trend: number
}

const MARKET_TOKENS: MarketToken[] = [
  {
    symbol: "dETH",
    name: TOKEN_IDS.dETH.name,
    description: "Minted 1:1 when depositing ETH. Freely transferable and usable across DeFi.",
    basePrice: 2480,
    color: TOKEN_IDS.dETH.color,
    colorDim: TOKEN_IDS.dETH.colorDim,
    volatility: 0.018,
    trend: 0.0003,
  },
  {
    symbol: "sETH",
    name: TOKEN_IDS.sETH.name,
    description: "Minted when staking dETH. Accrues staking rewards and governance power.",
    basePrice: 2520,
    color: TOKEN_IDS.sETH.color,
    colorDim: TOKEN_IDS.sETH.colorDim,
    volatility: 0.022,
    trend: 0.0005,
  },
  {
    symbol: "ETH",
    name: TOKEN_IDS.ETH.name,
    description: "Native Ethereum deposited as collateral to mint dETH at a 1:1 ratio.",
    basePrice: 2495,
    color: TOKEN_IDS.ETH.color,
    colorDim: TOKEN_IDS.ETH.colorDim,
    volatility: 0.015,
    trend: 0.0002,
  },
]

function generateHistory(base: number, vol: number, trend: number, points: number): Candle[] {
  const candles: Candle[] = []
  let price = base * (0.85 + Math.random() * 0.08)
  const now = Date.now()
  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * 3600_000
    const chg = (Math.random() - 0.49) * vol + trend
    const open = price
    price = Math.max(price * (1 + chg), base * 0.5)
    const range = price * vol * 0.5
    candles.push({
      time: t,
      open,
      high: Math.max(open, price) + Math.random() * range,
      low: Math.min(open, price) - Math.random() * range,
      close: price,
      volume: base * (50 + Math.random() * 200),
    })
  }
  return candles
}

function generateNewCandle(last: Candle, vol: number, trend: number): Candle {
  const chg = (Math.random() - 0.49) * vol + trend
  const open = last.close
  const close = Math.max(open * (1 + chg), last.close * 0.5)
  const range = close * vol * 0.3
  return {
    time: last.time + 3600_000,
    open,
    close,
    high: Math.max(open, close) + Math.random() * range,
    low: Math.min(open, close) - Math.random() * range,
    volume: last.volume * (0.7 + Math.random() * 0.6),
  }
}

function formatTimeLabel(ts: number, range: number) {
  const d = new Date(ts)
  if (range <= 24) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function Sparkline({ candles, isUp }: { candles: Candle[]; isUp: boolean }) {
  const color = isUp ? SEMANTIC.gain : SEMANTIC.loss
  if (candles.length < 2) return null
  const prices = candles.map((c) => c.close)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const w = 120
  const h = 40
  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w
      const y = h - ((p - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const price = payload.find((p: any) => p.dataKey === "close")
  const vol = payload.find((p: any) => p.dataKey === "volume")
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs mono shadow-lg"
      style={{ background: "#0d1320", border: "1px solid var(--border)", color: "var(--text)" }}
    >
      <div style={{ color: "var(--text-3)" }} className="mb-1">
        {typeof label === "number" ? new Date(label).toLocaleString() : label}
      </div>
      {price && (
        <div>
          Price: <span style={{ color: "var(--text)" }}>${Number(price.value).toFixed(2)}</span>
        </div>
      )}
      {vol && (
        <div style={{ color: "var(--text-2)" }}>
          Vol: ${(Number(vol.value) / 1000).toFixed(1)}K
        </div>
      )}
    </div>
  )
}

export function Markets() {
  const [histories, setHistories] = useState<Record<string, Candle[]>>({})
  const [selected, setSelected] = useState<keyof typeof TOKEN_IDS>("dETH")
  const [chartRange, setChartRange] = useState(48)
  const [tick, setTick] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const seedHistories = () => {
    const init: Record<string, Candle[]> = {}
    MARKET_TOKENS.forEach((t) => {
      init[t.symbol] = generateHistory(t.basePrice, t.volatility, t.trend, 168)
    })
    setHistories(init)
  }

  useEffect(() => {
    seedHistories()
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setHistories((prev) => {
        const next = { ...prev }
        MARKET_TOKENS.forEach((t) => {
          const h = prev[t.symbol]
          if (!h?.length) return
          const last = h[h.length - 1]
          const now = Date.now()
          if (now - last.time > 60_000) {
            next[t.symbol] = [...h.slice(-500), generateNewCandle(last, t.volatility, t.trend)]
          } else {
            const upd = { ...last, close: last.close * (1 + (Math.random() - 0.5) * 0.002) }
            upd.high = Math.max(upd.high, upd.close)
            upd.low = Math.min(upd.low, upd.close)
            next[t.symbol] = [...h.slice(0, -1), upd]
          }
        })
        return next
      })
      setTick((t) => t + 1)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const ranges = [
    { label: "6H", val: 6 },
    { label: "24H", val: 24 },
    { label: "48H", val: 48 },
    { label: "7D", val: 168 },
  ]

  const getToken = (sym: string) => MARKET_TOKENS.find((t) => t.symbol === sym)!
  const getPrice = (sym: string) => {
    const h = histories[sym]
    if (!h?.length) return 0
    return h[h.length - 1].close
  }
  const getChange = (sym: string, hours = 24) => {
    const h = histories[sym]
    if (!h || h.length < 2) return 0
    const slice = h.slice(-Math.min(hours, h.length))
    return ((slice[slice.length - 1].close - slice[0].close) / slice[0].close) * 100
  }
  const getVol24h = (sym: string) => {
    const h = histories[sym]
    if (!h?.length) return 0
    return h.slice(-24).reduce((a, c) => a + c.volume, 0)
  }

  const selToken = getToken(selected)
  const chartData = useMemo(() => {
    const h = histories[selected] || []
    return h.slice(-chartRange).map((c) => ({
      time: c.time,
      close: Number(c.close.toFixed(2)),
      volume: c.volume,
      open: c.open,
    }))
  }, [histories, selected, chartRange])

  const rangeChange = getChange(selected, chartRange)
  const isUp = rangeChange >= 0
  // Chart line uses gain/loss — not token color — so PnL stays distinct from asset identity
  const lineColor = isUp ? SEMANTIC.gain : SEMANTIC.loss
  const fillId = `fill-${selected}`

  const handleRefresh = () => {
    setIsRefreshing(true)
    seedHistories()
    setTick(0)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Simulated Sepolia price paths for ETH, dETH, and sETH."
        action={<RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 sm:mb-6 text-xs" style={{ color: "var(--text-3)" }}>
        {MARKET_TOKENS.map((t) => (
          <span key={t.symbol} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.color }} />
            <span className="mono" style={{ color: t.color }}>{t.symbol}</span>
          </span>
        ))}
        <span className="opacity-40 hidden sm:inline">·</span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" style={{ color: SEMANTIC.gain }} />
          <span style={{ color: SEMANTIC.gain }}>Gain</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="h-3 w-3" style={{ color: SEMANTIC.loss }} />
          <span style={{ color: SEMANTIC.loss }}>Loss</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {MARKET_TOKENS.map((token) => {
          const price = getPrice(token.symbol)
          const chg24 = getChange(token.symbol, 24)
          const up = chg24 >= 0
          const active = selected === token.symbol
          return (
            <button
              key={token.symbol}
              type="button"
              onClick={() => setSelected(token.symbol)}
              className="stat-card text-left"
              style={{
                borderColor: active ? `${token.color}55` : undefined,
                boxShadow: active ? `0 0 25px ${token.color}18` : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-base sm:text-lg mono" style={{ color: token.color }}>{token.symbol}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>{token.name}</div>
                </div>
                <div className="hidden sm:block shrink-0 opacity-90">
                  <Sparkline candles={(histories[token.symbol] || []).slice(-24)} isUp={up} />
                </div>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-semibold mono" style={{ color: "var(--text)" }}>
                    ${price > 0 ? price.toFixed(2) : "—"}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold mt-1 mono" style={{ color: up ? SEMANTIC.gain : SEMANTIC.loss }}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {up ? "+" : ""}{chg24.toFixed(2)}%
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ color: "var(--text-3)" }}>24h Vol</div>
                  <div className="text-sm font-semibold mono" style={{ color: "var(--text-2)" }}>
                    ${(getVol24h(token.symbol) / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="glass-card p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
              <span className="text-xl sm:text-2xl font-semibold mono" style={{ color: selToken.color }}>{selected}</span>
              <span className="text-sm" style={{ color: "var(--text-2)" }}>{selToken.name}</span>
              <span
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mono"
                style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(0,255,136,0.2)" }}
              >
                <Activity className="h-3 w-3" />LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-semibold mono" style={{ color: "var(--text)" }}>
                ${getPrice(selected).toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold mono" style={{ color: lineColor }}>
                {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {isUp ? "+" : ""}{rangeChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {ranges.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setChartRange(r.val)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold mono transition-colors"
                style={{
                  background: chartRange === r.val ? "var(--green)" : "var(--surface)",
                  color: chartRange === r.val ? "#080c12" : "var(--text-2)",
                  border: `1px solid ${chartRange === r.val ? "var(--green)" : "var(--border)"}`,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-frame">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => formatTimeLabel(v, chartRange)}
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  minTickGap={40}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  yAxisId="price"
                  domain={["auto", "auto"]}
                  orientation="right"
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                  width={48}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis yAxisId="vol" hide domain={[0, "dataMax"]} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "4 4" }} />
                <Bar
                  yAxisId="vol"
                  dataKey="volume"
                  fill="rgba(255,255,255,0.06)"
                  barSize={4}
                  isAnimationActive={false}
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#${fillId})`}
                  isAnimationActive={false}
                  activeDot={{ r: 4, fill: lineColor, stroke: "#080c12", strokeWidth: 2 }}
                />
                <ReferenceLine
                  yAxisId="price"
                  y={chartData[0]?.close}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--text-3)" }}>
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />Loading chart data...
            </div>
          )}
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>{selToken.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: "Current Price", val: `$${getPrice(selected).toFixed(2)}`, icon: DollarSign, color: selToken.color },
          {
            label: "24h Change",
            val: `${getChange(selected, 24) >= 0 ? "+" : ""}${getChange(selected, 24).toFixed(2)}%`,
            icon: TrendingUp,
            color: getChange(selected, 24) >= 0 ? SEMANTIC.gain : SEMANTIC.loss,
          },
          {
            label: "7d Change",
            val: `${getChange(selected, 168) >= 0 ? "+" : ""}${getChange(selected, 168).toFixed(2)}%`,
            icon: Activity,
            color: getChange(selected, 168) >= 0 ? SEMANTIC.gain : SEMANTIC.loss,
          },
          { label: "24h Volume", val: `$${(getVol24h(selected) / 1000).toFixed(0)}K`, icon: BarChart2, color: "var(--text-2)" },
        ].map((item) => (
          <div key={item.label} className="stat-card min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <item.icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
              <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate" style={{ color: "var(--text-3)" }}>{item.label}</span>
            </div>
            <div className="mono text-base sm:text-xl font-semibold truncate" style={{ color: item.color }}>{item.val}</div>
          </div>
        ))}
      </div>

      <div className="section-title">All Markets</div>
      <div className="glass-card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Token", "Price", "1H", "24H", "7D", "Volume 24H"].map((h) => (
                  <th key={h} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MARKET_TOKENS.map((token, i) => {
                const chg1h = getChange(token.symbol, 1)
                const chg24 = getChange(token.symbol, 24)
                const chg7d = getChange(token.symbol, 168)
                const active = selected === token.symbol
                return (
                  <tr
                    key={token.symbol}
                    onClick={() => setSelected(token.symbol)}
                    className="cursor-pointer"
                    style={{
                      borderBottom: i < MARKET_TOKENS.length - 1 ? "1px solid var(--border)" : undefined,
                      background: active ? token.colorDim : undefined,
                    }}
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: token.colorDim, border: `1px solid ${token.color}30` }}
                        >
                          <span className="text-xs font-bold mono" style={{ color: token.color }}>{token.symbol[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold mono text-sm" style={{ color: "var(--text)" }}>{token.symbol}</div>
                          <div className="text-xs truncate" style={{ color: "var(--text-3)" }}>{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 mono font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
                      ${getPrice(token.symbol).toFixed(2)}
                    </td>
                    {[chg1h, chg24, chg7d].map((chg, j) => (
                      <td key={j} className="px-3 sm:px-4 py-3 sm:py-4 mono text-sm font-semibold whitespace-nowrap" style={{ color: chg >= 0 ? SEMANTIC.gain : SEMANTIC.loss }}>
                        {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                      </td>
                    ))}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 mono text-sm whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                      ${(getVol24h(token.symbol) / 1000).toFixed(0)}K
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-xs mono" style={{ color: "var(--text-3)" }}>
        <Clock className="h-3.5 w-3.5" />
        <span>Prices update every 3 seconds · Tick #{tick}</span>
      </div>
    </div>
  )
}
