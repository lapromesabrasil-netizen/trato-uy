import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo, formatPrice } from "../lib/constants";
import { toast } from "sonner";

export default function Offers() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const load = async () => {
    try {
      const [r, s] = await Promise.all([api.get("/offers/received"), api.get("/offers/sent")]);
      setReceived(r.data.offers || []);
      setSent(s.data.offers || []);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (user) load();
    // eslint-disable-next-line
  }, [user, loading]);

  const respond = async (id, action) => {
    try {
      await api.post(`/offers/${id}/action`, { action });
      toast.success(action === "accept" ? "Oferta aceptada" : "Oferta rechazada");
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const list = tab === "received" ? received : sent;
  const statusColor = (s) => s === "accepted" ? "text-green-600 bg-green-50" : s === "rejected" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";
  const statusLabel = (s) => s === "accepted" ? "Aceptada" : s === "rejected" ? "Rechazada" : "Pendiente";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Ofertas</h1>
      <div className="flex gap-2 border-b border-gray-100">
        <button data-testid="tab-received" onClick={() => setTab("received")}
          className={`px-4 py-2 text-sm font-bold ${tab === "received" ? "border-b-2 border-[#05C46B] text-[#05C46B]" : "text-gray-500"}`}>
          Recibidas ({received.length})
        </button>
        <button data-testid="tab-sent" onClick={() => setTab("sent")}
          className={`px-4 py-2 text-sm font-bold ${tab === "sent" ? "border-b-2 border-[#05C46B] text-[#05C46B]" : "text-gray-500"}`}>
          Enviadas ({sent.length})
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Sin ofertas</p>
      ) : list.map((o) => (
        <div key={o.id} data-testid={`offer-${o.id}`} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/product/${o.listing_id}`} className="font-bold text-sm hover:underline truncate block">{o.listing_title}</Link>
              <div className="text-xs text-gray-500">Precio publicado: {formatPrice(o.listing_price)}</div>
              <div className="text-xs text-gray-500">{tab === "received" ? `De: ${o.buyer_name}` : ""} · {timeAgo(o.created_at)}</div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor(o.status)}`}>{statusLabel(o.status)}</div>
          </div>
          <div className="text-2xl font-extrabold text-[#FF6B00]">{formatPrice(o.amount)}</div>
          {o.message && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{o.message}</p>}
          {tab === "received" && o.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <button data-testid={`offer-accept-${o.id}`} onClick={() => respond(o.id, "accept")} className="btn-mint flex-1 flex items-center justify-center gap-1 py-2">
                <Check className="w-4 h-4" /> Aceptar
              </button>
              <button data-testid={`offer-reject-${o.id}`} onClick={() => respond(o.id, "reject")}
                className="flex-1 border border-gray-300 text-gray-700 rounded-full font-bold py-2 hover:bg-gray-50 flex items-center justify-center gap-1">
                <X className="w-4 h-4" /> Rechazar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
