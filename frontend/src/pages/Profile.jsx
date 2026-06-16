import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { timeAgo, formatPrice } from "../lib/constants";
import { toast } from "sonner";

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [u, setU] = useState(null);
  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [tab, setTab] = useState("listings");

  useEffect(() => {
    (async () => {
      try {
        const [usr, lst, rts] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/users/${id}/listings`),
          api.get(`/users/${id}/ratings`),
        ]);
        setU(usr.data.user);
        setListings(lst.data.listings || []);
        setRatings(rts.data.ratings || []);
      } catch (e) { toast.error(formatApiError(e)); }
    })();
  }, [id]);

  if (!u) return <div className="text-center py-10 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-4 bg-gradient-to-br from-[#E6FAF0] to-white rounded-2xl p-5 border border-[#05C46B]/20">
        <div className="w-20 h-20 rounded-full bg-[#05C46B] text-white flex items-center justify-center text-3xl font-extrabold">
          {u.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">{u.name}</h1>
          {u.department && (<div className="text-sm text-gray-600 flex items-center gap-1 mt-0.5"><MapPin className="w-4 h-4" /> {u.department}</div>)}
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(u.rating_avg || 0) ? "fill-[#FFB400] text-[#FFB400]" : "text-gray-300"}`} />
            ))}
            <span className="text-xs text-gray-600 ml-1">{u.rating_avg?.toFixed(1) || "0.0"} ({u.rating_count})</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-100">
        <button data-testid="tab-listings" onClick={() => setTab("listings")}
          className={`px-4 py-2 text-sm font-bold ${tab === "listings" ? "border-b-2 border-[#05C46B] text-[#05C46B]" : "text-gray-500"}`}>
          Publicaciones ({listings.length})
        </button>
        <button data-testid="tab-reviews" onClick={() => setTab("reviews")}
          className={`px-4 py-2 text-sm font-bold ${tab === "reviews" ? "border-b-2 border-[#05C46B] text-[#05C46B]" : "text-gray-500"}`}>
          Reseñas ({ratings.length})
        </button>
      </div>

      {tab === "listings" ? (
        listings.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin publicaciones aún</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((it) => (
              <Link key={it.id} to={`/product/${it.id}`} className="product-card bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-100">
                  {it.images?.[0] && <img src={it.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-2">
                  <div className="font-bold text-sm">{formatPrice(it.price)}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{it.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        ratings.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin reseñas aún</p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{r.buyer_name}</div>
                  <div className="text-xs text-gray-400">{timeAgo(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= r.stars ? "fill-[#FFB400] text-[#FFB400]" : "text-gray-300"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-700 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {me && me.id === u.id && (
        <Link to="/publish" data-testid="profile-publish" className="btn-orange w-full block text-center">+ Publicar nuevo artículo</Link>
      )}
    </div>
  );
}
