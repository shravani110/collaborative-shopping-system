import { Minus, Plus, ShieldCheck, Trash2, UserX } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { getProductMeta } from "../data/products";
import { formatCurrency } from "../utils/currency";

const initials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const LiveCart = () => {
  const { cart, currentRole, checkout, changeQuantity, removeItem, members, currentUser, removeMember } = useSocket();

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-glow backdrop-blur sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Shared cart</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">Live cart</h2>
        </div>
        {currentRole === "owner" ? (
          <button
            onClick={checkout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 font-semibold text-white sm:w-auto"
          >
            <ShieldCheck className="h-5 w-5" />
            Checkout
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {cart.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">
            Cart is empty. Start adding products from the catalog.
          </div>
        ) : null}

        {cart.map((item) => (
          <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <img src={getProductMeta(item.id).image} alt={item.name} className="h-14 w-14 rounded-2xl object-cover sm:h-16 sm:w-16" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatCurrency(item.price)} each | Updated by {item.lastUpdatedBy}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="rounded-xl border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-slate-100 p-2">
                <button onClick={() => changeQuantity(item, -1)} className="rounded-xl bg-white p-2 text-slate-700">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                <button onClick={() => changeQuantity(item, 1)} className="rounded-xl bg-white p-2 text-slate-700">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-lg font-bold text-slate-900 sm:text-right">{formatCurrency(item.quantity * item.price)}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {item.contributors?.map(([, contributor]) => (
                <div key={contributor.userId} className="inline-flex items-center gap-2 rounded-full bg-peach px-3 py-2 text-sm text-slate-700">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white font-semibold text-slate-800">
                    {initials(contributor.name)}
                  </span>
                  {contributor.name}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {currentRole === "owner" ? (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Session members</h3>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <div key={member.userId} className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{member.name}</p>
                  <p className="text-sm capitalize text-slate-500">{member.role}</p>
                </div>
                {member.role !== "owner" && member.socketId !== currentUser?.socketId ? (
                  <button
                    onClick={() => removeMember(member.socketId)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <UserX className="h-4 w-4" />
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default LiveCart;
