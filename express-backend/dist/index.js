"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const http_1 = require("http");
const ws_1 = require("ws");
const client = (0, redis_1.createClient)({ url: "redis://localhost:6379" });
const subClient = (0, redis_1.createClient)({ url: "redis://localhost:6379" }); // Subscriber client
client.on("error", (err) => {
    console.error("Redis Client Error", err);
});
subClient.on("error", (err) => {
    console.error("Redis Sub Client Error", err);
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post("/submit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { problemId, userId, code, language } = req.body;
        yield client.lPush("submissions", JSON.stringify({ problemId, userId, code, language }));
        res.status(201).json({ message: "Submission received" });
    }
    catch (error) {
        console.error("Error in /submit:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
});
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            yield subClient.connect();
            console.log("Connected to Redis");
            // Subscribe to the processed submissions channel from the worker
            yield subClient.subscribe("submission_processed", (message) => {
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
        }
        catch (error) {
            console.error("Error starting server:", error);
            process.exit(1);
        }
    });
}
startServer();
