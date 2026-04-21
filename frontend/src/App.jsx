import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { useSocket } from "./context/SocketContext";

const App = () => {
  const { roomCode } = useSocket();

  return roomCode ? <Dashboard /> : <LandingPage />;
};

export default App;
