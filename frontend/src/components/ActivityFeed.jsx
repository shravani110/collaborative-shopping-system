import { Clock3 } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const typeStyles = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
  info: "bg-sky-100 text-sky-700",
};

const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const ActivityFeed = () => {
  const { activityFeed } = useSocket();

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-glow backdrop-blur sm:rounded-[32px] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white">
          <Clock3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Live log</p>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Activity feed</h2>
        </div>
      </div>

      <div className="mt-6 max-h-[640px] space-y-3 overflow-y-auto pr-1">
        {activityFeed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
            Activity will appear here as your team collaborates.
          </div>
        ) : null}

        {activityFeed.map((entry) => (
          <article key={entry.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-6 text-slate-700">{entry.message}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeStyles[entry.type] ?? typeStyles.info}`}>
                {entry.type}
              </span>
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              {formatTimestamp(entry.timestamp)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ActivityFeed;
