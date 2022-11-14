import { WebSocketServer } from "ws";
import { getUserFromId } from "./routes/users.js";
import mongoose from "mongoose";
const User = mongoose.models.User;

const clients = [];

export function createWSS(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
  });

  wss.on("connection", (ws, req) => {
  getUserFromId(req.currentUserId).then((err, user) => {
      if (err || !user) {
        if (!user) {
          err = new Error("User not found");
          err.status = 404;
        }
        ws.send(JSON.stringify(err));
        ws.close();
        return;
      }
      clients.push({ user: user, ws: ws });

      ws.on("message", (message) => {
        ws.send("Received your message: " + message);
      });

      ws.on("close", () => {
        clients.splice(clients.indexOf(ws), 1);
      });
    });
  });
}

export function sendMessageToUser(message, userId, code) {
    // Find the client with the given ID.
    const client = clients.find((client) => client.id.equals(userId));

    if (client) {
        // Send the message to the client.
        client.socket.send(JSON.stringify({
            message: message,
            code: code
        }));
    }
}