import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCLP } from '@/lib/currency';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id?: number;
}

interface OrdenItem {
  id?: string;
  menu_item_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  menu_item?: MenuItem;
}

interface Orden {
  id: string;
  numero_orden: string;
  mesa_id: string;
  estado: string;
  total: number;
  nota?: string;
}

interface OrdenFormProps {
  ordenId: string;
}

export default function OrdenForm({ ordenId }: OrdenFormProps) {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [items, setItems] = useState<OrdenItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);

  useEffect(() => {
    loadData();
  }, [ordenId]);

  async function loadData() {
    try {
      // Cargar orden
      const { data: ordenData, error: ordenError } = await supabase
        .from('ordenes_restaurante')
        .select('*')
        .eq('id', ordenId)
        .single();

      if (ordenError) throw ordenError;
      setOrden(ordenData);

      // Cargar items de la orden
      const { data: itemsData, error: itemsError } = await supabase
        .from('orden_items')
        .select('*, menu_items(*)')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(
        itemsData?.map((item: any) => ({
          id: item.id,
          menu_item_id: item.menu_item_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          notas: item.notas,
          menu_item: item.menu_items,
        })) || []
      );

      // Cargar categorías
      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catsData) setCategories(catsData);

      // Cargar items del menú con categorías
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (menuData) setMenuItems(menuData);
    } catch (error: any) {
      alert('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addItem(menuItem: MenuItem) {
    try {
      const existingItem = items.find((i) => i.menu_item_id === menuItem.id);

      if (existingItem) {
        // Actualizar cantidad
        const newCantidad = existingItem.cantidad + 1;
        const newSubtotal = newCantidad * existingItem.precio_unitario;

        const { error } = await supabase
          .from('orden_items')
          .update({
            cantidad: newCantidad,
            subtotal: newSubtotal,
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Crear nuevo item
        const { data, error } = await supabase
          .from('orden_items')
          .insert({
            orden_id: ordenId,
            menu_item_id: menuItem.id,
            cantidad: 1,
            precio_unitario: menuItem.price,
            subtotal: menuItem.price,
          })
          .select()
          .single();

        if (error) throw error;
      }

      await loadData();
    } catch (error: any) {
      alert('Error agregando item: ' + error.message);
    }
  }

  async function updateItemCantidad(itemId: string, cantidad: number) {
    if (cantidad <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newSubtotal = cantidad * item.precio_unitario;

      const { error } = await supabase
        .from('orden_items')
        .update({
          cantidad,
          subtotal: newSubtotal,
        })
        .eq('id', itemId);

      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Error actualizando item: ' + error.message);
    }
  }

  async function removeItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('orden_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Error eliminando item: ' + error.message);
    }
  }

  async function updateEstado(nuevoEstado: string) {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('ordenes_restaurante')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId);

      if (error) throw error;
      await loadData();
    } catch (error: any) {
      alert('Error actualizando estado: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function pagarOrden() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('No estás autenticado');
        return;
      }

      const metodoPago = prompt('Método de pago (EFECTIVO/TARJETA/TRANSFERENCIA):');
      if (!metodoPago) return;

      const { error } = await supabase
        .from('ordenes_restaurante')
        .update({
          estado: 'paid',
          metodo_pago: metodoPago.toUpperCase(),
          paid_at: new Date().toISOString(),
        })
        .eq('id', ordenId);

      if (error) throw error;

      // Liberar mesa
      if (orden?.mesa_id) {
        await supabase
          .from('mesas')
          .update({ estado: 'libre' })
          .eq('id', orden.mesa_id);
      }

      alert('Orden pagada exitosamente');
      window.location.href = '/admin/mesas';
    } catch (error: any) {
      alert('Error pagando orden: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredMenuItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => {
          const category = categories.find((c) => c.slug === selectedCategory);
          return category && item.category_id === category.id;
        });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Cargando orden...</div>
      </div>
    );
  }

  if (!orden) {
    return <div className="p-6">Orden no encontrada</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Orden: {orden.numero_orden}
          </h1>
          <p className="text-slate-600 mt-1">
            Estado: <span className="font-semibold capitalize">{orden.estado}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updateEstado('preparing')}
            disabled={orden.estado !== 'pending' || saving}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            En Preparación
          </button>
          <button
            onClick={() => updateEstado('ready')}
            disabled={orden.estado !== 'preparing' || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Lista
          </button>
          <button
            onClick={pagarOrden}
            disabled={orden.estado === 'paid' || saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Pagar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menú de items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Agregar Items</h2>

            {/* Filtro de categorías */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid de items */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="p-3 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 text-left"
                >
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {formatCLP(item.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de orden */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumen de Orden</h2>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay items en la orden</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-2 border-b border-slate-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.menu_item?.name || 'Item'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            updateItemCantidad(item.id!, item.cantidad - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm w-8 text-center">{item.cantidad}</span>
                        <button
                          onClick={() =>
                            updateItemCantidad(item.id!, item.cantidad + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id!)}
                          className="ml-2 text-red-600 hover:text-red-800 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatCLP(item.subtotal)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-300 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{formatCLP(orden.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

