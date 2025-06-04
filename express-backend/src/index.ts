import express from "express";
import { createClient } from "redis";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const client = createClient({ url: "redis://localhost:6379" });
const subClient = createClient({ url: "redis://localhost:6379" }); // Subscriber client

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});
subClient.on("error", (err) => {
  console.error("Redis Sub Client Error", err);
});

const app = express();
app.use(express.json());

app.post("/submit", async (req, res) => {
  try {
    const { problemId, userId, code, language } = req.body;
    await client.lPush("submissions", JSON.stringify({ problemId, userId, code, language }));
    res.status(201).json({ message: "Submission received" });
  } catch (error) {
    console.error("Error in /submit:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
});

async function startServer() {
  try {
    await client.connect();
    await subClient.connect();
    console.log("Connected to Redis");

    // Subscribe to the processed submissions channel from the worker
    await subClient.subscribe("submission_processed", (message) => {
      // Broadcast to all connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(message);
        }
      });
      console.log("Broadcasted to WebSocket clients:", message);
    });

    const port = 8080;
    server.listen(port, () => {
      console.log(`Server and WebSocket running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();