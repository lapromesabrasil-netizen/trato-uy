import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function ChatRoom() {
  const { listingId, userId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [listing, setListing] = useState(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    try {
      const [{ data }, lst] = await Promise.all([
        api.get(`/messages/${listingId}/${userId}`),
        api.get(`/listings/${listingId}`),
      ]);
      setMessages(data.messages || []);
      setListing(lst.data.listing);
    } catch (e) { /* ignore polling errors */ }
  };

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (!user) return;
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [listingId, userId, user, loading]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.post("/messages", { listing_id: listingId, to_user_id: userId, text });
      setText("");
      await load();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="-mx-4 sm:mx-0">
      {/* Listing strip */}
      {listing && (
        <Link to={`/product/${listing.id}`} data-testid="chat-listing-strip"
          className="flex items-center gap-3 bg-gray-50 px-4 py-2 border-b border-gray-100 sticky top-14 z-20">
          <button onClick={(e) => { e.preventDefault(); navigate(-1); }} className="text-gray-600 p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {listing.images?.[0] && <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{listing.title}</div>
            <div className="text-xs text-[#05C46B] font-semibold">$ {listing.price?.toLocaleString("es-UY")}</div>
          </div>
        </Link>
      )}

      <div className="px-4 pb-32 pt-3 space-y-2 min-h-[50vh]">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Aún no hay mensajes. ¡Saludá!</p>
        ) : messages.map((m) => {
          const mine = m.from_user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div data-testid={`msg-${m.id}`} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#05C46B] text-white" : "bg-gray-100 text-gray-900"}`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-2">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Escribí tu mensaje..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
          <button data-testid="chat-send" type="submit" disabled={busy || !text.trim()}
            className="w-11 h-11 rounded-full bg-[#FF6B00] hover:bg-[#E65A00] text-white flex items-center justify-center disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
