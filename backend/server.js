import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOriginValidator = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS.`));
};

const io = new Server(httpServer, {
  cors: {
    origin: corsOriginValidator,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: corsOriginValidator,
  }),
);
app.use(express.json());

/**
 * In-memory room store for hackathon use.
 *
 * Each room tracks:
 * - ownerSocketId: socket id that is allowed to change budget and checkout
 * - members: all connected participants and their metadata
 * - cart: authoritative item list keyed by item id
 * - budgetCap / total: shared budget state computed only on the server
 * - activityFeed: recent human-readable actions pushed to all clients
 * - pendingOperations / isProcessingQueue: queue for additive/subtractive cart deltas
 */
const rooms = new Map();
const socketToRoom = new Map();

const MOCK_PRODUCTS = [
  { id: "apples", name: "Apples", price: 180, unit: "1kg" },
  { id: "milk", name: "Milk", price: 70, unit: "2 packs" },
  { id: "bread", name: "Bread", price: 55, unit: "1 pack" },
  { id: "eggs", name: "Eggs", price: 95, unit: "12 pcs" },
  { id: "rice", name: "Rice", price: 650, unit: "5kg" },
  { id: "coffee", name: "Coffee", price: 320, unit: "250g" },
  { id: "tomatoes", name: "Tomatoes", price: 90, unit: "1kg" },
  { id: "bananas", name: "Bananas", price: 65, unit: "1dozen" },
  { id: "biscuits", name: "Biscuits", price: 45, unit: "1 pack" },
  { id: "yogurt", name: "Yogurt", price: 85, unit: "900gms" },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const createSessionCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

const getRoomSnapshot = (roomCode) => {
  const room = rooms.get(roomCode);

  return {
    roomCode,
    ownerSocketId: room.ownerSocketId,
    budgetCap: room.budgetCap,
    total: room.total,
    checkedOut: room.checkedOut,
    checkoutSummary: room.checkoutSummary,
    cart: Array.from(room.cart.values()),
    members: Array.from(room.members.values()),
    activityFeed: room.activityFeed,
    catalog: MOCK_PRODUCTS,
  };
};

const emitRoomState = (roomCode) => {
  io.to(roomCode).emit("room_state", getRoomSnapshot(roomCode));
};

const pushActivity = (roomCode, message, type = "info") => {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    type,
    timestamp: new Date().toISOString(),
  };

  room.activityFeed = [entry, ...room.activityFeed].slice(0, 50);
  io.to(roomCode).emit("activity_feed_updated", room.activityFeed);
};

const recalculateRoomTotal = (room) => {
  room.total = Number(
    Array.from(room.cart.values())
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2),
  );
};

const ensureRoomExists = (roomCode) => {
  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error("Room not found.");
  }
  return room;
};

const ensureRoomIsOpen = (room) => {
  if (room.checkedOut) {
    throw new Error("Session has already been checked out and is locked.");
  }
};

const ensureOwner = (room, socketId) => room.ownerSocketId === socketId;

const closeRoomSession = (roomCode, reasonMessage) => {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  const memberSocketIds = Array.from(room.members.keys());
  io.to(roomCode).emit("session_closed", {
    message: reasonMessage,
    roomCode,
  });
  io.in(roomCode).socketsLeave(roomCode);

  memberSocketIds.forEach((memberSocketId) => {
    socketToRoom.delete(memberSocketId);
  });

  rooms.delete(roomCode);
};

/**
 * Server-authoritative queue processing.
 *
 * Clients never send "quantity = N".
 * They only send delta operations, such as +1 or -2.
 *
 * Why queueing helps:
 * - Every socket event is appended to one room queue
 * - We process that queue sequentially
 * - Each mutation reads the latest server-side quantity before applying the next delta
 * - That guarantees deterministic additive/subtractive merging, even when multiple users click at once
 */
const enqueueCartOperation = (roomCode, operation) => {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  room.pendingOperations.push(operation);
  if (!room.isProcessingQueue) {
    processCartQueue(roomCode);
  }
};

const processCartQueue = async (roomCode) => {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  room.isProcessingQueue = true;

  while (room.pendingOperations.length > 0) {
    const operation = room.pendingOperations.shift();
    const member = room.members.get(operation.socketId);

    if (!member) {
      continue;
    }

    const currentItem = room.cart.get(operation.item.id);
    const nextQuantity = Math.max(0, (currentItem?.quantity ?? 0) + operation.delta);

    if (nextQuantity === 0) {
      room.cart.delete(operation.item.id);
      pushActivity(roomCode, `${member.name} removed ${operation.item.name} from the cart.`, "warning");
    } else {
      const contributorsMap = new Map(currentItem?.contributors ?? []);
      contributorsMap.set(member.userId, {
        userId: member.userId,
        name: member.name,
      });

      room.cart.set(operation.item.id, {
        id: operation.item.id,
        name: operation.item.name,
        price: operation.item.price,
        unit: operation.item.unit,
        quantity: nextQuantity,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: member.name,
        contributors: Array.from(contributorsMap.entries()),
      });

      const verb = operation.delta > 0 ? "added" : "updated";
      const amount = Math.abs(operation.delta);
      pushActivity(
        roomCode,
        `${member.name} ${verb} ${amount}x ${operation.item.name}. Cart quantity is now ${nextQuantity}.`,
        operation.delta > 0 ? "success" : "info",
      );
    }

    recalculateRoomTotal(room);

    if (room.total > room.budgetCap) {
      io.to(roomCode).emit("conflict_alert", {
        message: `Budget exceeded by ${formatINR(room.total - room.budgetCap)}.`,
      });
      pushActivity(roomCode, `Budget exceeded by ${formatINR(room.total - room.budgetCap)}.`, "error");
    }

    emitRoomState(roomCode);
  }

  room.isProcessingQueue = false;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

io.on("connection", (socket) => {
  socket.emit("catalog", MOCK_PRODUCTS);

  socket.on("create_room", ({ name }) => {
    let roomCode = createSessionCode();
    while (rooms.has(roomCode)) {
      roomCode = createSessionCode();
    }

    const ownerName = name?.trim() || `Owner-${socket.id.slice(0, 4)}`;
    const owner = {
      socketId: socket.id,
      userId: `user-${socket.id.slice(0, 6)}`,
      name: ownerName,
      role: "owner",
    };

    rooms.set(roomCode, {
      ownerSocketId: socket.id,
      members: new Map([[socket.id, owner]]),
      cart: new Map(),
      budgetCap: 2500,
      total: 0,
      activityFeed: [],
      pendingOperations: [],
      isProcessingQueue: false,
      checkedOut: false,
      checkoutSummary: null,
    });

    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    pushActivity(roomCode, `${ownerName} created the session.`, "success");
    socket.emit("room_joined", {
      ...getRoomSnapshot(roomCode),
      currentUser: owner,
    });
    emitRoomState(roomCode);
  });

  socket.on("join_room", ({ roomCode, name }) => {
    const normalizedRoomCode = roomCode?.toUpperCase().trim();
    const room = rooms.get(normalizedRoomCode);

    if (!room) {
      socket.emit("server_error", { message: "Session code not found." });
      return;
    }

    const contributorName = name?.trim() || `User-${socket.id.slice(0, 4)}`;
    const contributor = {
      socketId: socket.id,
      userId: `user-${socket.id.slice(0, 6)}`,
      name: contributorName,
      role: "contributor",
    };

    room.members.set(socket.id, contributor);
    socketToRoom.set(socket.id, normalizedRoomCode);
    socket.join(normalizedRoomCode);

    pushActivity(normalizedRoomCode, `${contributorName} joined the session.`, "success");
    socket.emit("room_joined", {
      ...getRoomSnapshot(normalizedRoomCode),
      currentUser: contributor,
    });
    emitRoomState(normalizedRoomCode);
  });

  socket.on("add_item", ({ roomCode, item, delta = 1 }) => {
    try {
      const room = ensureRoomExists(roomCode);
      ensureRoomIsOpen(room);
      enqueueCartOperation(roomCode, {
        socketId: socket.id,
        item,
        delta: Math.max(1, Number(delta) || 1),
      });
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("update_quantity", ({ roomCode, item, delta }) => {
    try {
      const room = ensureRoomExists(roomCode);
      ensureRoomIsOpen(room);
      const normalizedDelta = Number(delta);

      if (!normalizedDelta || normalizedDelta === 0) {
        socket.emit("server_error", { message: "Quantity updates must use a non-zero delta." });
        return;
      }

      enqueueCartOperation(roomCode, {
        socketId: socket.id,
        item,
        delta: normalizedDelta,
      });
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("remove_item", ({ roomCode, itemId }) => {
    try {
      const room = ensureRoomExists(roomCode);
      ensureRoomIsOpen(room);
      const item = room.cart.get(itemId);

      if (!item) {
        socket.emit("server_error", { message: "Item is no longer in the cart." });
        return;
      }

      enqueueCartOperation(roomCode, {
        socketId: socket.id,
        item,
        delta: -item.quantity,
      });
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("change_budget", ({ roomCode, budgetCap }) => {
    try {
      const room = ensureRoomExists(roomCode);
      ensureRoomIsOpen(room);
      if (!ensureOwner(room, socket.id)) {
        socket.emit("unauthorized_action", { message: "Only the Owner can change the budget." });
        return;
      }

      room.budgetCap = Math.max(1, Number(budgetCap) || room.budgetCap);
      pushActivity(roomCode, `Budget updated to ${formatINR(room.budgetCap)} by the Owner.`, "info");
      emitRoomState(roomCode);
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("checkout", ({ roomCode }) => {
    try {
      const room = ensureRoomExists(roomCode);
      if (!ensureOwner(room, socket.id)) {
        socket.emit("unauthorized_action", { message: "Only the Owner can trigger checkout." });
        return;
      }
      if (room.checkedOut) {
        socket.emit("server_error", { message: "Session has already been checked out." });
        return;
      }

      room.checkedOut = true;
      room.checkoutSummary = {
        total: room.total,
        budgetCap: room.budgetCap,
        itemCount: Array.from(room.cart.values()).reduce((sum, item) => sum + item.quantity, 0),
        items: Array.from(room.cart.values()),
        checkedOutAt: new Date().toISOString(),
      };

      pushActivity(roomCode, "The Owner triggered checkout.", "success");
      io.to(roomCode).emit("checkout_complete", room.checkoutSummary);
      emitRoomState(roomCode);
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("remove_member", ({ roomCode, memberSocketId }) => {
    try {
      const room = ensureRoomExists(roomCode);
      if (!ensureOwner(room, socket.id)) {
        socket.emit("unauthorized_action", { message: "Only the Owner can remove a member." });
        return;
      }

      const member = room.members.get(memberSocketId);
      if (!member || member.role === "owner") {
        socket.emit("server_error", { message: "Invalid member removal request." });
        return;
      }

      room.members.delete(memberSocketId);
      io.to(memberSocketId).emit("removed_from_room", { message: "The Owner removed you from the session." });
      io.sockets.sockets.get(memberSocketId)?.leave(roomCode);
      pushActivity(roomCode, `${member.name} was removed from the session by the Owner.`, "warning");
      emitRoomState(roomCode);
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("close_session", ({ roomCode }) => {
    try {
      const room = ensureRoomExists(roomCode);
      if (!ensureOwner(room, socket.id)) {
        socket.emit("unauthorized_action", { message: "Only the Owner can close the session." });
        return;
      }

      closeRoomSession(roomCode, "The Owner ended the shopping trip.");
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) {
      return;
    }

    socketToRoom.delete(socket.id);
    const room = rooms.get(roomCode);
    if (!room) {
      return;
    }

    const member = room.members.get(socket.id);
    room.members.delete(socket.id);

    if (member) {
      pushActivity(roomCode, `${member.name} left the session.`, "warning");
    }

    if (room.members.size === 0) {
      rooms.delete(roomCode);
      return;
    }

    if (room.ownerSocketId === socket.id) {
      const nextOwner = Array.from(room.members.values())[0];
      nextOwner.role = "owner";
      room.ownerSocketId = nextOwner.socketId;
      pushActivity(roomCode, `${nextOwner.name} is now the Owner.`, "info");
    }

    emitRoomState(roomCode);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Collaborative shopping backend listening on port ${PORT}`);
});
