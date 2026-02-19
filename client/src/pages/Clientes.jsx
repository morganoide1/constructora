import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, X, Mail, Phone, Building2, User } from 'lucide-react';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      await axios.post('/api/auth/register', form);
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '', telefono: '', role: 'cliente' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear cliente');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Clientes</h1>
          <p className="text-white/60 mt-1">Gestión de clientes y sus propiedades</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Cliente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((c) => (
          <div key={c._id} className="card hover:border-white/20 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {c.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-white">{c.nombre}</h3>
                <p className="text-sm text-white/60">{c.email}</p>
              </div>
            </div>
            {c.telefono && (
              <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
                <Phone className="w-4 h-4" /> {c.telefono}
              </div>
            )}
            {c.propiedades?.length > 0 && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <p className="text-xs text-white/50 mb-2">PROPIEDADES ({c.propiedades.length})</p>
                {c.propiedades.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-white">{p.propiedad?.nombre || p.propiedad?.codigo}</span>
                    <div className="text-right">
                      <span className="text-emerald-400">{fmt(p.totalPagado)}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <span className="text-white/60">{fmt(p.totalPagado + p.saldoPendiente)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {clientes.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No hay clientes</h3>
          <p className="text-white/60">Crea el primer cliente para comenzar</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nuevo Cliente</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="input-field pl-12" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field pl-12" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Contraseña (para acceso al portal)</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="input-field" placeholder="Mínimo 6 caracteres" required />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="input-field pl-12" />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Crear Cliente</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
