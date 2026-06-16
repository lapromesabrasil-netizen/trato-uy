import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Publish from './pages/Publish';
import Messages from './pages/Messages';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Offers from './pages/Offers';
import Admin from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:listingId/:userId" element={<ChatRoom />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
