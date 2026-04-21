import { useState } from "react";
import { ShoppingBasket, Users, Wallet } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import cartNestLogo from "../assets/items/logo-optimized.png";

const LandingPage = () => {
  const { createRoom, joinRoom, connected } = useSocket();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="relative px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto mb-4 flex max-w-7xl justify-end sm:mb-6">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-right shadow-sm backdrop-blur sm:px-4">
          <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-ink sm:text-base">CartNest</p>
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full sm:h-10 sm:w-10">
            <img src={cartNestLogo} alt="CartNest logo" className="h-full w-full scale-[1.55] object-contain" />
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:min-h-[calc(100vh-5rem)] lg:flex-row lg:items-center lg:justify-center">
        <section className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`} />
            {connected ? "Socket connected" : "Connecting..."}
          </span>
          <h1 className="mt-5 max-w-none break-words font-display text-2xl font-bold leading-[1.12] text-ink [overflow-wrap:anywhere] min-[360px]:text-3xl sm:mt-6 sm:text-5xl lg:text-6xl">
            Shop together in real time, without losing the budget plot.
          </h1>
          <p className="mt-4 max-w-none break-words text-sm leading-7 text-slate-600 [overflow-wrap:anywhere] min-[360px]:text-base sm:mt-5 sm:max-w-xl sm:text-lg sm:leading-8">
            Spin up a shared grocery session, invite your team with a code, and watch cart updates, budget changes,
            and checkout flow live for everyone.
          </p>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 md:grid-cols-3">
            {[
              { icon: Users, title: "Live roles", text: "Owners manage checkout and budget; contributors focus on cart building." },
              { icon: Wallet, title: "Budget-aware", text: "The server keeps the running total honest in rupees and pushes over-budget alerts instantly." },
              { icon: ShoppingBasket, title: "Shared cart", text: "Every add, remove, and quantity change lands for everyone at once." },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-glow backdrop-blur sm:p-5">
                <Icon className="h-8 w-8 text-coral" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink sm:text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-glow backdrop-blur sm:rounded-[32px] sm:p-8 md:max-w-4xl lg:max-w-xl">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end lg:grid-cols-1 lg:items-stretch">
            <div className="grid gap-4">
              <div>
                <label htmlFor="display-name" className="mb-2 block text-sm font-semibold text-slate-600">
                  Display name
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Aisha, Neel, Team Alpha..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none ring-0 transition focus:border-coral min-[360px]:px-4 min-[360px]:text-base"
                />
              </div>

              <button
                onClick={() => createRoom(name)}
                className="w-full rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5 whitespace-normal break-words min-[360px]:px-5 min-[360px]:py-4 min-[360px]:text-base"
              >
                <span className="block break-words whitespace-normal">Create New Session</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center py-1 text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 before:absolute before:left-0 before:right-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-slate-200 before:content-[''] md:min-h-full md:px-4 md:before:left-1/2 md:before:top-0 md:before:h-full md:before:w-px md:before:-translate-x-1/2 md:before:translate-y-0 lg:min-h-0 lg:px-0 lg:before:left-0 lg:before:right-0 lg:before:top-1/2 lg:before:h-px lg:before:w-auto lg:before:translate-x-0 lg:before:-translate-y-1/2">
              <span className="relative bg-white px-4 md:px-0 md:py-4 lg:px-4 lg:py-0">Or Join</span>
            </div>

            <div className="grid gap-4">
              <div>
                <label htmlFor="session-code" className="mb-2 block text-sm font-semibold text-slate-600">
                  Session code
                </label>
                <input
                  id="session-code"
                  name="sessionCode"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="AB12CD"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 uppercase text-sm text-slate-800 outline-none transition focus:border-ocean min-[360px]:px-4 min-[360px]:text-base"
                />
              </div>

              <button
                onClick={() => joinRoom({ roomCode: joinCode, name })}
                className="w-full rounded-2xl bg-gradient-to-r from-coral to-orange-400 px-4 py-3 text-center text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5 whitespace-normal break-words min-[360px]:px-5 min-[360px]:py-4 min-[360px]:text-base"
              >
                <span className="block break-words whitespace-normal">Join Existing Session</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
