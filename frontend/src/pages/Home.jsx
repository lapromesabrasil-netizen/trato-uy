import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, MapPin } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { DEPARTMENTS, CATEGORIES, timeAgo, formatPrice } from "../lib/constants";
import { toast } from "sonner";

export default function Home() {
  const [department, setDepartment] = useState(localStorage.getItem("tratouy_dept") || "Todos");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDept, setShowDept] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (department && department !== "Todos") params.department = department;
      if (category && category !== "all") params.category = category;
      if (query) params.q = query;
      const { data } = await api.get("/listings", { params });
      setListings(data.listings || []);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [department, category]);

  const onSearch = (e) => { e.preventDefault(); load(); };

  const pickDept = (d) => {
    setDepartment(d);
    localStorage.setItem("tratouy_dept", d);
    setShowDept(false);
  };

  return (
    <div className="space-y-5">
      {/* Location selector */}
      <div className="relative">
        <button data-testid="dept-selector"
          onClick={() => setShowDept((s) => !s)}
          className="w-full flex items-center gap-3 bg-[#E6FAF0] border border-[#05C46B]/30 rounded-2xl px-4 py-3 hover:bg-[#d3f4e2] transition">
          <MapPin className="w-5 h-5 text-[#05C46B]" />
          <div className="text-left flex-1">
            <div className="text-xs text-gray-500 font-medium">¿Dónde estás?</div>
            <div className="font-bold text-gray-900">{department}</div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showDept ? "rotate-180" : ""}`} />
        </button>
        {showDept && (
          <div className="absolute z-30 mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto">
            {["Todos", ...DEPARTMENTS].map((d) => (
              <button key={d} data-testid={`dept-option-${d}`}
                onClick={() => pickDept(d)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${d === department ? "text-[#05C46B] font-bold" : "text-gray-800"}`}>
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search bar */}
      <form onSubmit={onSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          data-testid="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué estás buscando hoy?"
          className="w-full bg-gray-100 rounded-full py-3 pl-12 pr-5 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#05C46B]/50"
        />
      </form>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button key={c.id} data-testid={`cat-${c.id}`} onClick={() => setCategory(c.id)}
              className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition ${active ? "bg-[#05C46B] text-white shadow-md shadow-[#05C46B]/30" : "bg-[#E6FAF0] text-[#05C46B]"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-xs ${active ? "text-[#05C46B] font-bold" : "text-gray-700 font-medium"}`}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando publicaciones...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🛍️</div>
          <h3 className="text-lg font-bold">Aún no hay publicaciones</h3>
          <p className="text-sm text-gray-500 mt-1">Sé el primero en publicar en {department}</p>
          <Link to="/publish" data-testid="empty-publish-btn" className="btn-orange inline-block mt-4">Publicar ahora</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {listings.map((it) => (
            <Link key={it.id} to={`/product/${it.id}`} data-testid={`listing-card-${it.id}`}
              className="product-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
              <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                {it.images && it.images[0] ? (
                  <img src={it.images[0]} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div className="text-lg font-extrabold text-gray-900">{formatPrice(it.price)}</div>
                <div className="text-sm text-gray-700 line-clamp-1">{it.title}</div>
                <div className="text-xs text-gray-500">{it.zone}, {it.department} · {timeAgo(it.created_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
