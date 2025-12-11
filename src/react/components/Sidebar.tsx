import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  currentPath?: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profile) setUser(profile);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/menu', label: 'Gestión del Menú', icon: '🍽️' },
    { path: '/admin/mesas', label: 'Mesas (POS)', icon: '🪑' },
    { path: '/admin/stock', label: 'Gestión de Stock', icon: '📦' },
    { path: '/admin/ingredientes', label: 'Ingredientes', icon: '🥕' },
    { path: '/admin/recetas', label: 'Recetas', icon: '📝' },
    { path: '/admin/compras', label: 'Compras', icon: '🛒' },
    { path: '/admin/ordenes', label: 'Órdenes', icon: '📋' },
    { path: '/admin/menu-imprimible', label: 'Menú Imprimible', icon: '🖨️' },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">Restaurant Admin</h1>
        <p className="text-sm text-slate-400 mt-1">{user?.name || user?.email}</p>
        <p className="text-xs text-slate-500 mt-1 capitalize">{user?.role}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <a
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

