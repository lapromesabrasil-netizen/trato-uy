import {
  Smartphone, ChefHat, Sofa, Shirt, Wrench, Package, Grid3X3,
} from "lucide-react";

export const DEPARTMENTS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
  "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
  "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

export const CATEGORIES = [
  { id: "all", name: "Todo", icon: Grid3X3 },
  { id: "furniture", name: "Muebles y Hogar", icon: Sofa },
  { id: "tech", name: "Electrónica", icon: Smartphone },
  { id: "vehicles", name: "Vehículos y Repuestos", icon: Package },
  { id: "fashion", name: "Ropa y Moda", icon: Shirt },
  { id: "kids", name: "Bebés y Niños", icon: ChefHat },
  { id: "sports", name: "Deportes y Camping", icon: Wrench },
  { id: "services", name: "Servicios Profesionales", icon: Package },
  { id: "others", name: "Otros", icon: Package }
];

export const CATEGORY_NAMES = {
  furniture: "Muebles y Hogar",
  tech: "Electrónica y Celulares",
  vehicles: "Vehículos y Autopartes",
  fashion: "Ropa y Moda de Segunda Mano",
  kids: "Artículos para Bebés y Niños",
  sports: "Deportes y Actividades",
  services: "Servicios Profesionales Locales",
  others: "Otros Productos"
};

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (diff < 60) return `Hace ${diff}s`;
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} d`;
}

export function formatPrice(p) {
  if (p == null) return "";
  return `$ ${Number(p).toLocaleString("es-UY")}`;
}
