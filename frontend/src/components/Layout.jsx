import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, Plus, Tag, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const onLogout = async () => { await logout(); navigate("/"); };

  const hideBottom = ["/login", "/register"].includes(loc.pathname);

  return (
    <div className="App min-h-screen bg-white pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#05C46B] flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">Trato<span className="text-[#05C46B]">UY</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" data-testid="admin-link" className="text-sm font-semibold text-[#05C46B] hover:underline px-2 hidden sm:flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <Link to={`/profile/${user.id}`} data-testid="profile-link" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-2">
                  {user.name.split(" ")[0]}
                </Link>
                <button onClick={onLogout} data-testid="logout-btn" className="text-sm text-gray-500 hover:text-gray-900 p-2" title="Salir">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="header-login" className="text-sm font-semibold text-gray-700 px-3 py-1.5 hover:text-[#05C46B]">Ingresar</Link>
                <Link to="/register" data-testid="header-register" className="text-sm font-bold text-white bg-[#05C46B] hover:bg-[#04A057] px-4 py-1.5 rounded-full">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 fade-in">{children}</main>

      {/* Bottom nav */}
      {!hideBottom && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 h-16">
          <div className="max-w-3xl mx-auto h-full px-4 flex items-center justify-around relative">
            <Link to="/" data-testid="nav-home" className={`flex flex-col items-center gap-0.5 text-xs ${loc.pathname === "/" ? "text-[#05C46B]" : "text-gray-500"}`}>
              <Home className="w-5 h-5" /> Inicio
            </Link>
            <Link to="/messages" data-testid="nav-messages" className={`flex flex-col items-center gap-0.5 text-xs ${loc.pathname.startsWith("/messages") ? "text-[#05C46B]" : "text-gray-500"}`}>
              <MessageCircle className="w-5 h-5" /> Chat
            </Link>
            <Link to="/publish" data-testid="nav-publish"
              className="relative -top-4 w-14 h-14 rounded-full bg-[#FF6B00] hover:bg-[#E65A00] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 active:scale-95 transition">
              <Plus className="w-7 h-7" strokeWidth={3} />
            </Link>
            <Link to="/offers" data-testid="nav-offers" className={`flex flex-col items-center gap-0.5 text-xs ${loc.pathname === "/offers" ? "text-[#05C46B]" : "text-gray-500"}`}>
              <Tag className="w-5 h-5" /> Ofertas
            </Link>
            <Link to={user ? `/profile/${user.id}` : "/login"} data-testid="nav-profile" className={`flex flex-col items-center gap-0.5 text-xs ${loc.pathname.startsWith("/profile") ? "text-[#05C46B]" : "text-gray-500"}`}>
              <User className="w-5 h-5" /> Perfil
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
