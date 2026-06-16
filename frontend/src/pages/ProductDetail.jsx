import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, MapPin, MessageCircle, Tag, Flag } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo, formatPrice, CATEGORY_NAMES } from "../lib/constants";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/listings/${id}`);
      setListing(data.listing);
    } catch (e) { toast.error(formatApiError(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const requireAuth = () => {
    if (!user) { toast.error("Necesitás iniciar sesión"); navigate("/login"); return false; }
    return true;
  };

  const startChat = () => {
    if (!requireAuth()) return;
    navigate(`/messages/${listing.id}/${listing.seller_id}`);
  };

  const submitOffer = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await api.post("/offers", { listing_id: listing.id, amount: Number(offerAmount), message: offerMsg });
      toast.success("¡Oferta enviada!");
      setOfferOpen(false); setOfferAmount(""); setOfferMsg("");
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const submitReport = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await api.post("/reports", { target_type: "listing", target_id: listing.id, reason: reportReason });
      toast.success("Reporte enviado, gracias.");
      setReportOpen(false); setReportReason("");
    } catch (e) { toast.error(formatApiError(e)); }
    finally { setBusy(false); }
  };

  if (!listing) return <div className="text-center py-10 text-gray-500">Cargando...</div>;
  const isOwner = user && user.id === listing.seller_id;

  return (
    <div className="space-y-4 pb-32">
      {/* Image gallery */}
      <div className="-mx-4 sm:mx-0">
        <div className="aspect-square w-full bg-gray-100 overflow-hidden sm:rounded-2xl">
          {listing.images && listing.images[activeImg] ? (
            <img src={listing.images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
          )}
        </div>
        {listing.images && listing.images.length > 1 && (
          <div className="flex gap-2 px-4 mt-3 overflow-x-auto scrollbar-hide">
            {listing.images.map((src, i) => (
              <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 ${i === activeImg ? "border-[#05C46B]" : "border-transparent"}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title & price */}
      <div>
        <div className="text-3xl font-extrabold text-gray-900">{formatPrice(listing.price)}</div>
        <h1 className="text-xl font-bold mt-1">{listing.title}</h1>
        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4" /> {listing.zone}, {listing.department} · {timeAgo(listing.created_at)}
        </div>
        <div className="inline-block mt-2 text-xs font-semibold text-[#05C46B] bg-[#E6FAF0] rounded-full px-3 py-1">
          {CATEGORY_NAMES[listing.category] || listing.category}
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h3 className="font-bold mb-1">Descripción</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Seller */}
      {listing.seller && (
        <Link to={`/profile/${listing.seller.id}`} data-testid="seller-card"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:bg-gray-50">
          <div className="w-12 h-12 rounded-full bg-[#E6FAF0] text-[#05C46B] flex items-center justify-center font-bold text-lg">
            {listing.seller.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold">{listing.seller.name}</div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(listing.seller.rating_avg || 0) ? "fill-[#FFB400] text-[#FFB400]" : "text-gray-300"}`} />
              ))}
              <span className="text-xs text-gray-500 ml-1">({listing.seller.rating_count || 0})</span>
            </div>
          </div>
          <div className="text-xs text-[#05C46B] font-semibold">Ver perfil →</div>
        </Link>
      )}

      <button data-testid="report-btn" onClick={() => { if (!requireAuth()) return; setReportOpen(true); }}
        className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 mx-auto">
        <Flag className="w-4 h-4" /> Reportar publicación
      </button>

      {/* Sticky action bar */}
      {!isOwner && (
        <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button data-testid="chat-btn" onClick={startChat} className="btn-mint-outline flex-1 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> Chatear
            </button>
            <button data-testid="offer-btn" onClick={() => { if (!requireAuth()) return; setOfferOpen(true); }}
              className="btn-orange flex-1 flex items-center justify-center gap-2">
              <Tag className="w-5 h-5" /> Hacer Oferta
            </button>
          </div>
        </div>
      )}

      {/* Offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Hacer una contraoferta</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Precio publicado: <strong>{formatPrice(listing.price)}</strong></p>
          <input data-testid="offer-amount" type="number" min={1} value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)}
            placeholder="Tu oferta en $"
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
          <textarea data-testid="offer-msg" rows={3} value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)}
            placeholder="Mensaje (opcional)"
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
          <DialogFooter>
            <button onClick={() => setOfferOpen(false)} className="text-gray-600 px-4 py-2">Cancelar</button>
            <button data-testid="offer-submit" disabled={busy || !offerAmount} onClick={submitOffer} className="btn-orange">
              {busy ? "Enviando..." : "Enviar oferta"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Reportar publicación</DialogTitle></DialogHeader>
          <textarea data-testid="report-reason" rows={4} value={reportReason} onChange={(e) => setReportReason(e.target.value)}
            placeholder="Contanos qué problema viste"
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
          <DialogFooter>
            <button onClick={() => setReportOpen(false)} className="text-gray-600 px-4 py-2">Cancelar</button>
            <button data-testid="report-submit" disabled={busy || reportReason.length < 3} onClick={submitReport} className="btn-mint">
              Enviar reporte
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
