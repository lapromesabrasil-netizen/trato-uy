import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatApiError } from "../lib/api";
import { DEPARTMENTS } from "../lib/constants";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "Montevideo", age_confirmed: false });
  const [busy, setBusy] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.age_confirmed) { toast.error("Confirmá que sos mayor de 18 años"); return; }
    setBusy(true);
    try {
      await register(form);
      toast.success("¡Cuenta creada!");
      navigate("/");
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-sm mx-auto pt-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Sumate a Trato<span className="text-[#05C46B]">UY</span></h1>
      <p className="text-gray-500 mt-2">Comprá y vendé fácil, cerca tuyo.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input data-testid="reg-name" required minLength={2} placeholder="Nombre completo"
          value={form.name} onChange={(e) => update("name", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        <input data-testid="reg-email" required type="email" placeholder="Email"
          value={form.email} onChange={(e) => update("email", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        <input data-testid="reg-password" required type="password" minLength={6} placeholder="Contraseña (mín. 6)"
          value={form.password} onChange={(e) => update("password", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        <select data-testid="reg-dept" value={form.department} onChange={(e) => update("department", e.target.value)}
          className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50">
          {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
        <label className="flex items-start gap-2 text-sm text-gray-600 py-2 cursor-pointer">
          <input data-testid="reg-age" type="checkbox" checked={form.age_confirmed} onChange={(e) => update("age_confirmed", e.target.checked)}
            className="mt-1 accent-[#05C46B] w-4 h-4" />
          <span>Confirmo que soy mayor de 18 años y acepto las normas de TratoUY.</span>
        </label>
        <button data-testid="reg-submit" disabled={busy} type="submit" className="btn-mint w-full">
          {busy ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4 text-center">
        ¿Ya tenés cuenta? <Link data-testid="go-login" to="/login" className="text-[#05C46B] font-bold">Ingresar</Link>
      </p>
    </div>
  );
}
