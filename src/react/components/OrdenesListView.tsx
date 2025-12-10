import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCLP } from '@/lib/currency';

interface Orden {
  id: string;
  numero_orden: string;
  mesa_id?: string;
  estado: string;
  total: number;
  metodo_pago?: string;
  created_at: string;
  paid_at?: string;
  mesas?: { numero: number };
  users?: { name: string };
}

export default function OrdenesListView() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroFecha, setFiltroFecha] = useState<string>('today');

  useEffect(() => {
    loadOrdenes();
  }, [filtroEstado, filtroFecha]);

  async function loadOrdenes() {
    try {
      setLoading(true);
      let query = supabase
        .from('ordenes_restaurante')
        .select(`
          *,
          mesas(numero),
          users!ordenes_restaurante_mesero_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      // Filtro por estado
      if (filtroEstado !== 'all') {
        query = query.eq('estado', filtroEstado);
      }

      // Filtro por fecha
      if (filtroFecha === 'today') {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        query = query.gte('created_at', hoy.toISOString());
      } else if (filtroFecha === 'week') {
        const semana = new Date();
        semana.setDate(semana.getDate() - 7);
        query = query.gte('created_at', semana.toISOString());
      } else if (filtroFecha === 'month') {
        const mes = new Date();
        mes.setDate(1);
        mes.setHours(0, 0, 0, 0);
        query = query.gte('created_at', mes.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setOrdenes(data || []);
    } catch (error: any) {
      alert('Error cargando órdenes: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getEstadoColor(estado: string) {
    switch (estado) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'served':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const totalVentas = ordenes
    .filter((o) => o.estado === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Cargando órdenes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
        <div className="text-lg font-semibold text-green-600">
          Total Ventas: {formatCLP(totalVentas)}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filtro por Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="preparing">En Preparación</option>
              <option value="ready">Listas</option>
              <option value="served">Servidas</option>
              <option value="paid">Pagadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filtro por Fecha</label>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="today">Hoy</option>
              <option value="week">Última Semana</option>
              <option value="month">Este Mes</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Orden</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mesa</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mesero</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Pago</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ordenes.map((orden) => (
              <tr key={orden.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium">{orden.numero_orden}</td>
                <td className="px-4 py-3 text-sm">
                  {orden.mesas ? `Mesa ${orden.mesas.numero}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm">{orden.users?.name || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(orden.created_at).toLocaleString('es-CL')}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {formatCLP(orden.total)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getEstadoColor(
                      orden.estado
                    )}`}
                  >
                    {orden.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {orden.metodo_pago || '-'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/admin/ordenes/${orden.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordenes.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No hay órdenes con los filtros seleccionados
        </div>
      )}
    </div>
  );
}

