import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, X, Phone, Edit } from 'lucide-react';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', role: 'cliente' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await axios.put(`/api/clientes/${editingCliente}`, form);
      } else {
        await axios.post('/api/auth/register', form);
      }
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '', telefono: '', role: 'cliente' });
      setEditingCliente(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar cliente');
    }
  };

  const handleEditCliente = (cliente) => {
    setForm({ nombre: cliente.nombre, email: cliente.email, password: '', telefono: cliente.telefono || '', role: cliente.role });
    setEditingCliente(cliente._id);
    setShowModal(true);
  };

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestión de clientes y sus propiedades</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Cliente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((c) => (
          <div key={c._id} className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {c.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{c.nombre}</h3>
                  <button onClick={() => handleEditCliente(c)} className="p-1 hover:bg-green-50 rounded"><Edit className="w-4 h-4 text-gray-400" /></button>
                </div>
                <p className="text-sm text-gray-500">{c.email}</p>
              </div>
            </div>
            {c.telefono && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <Phone className="w-4 h-4" /> {c.telefono}
              </div>
            )}
            {c.propiedades?.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs text-gray-400 mb-2">PROPIEDADES ({c.propiedades.length})</p>
                {c.propiedades.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700">{p.propiedad?.nombre || p.propiedad?.codigo}</span>
                    <div className="text-right">
                      <span className="text-emerald-600">{fmt(p.totalPagado)}</span>
                      <span className="text-gray-300 mx-1">/</span>
                      <span className="text-gray-500">{fmt(p.totalPagado + p.saldoPendiente)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {clientes.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay clientes</h3>
          <p className="text-gray-500">Crea el primer cliente para comenzar</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => { setShowModal(false); setEditingCliente(null); setForm({ nombre: '', email: '', password: '', telefono: '', role: 'cliente' }); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Nombre completo</label>
                <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="input-field" placeholder="Juan Pérez" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" placeholder="juan@email.com" required />
              </div>
              {!editingCliente && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Contraseña</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" placeholder="••••••••" required />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Teléfono</label>
                <input type="tel" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="input-field" placeholder="+54 11 1234-5678" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">{editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
