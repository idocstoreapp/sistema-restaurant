import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCLP } from '@/lib/currency';

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada';
  ubicacion: string;
}

interface Orden {
  id: string;
  numero_orden: string;
  mesa_id: string;
  estado: string;
  total: number;
  created_at: string;
}

export default function MesasView() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [showOrdenForm, setShowOrdenForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [mesasRes, ordenesRes] = await Promise.all([
        supabase.from('mesas').select('*').order('numero'),
        supabase
          .from('ordenes_restaurante')
          .select('*')
          .in('estado', ['pending', 'preparing', 'ready'])
          .order('created_at', { ascending: false }),
      ]);

      if (mesasRes.data) setMesas(mesasRes.data);
      if (ordenesRes.data) setOrdenes(ordenesRes.data);

      // Actualizar estado de mesas según órdenes activas
      if (mesasRes.data && ordenesRes.data) {
        const mesasConOrden = new Set(ordenesRes.data.map((o) => o.mesa_id));
        const mesasActualizadas = mesasRes.data.map((m) => ({
          ...m,
          estado: mesasConOrden.has(m.id) ? ('ocupada' as const) : ('libre' as const),
        }));
        setMesas(mesasActualizadas);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMesaOrden(mesaId: string) {
    return ordenes.find((o) => o.mesa_id === mesaId);
  }

  function getEstadoColor(estado: string) {
    switch (estado) {
      case 'libre':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ocupada':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reservada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  function handleMesaClick(mesa: Mesa) {
    const orden = getMesaOrden(mesa.id);
    if (orden) {
      // Abrir orden existente
      window.location.href = `/admin/ordenes/${orden.id}`;
    } else {
      // Crear nueva orden
      setSelectedMesa(mesa);
      setShowOrdenForm(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mesas (POS)</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesas.map((mesa) => {
          const orden = getMesaOrden(mesa.id);
          return (
            <button
              key={mesa.id}
              onClick={() => handleMesaClick(mesa)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                orden
                  ? 'border-red-300 bg-red-50'
                  : 'border-green-300 bg-green-50 hover:border-green-400'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">🪑</div>
                <div className="font-semibold text-lg">Mesa {mesa.numero}</div>
                <div className="text-sm text-slate-600 mt-1">
                  Capacidad: {mesa.capacidad}
                </div>
                <div
                  className={`mt-2 px-2 py-1 rounded text-xs font-medium border ${getEstadoColor(
                    orden ? 'ocupada' : mesa.estado
                  )}`}
                >
                  {orden ? 'Ocupada' : 'Libre'}
                </div>
                {orden && (
                  <div className="mt-2 text-sm font-semibold text-red-700">
                    {formatCLP(orden.total)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showOrdenForm && selectedMesa && (
        <OrdenFormModal
          mesa={selectedMesa}
          onClose={() => {
            setShowOrdenForm(false);
            setSelectedMesa(null);
          }}
          onSaved={() => {
            setShowOrdenForm(false);
            setSelectedMesa(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Modal para crear nueva orden
function OrdenFormModal({
  mesa,
  onClose,
  onSaved,
}: {
  mesa: Mesa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCreateOrden() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('No estás autenticado');
        return;
      }

      // Generar número de orden único
      const timestamp = Date.now();
      const numeroOrden = `ORD-${timestamp}`;

      const { data: orden, error } = await supabase
        .from('ordenes_restaurante')
        .insert({
          numero_orden: numeroOrden,
          mesa_id: mesa.id,
          mesero_id: user.id,
          estado: 'pending',
          total: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado de mesa
      await supabase
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', mesa.id);

      window.location.href = `/admin/ordenes/${orden.id}`;
    } catch (error: any) {
      alert('Error creando orden: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Crear Orden - Mesa {mesa.numero}</h2>
        <p className="text-slate-600 mb-6">
          ¿Deseas crear una nueva orden para esta mesa?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateOrden}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </div>
    </div>
  );
}

