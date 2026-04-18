/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Server, 
  Activity, 
  Terminal, 
  Ticket, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

interface Status {
  activeServer: "A" | "B";
  serverAStatus: "ACTIVE" | "DOWN";
  serverBStatus: "STANDBY" | "ACTIVE";
  trafficLoad: number;
  logs: Log[];
}

interface Log {
  id: string;
  timestamp: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
}

interface Concert {
  id: string;
  artist: string;
  totalTickets: number;
  availableTickets: number;
  price: number;
}

interface Receipt {
  id: string;
  concertArtist: string;
  ticketCount: number;
  server: string;
  timestamp: string;
  failover: boolean;
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, concertsRes] = await Promise.all([
          fetch("/api/status"),
          fetch("/api/concerts")
        ]);
        const statusData = await statusRes.json();
        const concertsData = await concertsRes.json();
        setStatus(statusData);
        setConcerts(concertsData);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBook = async (concertId: string, count: number) => {
    setBookingLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concertId, ticketCount: count })
      });
      
      const data = await res.json();
      if (res.ok) {
        setReceipt(data);
      } else {
        alert(data.error || "Booking failed");
      }
    } catch (err) {
      alert("Network error: Server might be down");
    } finally {
      setBookingLoading(false);
    }
  };

  const simulateTraffic = async () => {
    await fetch("/api/simulate-traffic", { method: "POST" });
  };

  return (
    <div className="flex flex-col h-screen p-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] grid-rows-[auto_1fr_auto] gap-6 h-full">
        <header className="col-span-1 lg:col-span-2 flex justify-between items-end border-b-2 border-[var(--ink)] pb-3">
          <div className="title-group">
            <h1 className="text-2xl font-bold uppercase tracking-[2px] text-[var(--ink)]">Sentinel Security Core v2.4</h1>
            <p className="text-xs opacity-70">Self-Healing Distributed Inventory System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Global Traffic Load</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">{(status?.trafficLoad || 0).toFixed(1)} REQ/S</span>
                <button 
                  onClick={simulateTraffic}
                  className="bg-[var(--ink)] text-white px-3 py-1 text-[10px] uppercase font-bold tracking-wider hover:opacity-90"
                >
                  Trigger Surge
                </button>
              </div>
            </div>
            <div className="system-badge bg-[var(--ink)] text-[var(--bg)] px-3 py-1 font-mono text-xs font-bold">
              AI MONITORING: ENABLED
            </div>
          </div>
        </header>

        {/* Left Column: Concerts */}
        <div className="panel overflow-hidden">
          <div className="panel-header">
            <span className="panel-title">Active Inventories</span>
            <span className="text-[10px] font-mono">LOCATION: US-EAST-1</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {status?.serverAStatus === 'DOWN' && status?.serverBStatus === 'STANDBY' && (
              <div className="bg-red-50 border border-[var(--red)] text-[var(--red)] p-2 text-[11px] font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4" /> ⚠️ HIGH TRAFFIC DETECTED - SERVER A UNRESPONSIVE
              </div>
            )}
            
            {concerts.map(concert => (
              <div key={concert.id} className="grid grid-cols-[1fr_auto_auto] gap-5 p-4 border border-zinc-200 items-center bg-white hover:border-[var(--line)] transition-colors">
                <div className="concert-info">
                  <h3 className="text-base font-bold text-[var(--ink)] uppercase tracking-tight">{concert.artist}</h3>
                  <p className="text-xs text-zinc-500">Venue: Global Arena | ID: {concert.id}</p>
                </div>
                <div className="text-center px-4">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">Tickets</span><br />
                  <strong className="text-sm font-mono text-[var(--ink)]">{concert.availableTickets}/{concert.totalTickets}</strong>
                </div>
                <button 
                  onClick={() => handleBook(concert.id, 1)}
                  disabled={concert.availableTickets === 0 || bookingLoading}
                  className={`bg-[var(--ink)] text-white px-4 py-2 text-xs uppercase font-bold tracking-wider transition-all
                    ${concert.availableTickets === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800 active:scale-95'}
                  `}
                >
                  {bookingLoading ? "..." : concert.availableTickets === 0 ? "Sold Out" : "Book Now"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Infrastructure */}
        <div className="flex flex-col gap-6 overflow-hidden">
          <div className="panel flex-1">
            <div className="panel-header">
              <span className="panel-title">Infrastructure Health</span>
            </div>
            <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto">
              {/* Server A */}
              <div className={`server-card ${status?.serverAStatus === 'DOWN' ? 'border-red-500' : ''}`}>
                <div className={`status-dot ${status?.serverAStatus === 'ACTIVE' ? 'bg-[var(--green)] status-active-glow' : 'bg-[var(--red)] status-down-glow'}`} />
                <div className="font-mono font-bold text-sm">NODE_SERVER_ALPHA</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-1 leading-relaxed">
                  CPU: {status?.serverAStatus === 'ACTIVE' ? (15 + status.trafficLoad * 5).toFixed(1) : '99.9'}% | RAM: 15.2GB<br />
                  STATUS: {status?.serverAStatus === 'ACTIVE' ? '🟢 NOMINAL' : '🔴 CRITICAL_FAILURE'}
                  {status?.activeServer === 'A' && status?.serverAStatus === 'ACTIVE' && <div className="text-blue-600 font-bold mt-1 tracking-widest text-[9px]">[ROUTING_PRIMARY]</div>}
                </div>
              </div>

              {/* Server B */}
              <div className={`server-card ${status?.serverBStatus === 'ACTIVE' ? 'border-[var(--green)]' : ''}`}>
                <div className={`status-dot ${status?.serverBStatus === 'ACTIVE' ? 'bg-[var(--green)] status-active-glow' : 'bg-[var(--yellow)] status-standby-glow'}`} />
                <div className="font-mono font-bold text-sm">NODE_SERVER_BRAVO</div>
                <div className="text-[11px] text-zinc-500 font-mono mt-1 leading-relaxed">
                  CPU: {status?.serverBStatus === 'ACTIVE' ? (10 + status.trafficLoad * 3).toFixed(1) : '2.1'}% | RAM: 8.4GB<br />
                  STATUS: {status?.serverBStatus === 'ACTIVE' ? '🟢 ACTIVE_FAILOVER' : '🟡 STANDBY_OPTIMIZED'}
                  {status?.activeServer === 'B' && <div className="text-emerald-600 font-bold mt-1 tracking-widest text-[9px]">[RECOVERY_ROUTED]</div>}
                </div>
              </div>

              <div className="mt-auto border-t border-[var(--line)] pt-4">
                <div className="panel-title text-[9px]">Global Traffic Load Distribution</div>
                <div className="traffic-meter">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${Math.min(100, (status?.trafficLoad || 0) * 8)}%` }}
                    className={`absolute left-0 top-0 h-full transition-colors duration-500
                      ${status && status.trafficLoad > 10 ? 'bg-[var(--red)]' : 'bg-[var(--ink)]'}
                    `}
                  />
                  <div className="absolute w-full text-center leading-10 text-[10px] font-bold tracking-widest mix-foreground drop-shadow font-mono text-zinc-400">
                    {(status?.trafficLoad || 0).toFixed(0)} REQUESTS / SECOND
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Area Header (Shared Column) */}
        <div className="col-span-1 lg:col-span-2">
          <div className="logs-area h-44 overflow-y-auto scrollbar-hide">
            {status?.logs.map(log => (
              <div key={log.id} className="log-line flex border-l-2 border-[#333] pl-2 mb-1">
                <span className="log-timestamp text-zinc-500 mr-2 shrink-0">[{log.timestamp}]</span>
                <span className={`
                  ${log.type === 'ERROR' ? 'text-[var(--red)]' : ''}
                  ${log.type === 'WARNING' ? 'text-[var(--yellow)]' : ''}
                  ${log.type === 'SUCCESS' ? 'text-[#00FF00] font-bold' : ''}
                `}>
                  [{log.type}] {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {receipt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono"
            onClick={() => setReceipt(null)}
          >
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-[var(--white)] border-2 border-[var(--ink)] p-8 max-w-sm w-full text-[var(--ink)] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6 border-b-2 border-[var(--ink)] pb-4">
                <h3 className="text-xl font-bold uppercase tracking-widest">Transaction Report</h3>
                <p className="text-[10px] font-bold opacity-60 mt-1">SENTINEL_NODE_CONFIRMATION</p>
              </div>

              <div className="space-y-3 text-[12px] mb-8">
                <div className="flex justify-between font-bold">
                  <span>REF_NO:</span>
                  <span>{receipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>ASSET:</span>
                  <span className="uppercase">{receipt.concertArtist}</span>
                </div>
                <div className="flex justify-between">
                  <span>NODE:</span>
                  <span className={receipt.failover ? 'text-[var(--red)] font-bold' : ''}>
                    {receipt.server === 'A' ? 'ALPHA_PRIME' : 'BRAVO_BACKUP'}
                  </span>
                </div>
                <div className="border-t border-dotted border-zinc-400 pt-2 flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>CONFIRMED</span>
                </div>
              </div>

              {receipt.failover && (
                <div className="bg-red-50 p-2 border border-[var(--red)] text-[var(--red)] text-[9px] font-bold mb-6 leading-tight uppercase">
                  SECURITY FAILOVER DETECTED: Primary node failure occurred during transaction. Recovery node validated asset distribution.
                </div>
              )}

              <button 
                onClick={() => setReceipt(null)}
                className="w-full bg-[var(--ink)] text-white py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90"
              >
                Accept and Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
