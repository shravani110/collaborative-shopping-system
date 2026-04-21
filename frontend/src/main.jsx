import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SocketProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "16px",
            background: "#0f172a",
            color: "#f8fafc",
          },
        }}
      />
    </SocketProvider>
  </React.StrictMode>,
);
