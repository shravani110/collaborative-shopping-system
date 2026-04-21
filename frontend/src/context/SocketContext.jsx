import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { enrichProducts, fallbackProducts } from "../data/products";

const SocketContext = createContext(null);
const SOCKET_URL = "http://localhost:4000";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [roomCode, setRoomCode] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [cart, setCart] = useState([]);
  const [members, setMembers] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [budgetCap, setBudgetCap] = useState(2500);
  const [total, setTotal] = useState(0);
  const [catalog, setCatalog] = useState(fallbackProducts);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("catalog", (items) => setCatalog(enrichProducts(items)));
    socket.on("room_joined", (payload) => {
      hydrateRoom(payload);
      setCurrentUser(payload.currentUser);
      setCurrentRole(payload.currentUser?.role ?? null);
      toast.success(`Joined session ${payload.roomCode}`);
    });
    socket.on("room_state", (payload) => hydrateRoom(payload));
    socket.on("activity_feed_updated", (entries) => setActivityFeed(entries));
    socket.on("checkout_complete", (summary) => {
      setCheckoutSummary(summary);
      toast.success("Checkout opened for everyone");
    });
    socket.on("server_error", ({ message }) => toast.error(message));
    socket.on("unauthorized_action", ({ message }) => toast.error(message));
    socket.on("conflict_alert", ({ message }) => toast(message, { icon: "!" }));
    socket.on("removed_from_room", ({ message }) => {
      toast.error(message);
      resetRoom();
    });
    socket.on("session_closed", ({ message }) => {
      toast(message, { icon: "X" });
      resetRoom();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const hydrateRoom = (payload) => {
    setRoomCode(payload.roomCode);
    setCart(payload.cart ?? []);
    setMembers(payload.members ?? []);
    setActivityFeed(payload.activityFeed ?? []);
    setBudgetCap(payload.budgetCap ?? 2500);
    setTotal(payload.total ?? 0);
    setCheckoutSummary(payload.checkoutSummary ?? null);
    setCatalog(payload.catalog ? enrichProducts(payload.catalog) : fallbackProducts);
    setCurrentUser((previous) => {
      if (!previous) {
        return previous;
      }

      const freshMember = payload.members?.find((member) => member.userId === previous.userId);
      if (!freshMember) {
        return previous;
      }

      setCurrentRole(freshMember.role);
      return freshMember;
    });
  };

  const resetRoom = () => {
    setRoomCode("");
    setCurrentUser(null);
    setCurrentRole(null);
    setCart([]);
    setMembers([]);
    setActivityFeed([]);
    setBudgetCap(2500);
    setTotal(0);
    setCheckoutSummary(null);
    setCatalog(fallbackProducts);
  };

  const createRoom = (name) => {
    socketRef.current?.emit("create_room", { name });
  };

  const joinRoom = ({ roomCode: code, name }) => {
    socketRef.current?.emit("join_room", { roomCode: code, name });
  };

  const addItem = (item) => {
    socketRef.current?.emit("add_item", { roomCode, item, delta: 1 });
  };

  const changeQuantity = (item, delta) => {
    socketRef.current?.emit("update_quantity", { roomCode, item, delta });
  };

  const removeItem = (itemId) => {
    socketRef.current?.emit("remove_item", { roomCode, itemId });
  };

  const changeBudget = (nextBudgetCap) => {
    socketRef.current?.emit("change_budget", { roomCode, budgetCap: nextBudgetCap });
  };

  const checkout = () => {
    socketRef.current?.emit("checkout", { roomCode });
  };

  const removeMember = (memberSocketId) => {
    socketRef.current?.emit("remove_member", { roomCode, memberSocketId });
  };

  const closeSession = () => {
    socketRef.current?.emit("close_session", { roomCode });
  };

  const value = useMemo(
    () => ({
      connected,
      roomCode,
      currentUser,
      currentRole,
      cart,
      members,
      activityFeed,
      budgetCap,
      total,
      catalog,
      checkoutSummary,
      createRoom,
      joinRoom,
      addItem,
      changeQuantity,
      removeItem,
      changeBudget,
      checkout,
      removeMember,
      closeSession,
    }),
    [connected, roomCode, currentUser, currentRole, cart, members, activityFeed, budgetCap, total, catalog, checkoutSummary],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return context;
};
