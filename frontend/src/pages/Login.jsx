import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatApiError } from "../lib/api";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("¡Bienvenido!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-sm mx-auto pt-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Ingresá a Trato<span className="text-[#05C46B]">UY</span></h1>
      <p className="text-gray-500 mt-2">Bienvenido de vuelta al marketplace local de Uruguay.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        <input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña" className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#05C46B]/50" />
        <button data-testid="login-submit" disabled={busy} type="submit" className="btn-mint w-full">
          {busy ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4 text-center">
        ¿No tenés cuenta? <Link data-testid="go-register" to="/register" className="text-[#05C46B] font-bold">Crear cuenta</Link>
      </p>
    </div>
  );
}
