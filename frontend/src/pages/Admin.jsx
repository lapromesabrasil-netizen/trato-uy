import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShieldOff, ShieldCheck, FileWarning } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo, formatPrice } from "../lib/constants";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("reports");
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);

  const load = async () => {
    try {
      const [s, r, u, l] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/reports"),
        api.get("/admin/users"),
        api.get("/admin/listings"),
      ]);
      setStats(s.data);
      setReports(r.data.reports || []);
      setUsers(u.data.users || []);
      setListings(l.data.listings || []);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") { toast.error("Acceso denegado"); navigate("/"); return; }
      load();
    }
    // eslint-disable-next-line
  }, [user, loading]);

  const banUser = async (id, ban) => {
    try {
      await api.post(`/admin/users/${id}/${ban ? "ban" : "unban"}`);
      toast.success(ban ? "Usuario baneado" : "Usuario reactivado");
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const deleteListing = async (id) => {
    if (!window.confirm("¿Eliminar esta publicación?")) return;
    try {
      await api.delete(`/admin/listings/${id}`);
      toast.success("Publicación eliminada");
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const resolveReport = async (id) => {
    try {
      await api.post(`/admin/reports/${id}/resolve`);
      toast.success("Reporte resuelto");
      load();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-extrabold">Panel de Administrador</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Usuarios", stats.users],
            ["Publicaciones", stats.listings],
            ["Ofertas", stats.offers],
            ["Mensajes", stats.messages],
            ["Reportes abiertos", stats.open_reports],
            ["Baneados", stats.banned_users],
          ].map(([k, v]) => (
            <div key={k} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-xs text-gray-500">{k}</div>
              <div className="text-xl font-extrabold">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-100">
        {[["reports", "Reportes"], ["users", "Usuarios"], ["listings", "Publicaciones"]].map(([k, l]) => (
          <button key={k} data-testid={`admin-tab-${k}`} onClick={() => setTab(k)}
            className={`px-3 py-2 text-sm font-bold ${tab === k ? "border-b-2 border-[#05C46B] text-[#05C46B]" : "text-gray-500"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        reports.length === 0 ? <p className="text-center text-gray-400 py-6">Sin reportes</p> :
        reports.map((r) => (
          <div key={r.id} data-testid={`report-${r.id}`} className="bg-white border border-gray-100 rounded-2xl p-3 space-y-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-amber-600 uppercase">{r.target_type}</div>
                <div className="text-sm font-semibold">{r.target_data?.title || r.target_data?.name || r.target_id}</div>
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === "open" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{r.status}</div>
            </div>
            <p className="text-sm text-gray-700">{r.reason}</p>
            <div className="text-xs text-gray-400">Por {r.reporter_name} · {timeAgo(r.created_at)}</div>
            {r.status === "open" && (
              <div className="flex gap-2 pt-2">
                {r.target_type === "listing" && (
                  <button data-testid={`report-del-${r.id}`} onClick={() => deleteListing(r.target_id)}
                    className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full hover:bg-red-100 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Borrar publicación
                  </button>
                )}
                <button data-testid={`report-resolve-${r.id}`} onClick={() => resolveReport(r.id)}
                  className="text-xs bg-[#05C46B] text-white font-bold px-3 py-1.5 rounded-full hover:bg-[#04A057] flex items-center gap-1">
                  <FileWarning className="w-3 h-3" /> Marcar resuelto
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} data-testid={`admin-user-${u.id}`} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6FAF0] text-[#05C46B] flex items-center justify-center font-bold">
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{u.name} {u.role === "admin" && <span className="text-xs text-[#05C46B]">(admin)</span>}</div>
                <div className="text-xs text-gray-500 truncate">{u.email}</div>
              </div>
              {u.banned ? (
                <button data-testid={`admin-unban-${u.id}`} onClick={() => banUser(u.id, false)}
                  className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-full hover:bg-green-100 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Reactivar
                </button>
              ) : u.role !== "admin" && (
                <button data-testid={`admin-ban-${u.id}`} onClick={() => banUser(u.id, true)}
                  className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full hover:bg-red-100 flex items-center gap-1">
                  <ShieldOff className="w-3 h-3" /> Banear
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "listings" && (
        <div className="space-y-2">
          {listings.map((l) => (
            <div key={l.id} data-testid={`admin-listing-${l.id}`} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                {l.images?.[0] && <img src={l.images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{l.title}</div>
                <div className="text-xs text-gray-500">{formatPrice(l.price)} · {l.department}</div>
              </div>
              <button data-testid={`admin-del-listing-${l.id}`} onClick={() => deleteListing(l.id)}
                className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full hover:bg-red-100 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
