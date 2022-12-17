import { WebSocketServer } from "ws";
import {tokenToUser} from "./routes/auth.js";
import mongoose from "mongoose";
const User = mongoose.models.User;

const clients = [];

export function createWSS(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
  });

  wss.on("connection", async (ws, req) => {
    try {
      const userId = tokenToUser(req.headers.authorization.split(" ")[1]);
      clients.push({ userId: userId, ws: ws });
      ws.on("message", (message) => {
        ws.send("Received your message: " + message);
      });

      ws.on("close", () => {
        clients.splice(clients.indexOf(ws), 1);
      });
    } catch (error) {
      ws.send("Error: " + error);
    }
    });
  };

export function sendMessageToUser(message, userId, code) {
    // Find the client with the given ID.
    const client = clients.find((client) => client.userId == userId);
    if (client) {
        // Send the message to the client.
        client.ws.send(JSON.stringify({
            message: message,
            code: code
        }));
    }
}