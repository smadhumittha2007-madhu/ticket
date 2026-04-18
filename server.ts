import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- In-Memory State ---
  let activeServer: "A" | "B" = "A";
  let serverAStatus: "ACTIVE" | "DOWN" = "ACTIVE";
  let serverBStatus: "STANDBY" | "ACTIVE" = "STANDBY";
  let trafficLoad = 0; // Requests per second (simulated)
  let requestCount = 0;
  let logs: Array<{ id: string; timestamp: string; message: string; type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" }> = [];

  const concerts = [
    { id: "1", artist: "Luna Waves", totalTickets: 500, availableTickets: 342, price: 85 },
    { id: "2", artist: "Neon Pulse", totalTickets: 1200, availableTickets: 890, price: 120 },
    { id: "3", artist: "The Echoes", totalTickets: 300, availableTickets: 12, price: 65 },
    { id: "4", artist: "Solar Drift", totalTickets: 800, availableTickets: 540, price: 95 },
  ];

  const bookings: any[] = [];

  // --- Helpers ---
  const addLog = (message: string, type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" = "INFO") => {
    const log = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    logs.unshift(log); // Newest first
    if (logs.length > 50) logs.pop();
    console.log(`[${type}] ${message}`);
  };

  addLog("System initialized. Monitoring service running.", "INFO");

  // --- AI Self-Healing Monitor (Simulated) ---
  setInterval(() => {
    // Decay traffic load simulated slowly
    if (trafficLoad > 0) trafficLoad = Math.max(0, trafficLoad - 0.5);

    // AI Check
    if (serverAStatus === "DOWN" && activeServer === "A") {
      addLog("AI MONITOR: Anomaly detected! Server A is unresponsive.", "ERROR");
      addLog("AI MONITOR: Initiating failover protocol to Server B...", "WARNING");
      
      setTimeout(() => {
        activeServer = "B";
        serverBStatus = "ACTIVE";
        addLog("AI MONITOR: Failover successful. Traffic redirected to Server B.", "SUCCESS");
      }, 1500);
    }
  }, 2000);

  // --- API Routes ---

  // Get current system status
  app.get("/api/status", (req, res) => {
    res.json({
      activeServer,
      serverAStatus,
      serverBStatus,
      trafficLoad,
      logs
    });
  });

  // Get concerts
  app.get("/api/concerts", (req, res) => {
    res.json(concerts);
  });

  // Book a ticket
  app.post("/api/book", (req, res) => {
    const { concertId, ticketCount } = req.body;
    requestCount++;
    
    // Simulate traffic surge
    if (trafficLoad > 10) {
      serverAStatus = "DOWN";
      addLog("CRITICAL: Server A reached capacity limits and crashed!", "ERROR");
    }

    if (activeServer === "A" && serverAStatus === "DOWN") {
      addLog("FAILED: Request attempted on Down Server A", "ERROR");
      return res.status(503).json({ error: "Service Unavailable", server: "A" });
    }

    const currentServer = activeServer;
    const concert = concerts.find(c => c.id === concertId);
    
    if (!concert || concert.availableTickets < ticketCount) {
      return res.status(400).json({ error: "Tickets not available" });
    }

    concert.availableTickets -= ticketCount;
    const booking = {
      id: `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      concertArtist: concert.artist,
      ticketCount,
      server: currentServer,
      timestamp: new Date().toISOString(),
      failover: currentServer === "B"
    };
    
    bookings.push(booking);
    addLog(`Booking ${booking.id} processed by Server ${currentServer}`, "SUCCESS");
    
    res.json(booking);
  });

  // Simulate Traffic
  app.post("/api/simulate-traffic", (req, res) => {
    trafficLoad += 12; // Spike it!
    addLog(`High traffic surge detected: ${trafficLoad.toFixed(1)} req/s`, "WARNING");
    res.json({ currentLoad: trafficLoad });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
