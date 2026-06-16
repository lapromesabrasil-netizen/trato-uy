import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo } from "../lib/constants";
import { toast } from "sonner";

export default function Messages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get("/conversations");
        setConvs(data.conversations || []);
      } catch (e) { toast.error(formatApiError(e)); }
      finally { setBusy(false); }
    })();
  }, [user, loading, navigate]);

  if (busy) return <div className="text-center py-10 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">Mensajes</h1>
      {convs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-gray-500">Aún no tenés conversaciones</p>
        </div>
      ) : (
        convs.map((c) => (
          <Link key={c.conversation_id} to={`/messages/${c.listing_id}/${c.other_user.id}`}
            data-testid={`conv-${c.conversation_id}`}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3 hover:bg-gray-50">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              {c.listing_image ? <img src={c.listing_image} alt="" className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="font-bold truncate">{c.other_user.name}</div>
                <div className="text-xs text-gray-400">{timeAgo(c.last_at)}</div>
              </div>
              <div className="text-xs text-[#05C46B] font-semibold truncate">{c.listing_title}</div>
              <div className="text-sm text-gray-600 truncate">{c.last_message}</div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
