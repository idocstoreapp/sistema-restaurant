import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import KpiCard from './components/KpiCard';
import { formatCLP } from '@/lib/currency';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    ventasHoy: 0,
    ordenesPendientes: 0,
    mesasOcupadas: 0,
    gastosMes: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Verificar autenticación
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          window.location.href = '/admin/login';
          return;
        }

        // Obtener perfil de usuario
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(profile);
        }

        // Cargar KPIs básicos
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Ventas de hoy
        const { data: ordenesHoy } = await supabase
          .from('ordenes_restaurante')
          .select('total')
          .eq('estado', 'paid')
          .gte('created_at', hoy.toISOString());

        const ventasHoy = ordenesHoy?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

        // Órdenes pendientes
        const { count: ordenesPendientes } = await supabase
          .from('ordenes_restaurante')
          .select('*', { count: 'exact', head: true })
          .in('estado', ['pending', 'preparing', 'ready']);

        // Mesas ocupadas
        const { count: mesasOcupadas } = await supabase
          .from('mesas')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'ocupada');

        // Gastos del mes
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const { data: gastosMes } = await supabase
          .from('small_expenses')
          .select('monto')
          .gte('fecha', inicioMes.toISOString().split('T')[0]);

        const { data: gastosGenerales } = await supabase
          .from('general_expenses')
          .select('monto')
          .gte('fecha', inicioMes.toISOString().split('T')[0]);

        const totalGastos = 
          (gastosMes?.reduce((sum, g) => sum + (g.monto || 0), 0) || 0) +
          (gastosGenerales?.reduce((sum, g) => sum + (g.monto || 0), 0) || 0);

        setKpis({
          ventasHoy,
          ordenesPendientes: ordenesPendientes || 0,
          mesasOcupadas: mesasOcupadas || 0,
          gastosMes: totalGastos,
        });
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-slate-900">Panel Administrativo</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Ventas de Hoy"
            value={formatCLP(kpis.ventasHoy)}
            icon="💰"
          />
          <KpiCard
            title="Órdenes Pendientes"
            value={kpis.ordenesPendientes}
            icon="📋"
          />
          <KpiCard
            title="Mesas Ocupadas"
            value={kpis.mesasOcupadas}
            icon="🪑"
          />
          <KpiCard
            title="Gastos del Mes"
            value={formatCLP(kpis.gastosMes)}
            icon="💸"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Accesos Rápidos</h2>
            <div className="space-y-3">
              <a
                href="/admin/mesas"
                className="block p-4 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪑</span>
                  <div>
                    <div className="font-semibold">Mesas (POS)</div>
                    <div className="text-sm text-slate-600">Gestionar mesas y crear órdenes</div>
                  </div>
                </div>
              </a>
              <a
                href="/admin/stock"
                className="block p-4 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <div className="font-semibold">Gestión de Stock</div>
                    <div className="text-sm text-slate-600">Ver y ajustar inventario</div>
                  </div>
                </div>
              </a>
              <a
                href="/admin/ingredientes"
                className="block p-4 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥕</span>
                  <div>
                    <div className="font-semibold">Ingredientes</div>
                    <div className="text-sm text-slate-600">Administrar ingredientes</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Órdenes Recientes</h2>
            <div className="text-sm text-slate-600">
              Las órdenes recientes aparecerán aquí
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

