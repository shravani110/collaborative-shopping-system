import { Plus } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { formatCurrency } from "../utils/currency";

const ProductList = () => {
  const { catalog, addItem } = useSocket();

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-3 shadow-glow backdrop-blur min-[360px]:p-4 sm:rounded-[32px] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Catalog</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">Add groceries fast</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
        {catalog.map((item) => (
          <article
            key={item.id}
            className="group rounded-[22px] border border-slate-200 bg-white p-2.5 transition hover:-translate-y-1 hover:shadow-xl min-[360px]:rounded-[24px] min-[360px]:p-3 sm:rounded-[28px] sm:p-4"
          >
            <div className="relative overflow-hidden rounded-[18px] min-[360px]:rounded-[20px] sm:rounded-3xl">
              <img src={item.image} alt={item.name} className="h-20 w-full rounded-[18px] object-cover min-[360px]:h-24 min-[360px]:rounded-[20px] sm:h-32 sm:rounded-3xl" />
              <div className="absolute bottom-2 left-2 min-[360px]:bottom-3 min-[360px]:left-3 sm:bottom-5 sm:left-5">
                <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-sm min-[360px]:px-2.5 min-[360px]:text-xs sm:px-3 sm:text-sm">
                  {item.unit}
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-start justify-between gap-2 min-[360px]:mt-3 sm:mt-4 sm:gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-semibold text-ink min-[360px]:text-lg sm:text-2xl">{item.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500 min-[360px]:mt-1 min-[360px]:text-sm">{formatCurrency(item.price)}</p>
              </div>
              <button
                onClick={() => addItem(item)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition group-hover:bg-coral min-[360px]:h-10 min-[360px]:w-10 sm:h-11 sm:w-11 sm:rounded-2xl"
              >
                <Plus className="h-4 w-4 min-[360px]:h-4.5 min-[360px]:w-4.5 sm:h-5 sm:w-5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ProductList;
