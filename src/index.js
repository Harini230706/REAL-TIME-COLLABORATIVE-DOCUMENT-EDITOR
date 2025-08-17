import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { findOrCreateDocument } from "./utils/findOrCreateDocument.js";
import Document from "./models/Document.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// Basic health route
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN, methods: ["GET", "POST"] }
});

// Mongo connect
mongoose
  .connect(process.env.MONGO_URI, { dbName: undefined })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

const DEFAULT_SAVE_INTERVAL_MS = 2000; // throttle saves

io.on("connection", (socket) => {
  // Client requests to join a specific document
  socket.on("get-document", async (documentId, ack) => {
    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);
      // Send current state to the newly joined client
      socket.emit("load-document", document.data || { ops: [] });
      if (typeof ack === "function") ack({ ok: true });

      // Relay user changes to all others in the same room
      socket.on("send-changes", (delta) => {
        // Broadcast to everyone else editing this doc
        socket.to(documentId).emit("receive-changes", delta);
      });

      // Persist the latest contents (throttled on the client)
      socket.on("save-document", async (data) => {
        await Document.findByIdAndUpdate(documentId, { data }, { upsert: true });
      });

      // Optional: document title updates
      socket.on("set-title", async (title) => {
        await Document.findByIdAndUpdate(documentId, { title });
        socket.to(documentId).emit("title-updated", title);
      });
    } catch (e) {
      console.error(e);
      if (typeof ack === "function") ack({ ok: false, error: e.message });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));