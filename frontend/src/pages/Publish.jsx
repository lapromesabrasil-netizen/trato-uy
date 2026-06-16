import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { DEPARTMENTS, CATEGORIES } from "../lib/constants";
import { toast } from "sonner";

const validCats = CATEGORIES.filter((c) => c.id !== "all");

async function fileToDataUrl(file, maxSize = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function Publish() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "tech",
    department: user?.department || "Montevideo", zone: "",
  });
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) { toast.error("Necesitás iniciar sesión para publicar"); navigate("/login"); }
  }, [user, loading, navigate]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - images.length);
    const next = [...images];
    for (const f of files) {
      try { next.push(await fileToDataUrl(f)); } catch { /* ignore */ }
    }
    setImages(next);
  };

  const removeImg = (i) => setImages(images.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (images.length === 0) { toast.error("Agregá al menos 1 foto"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/listings", {
        ...form, price: Number(form.price), images,
      });
      toast.success("¡Publicación creada!");
      navigate(`/product/${data.listing.id}`);
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-2xl font-extrabold">Publicar artículo</h1>
      <p className="text-sm text-gray-500 -mt-2">Subí fotos buenas y describí bien. ¡Más ventas garantizadas!</p>

      <form onSubmit={submit} className="space-y-4">
        {/* Photos */}
        <div>
          <label className="text-sm font-bold text-gray-700">Fotos (hasta 6)</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {images.map((src, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" data-testid={`remove-img-${i}`} onClick={() => removeImg(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <label data-testid="add-image-label" className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200">
                <Camera className="w-6 h-6" />
                <span className="text-xs mt-1">Agregar</span>
                <input data-testid="image-input" type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
              </label>
            )}
          </div>
        </div>

        <input data-testid="pub-title" required minLength={3} placeholder="Título (ej: iPhone 12 64GB negro)"
          value={form.title} onChange={(e) => update("title", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />

        <textarea data-testid="pub-desc" required minLength={10} rows={4} placeholder="Descripción detallada"
          value={form.description} onChange={(e) => update("description", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />

        <input data-testid="pub-price" required type="number" min={1} placeholder="Precio en $ (UYU)"
          value={form.price} onChange={(e) => update("price", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />

        <select data-testid="pub-category" value={form.category} onChange={(e) => update("category", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50">
          {validCats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <select data-testid="pub-dept" value={form.department} onChange={(e) => update("department", e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50">
            {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
          <input data-testid="pub-zone" required placeholder="Zona/barrio (ej: Pocitos)"
            value={form.zone} onChange={(e) => update("zone", e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        </div>

        <button data-testid="pub-submit" disabled={busy} type="submit" className="btn-orange w-full">
          {busy ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  );
}
