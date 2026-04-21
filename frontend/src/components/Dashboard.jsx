import { useEffect, useRef, useState } from "react";
import BudgetTracker from "./BudgetTracker";
import ProductList from "./ProductList";
import LiveCart from "./LiveCart";
import ActivityFeed from "./ActivityFeed";
import { useSocket } from "../context/SocketContext";
import { getProductMeta } from "../data/products";
import { formatCurrency } from "../utils/currency";

const Dashboard = () => {
  const { roomCode, currentUser, currentRole, members, total, checkoutSummary, closeSession } = useSocket();
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const paymentTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const paymentAmount = checkoutSummary?.total ?? total ?? 0;

  useEffect(() => {
    return () => {
      if (paymentTimerRef.current) {
        clearTimeout(paymentTimerRef.current);
      }

      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!checkoutSummary) {
      setIsSimulatingPayment(false);
      setPaymentStatus("idle");
    }
  }, [checkoutSummary]);

  const handlePaytmPayment = () => {
    if (currentRole !== "owner" || isSimulatingPayment || paymentStatus === "success") {
      return;
    }

    setIsSimulatingPayment(true);
    setPaymentStatus("processing");

    paymentTimerRef.current = setTimeout(() => {
      setIsSimulatingPayment(false);
      setPaymentStatus("success");

      closeTimerRef.current = setTimeout(() => {
        closeSession();
      }, 900);
    }, 2000);
  };

  return (
    <div className="min-h-screen px-2 py-3 min-[360px]:px-3 min-[360px]:py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[24px] border border-white/70 bg-white/80 p-3 shadow-glow backdrop-blur min-[360px]:rounded-[28px] min-[360px]:p-4 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Session</p>
              <h1 className="mt-2 break-all font-display text-3xl font-bold leading-none text-ink sm:text-4xl">{roomCode}</h1>
              <p className="mt-2 break-words text-sm text-slate-600 sm:text-base">
                Signed in as <span className="font-semibold text-slate-900">{currentUser?.name}</span> ({currentRole})
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 lg:flex lg:flex-wrap">
              {members.map((member) => (
                <div key={member.userId} className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 min-[360px]:px-4">
                  <p className="truncate font-semibold text-slate-800">{member.name}</p>
                  <p className="text-sm capitalize text-slate-500">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[1.2fr_1fr_0.8fr]">
          <div className="space-y-6">
            <BudgetTracker />
            <ProductList />
          </div>
          <LiveCart />
          <ActivityFeed />
        </div>
      </div>

      {checkoutSummary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-4 shadow-2xl sm:rounded-[32px] sm:p-6">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Final Order Summary</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">Checkout is locked in for everyone in this session.</p>
            <div className="mt-6 space-y-3">
              {checkoutSummary.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={getProductMeta(item.id).image} alt={item.name} className="h-14 w-14 rounded-2xl object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                  <p className="text-left font-bold text-slate-900 sm:text-right">{formatCurrency(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-ink px-4 py-4 text-white sm:px-5">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold sm:text-2xl">{formatCurrency(checkoutSummary.total)}</span>
            </div>
            <div className="mt-5">
              <button
                onClick={currentRole === "owner" ? handlePaytmPayment : undefined}
                disabled={currentRole !== "owner" || isSimulatingPayment || paymentStatus === "success"}
                className={`w-full rounded-2xl px-5 py-4 font-semibold transition ${
                  currentRole === "owner"
                    ? "bg-gradient-to-r from-sky-600 to-blue-500 text-white hover:-translate-y-0.5 disabled:hover:translate-y-0"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {isSimulatingPayment ? (
                  <span className="inline-flex items-center justify-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    {`Processing ${formatCurrency(paymentAmount)} payment...`}
                  </span>
                ) : (
                  `Pay ${formatCurrency(paymentAmount)} with Paytm`
                )}
              </button>
              {paymentStatus === "success" ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                  {`Payment Successful! ${formatCurrency(paymentAmount)} paid.`}
                </div>
              ) : null}
              <p className="mt-2 text-center text-sm text-slate-500">
                {currentRole === "owner"
                  ? "This simulates a Paytm payment, then closes the session for everyone automatically."
                  : "Only the Owner can close this session."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Dashboard;
