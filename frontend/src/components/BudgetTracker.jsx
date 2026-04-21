import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { formatCurrency } from "../utils/currency";

const BudgetTracker = () => {
  const { budgetCap, total, currentRole, changeBudget } = useSocket();
  const [draftBudget, setDraftBudget] = useState(budgetCap);

  useEffect(() => {
    setDraftBudget(budgetCap);
  }, [budgetCap]);

  const percent = Math.min(100, Math.round((total / budgetCap) * 100));
  const overBudget = total > budgetCap;

  return (
    <section className="rounded-[24px] border border-white/70 bg-white/80 p-3 shadow-glow backdrop-blur min-[360px]:rounded-[28px] min-[360px]:p-4 sm:rounded-[32px] sm:p-6">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0 flex-1 lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Budget</p>
          <h2 className="mt-2 font-display text-xl font-bold leading-tight text-ink sm:text-3xl">
            <span className="block sm:hidden">Budget tracker</span>
            <span className="hidden sm:block">Shared budget tracker</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Server-calculated spend updates in real time for every member.
          </p>
        </div>

        {currentRole === "owner" ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:col-span-2 lg:max-w-none">
            <label htmlFor="budget-cap" className="sr-only">
              Budget cap
            </label>
            <input
              id="budget-cap"
              name="budgetCap"
              type="number"
              value={draftBudget}
              onChange={(event) => setDraftBudget(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm min-[360px]:px-4 min-[360px]:text-base"
            />
            <button
              onClick={() => changeBudget(Number(draftBudget))}
              className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white sm:min-w-[88px] sm:text-base"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[24px] bg-slate-950 p-4 text-white sm:mt-6 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Spend</p>
            <h3 className="mt-1 break-words text-2xl font-bold sm:text-4xl">{formatCurrency(total)}</h3>
          </div>
          <div className="sm:text-right">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Cap</p>
            <h3 className="mt-1 break-words text-lg font-semibold sm:text-2xl">{formatCurrency(budgetCap)}</h3>
          </div>
        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${overBudget ? "bg-gradient-to-r from-rose-500 to-orange-400" : "bg-gradient-to-r from-emerald-400 to-cyan-400"}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className={`mt-3 text-sm ${overBudget ? "text-rose-300" : "text-emerald-300"}`}>
          {overBudget ? `Over budget by ${formatCurrency(total - budgetCap)}` : `${budgetCap - total >= 0 ? `${formatCurrency(budgetCap - total)} remaining` : ""}`}
        </p>
      </div>
    </section>
  );
};

export default BudgetTracker;
