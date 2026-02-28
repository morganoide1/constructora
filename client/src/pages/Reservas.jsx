import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, X, Edit, Trash2, Building2, Users } from 'lucide-react';

function Reservas() {
  const [tab, setTab] = useState('espacios');
  const [espacios, setEspacios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', capacidad: '', edificio: '' });
  const [filtroEdificio, setFiltroEdificio] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [espRes, resRes, edRes] = await Promise.all([
        axios.get('/api/espacios/admin'),
        axios.get('/api/reservas/admin'),
        axios.get('/api/edificios').catch(() => ({ data: [] }))
      ]);
      setEspacios(espRes.data);
      setReservas(resRes.data);
      setEdificios(edRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservas = async () => {
    try {
      const params = filtroEdificio ? { edificio: filtroEdificio } : {};
      const res = await axios.get('/api/reservas/admin', { params });
      setReservas(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { if (tab === 'reservas') fetchReservas(); }, [filtroEdificio]);

  const openModal = (espacio = null) => {
    setEditing(espacio);
    setForm(espacio
      ? { nombre: espacio.nombre, descripcion: espacio.descripcion || '', capacidad: espacio.capacidad || '', edificio: espacio.edificio?._id || '' }
      : { nombre: '', descripcion: '', capacidad: '', edificio: '' }
    );
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nombre: form.nombre, descripcion: form.descripcion, capacidad: form.capacidad || undefined, edificio: form.edificio };
      if (editing) {
        await axios.put(`/api/espacios/${editing._id}`, payload);
      } else {
        await axios.post('/api/espacios', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este espacio?')) return;
    await axios.delete(`/api/espacios/${id}`);
    fetchData();
  };

  const handleCancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await axios.delete(`/api/reservas/${id}`);
    fetchData();
  };

  const fmtFecha = (fecha) => new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

  // Agrupar espacios por edificio
  const espaciosPorEdificio = espacios.reduce((acc, esp) => {
    const key = esp.edificio?._id || 'sin-edificio';
    const label = esp.edificio?.nombre || 'Sin edificio';
    if (!acc[key]) acc[key] = { label, items: [] };
    acc[key].items.push(esp);
    return acc;
  }, {});

  const reservasFiltradas = filtroEdificio
    ? reservas.filter(r => r.edificio?._id === filtroEdificio)
    : reservas;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100"><Calendar className="w-6 h-6 text-green-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
            <p className="text-gray-500">Espacios comunes y reservas</p>
          </div>
        </div>
        {tab === 'espacios' && (
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Espacio
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['espacios', 'reservas'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'reservas') fetchReservas(); }}
            className={`px-5 py-2.5 font-medium text-sm capitalize transition-all border-b-2 -mb-px ${
              tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'espacios' ? 'Espacios' : 'Reservas'}
          </button>
        ))}
      </div>

      {/* Tab Espacios */}
      {tab === 'espacios' && (
        <div className="space-y-6">
          {Object.keys(espaciosPorEdificio).length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow border border-green-100">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay espacios creados. Crea el primero.</p>
            </div>
          )}
          {Object.entries(espaciosPorEdificio).map(([key, grupo]) => (
            <div key={key} className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">{grupo.label}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {grupo.items.map(esp => (
                  <div key={esp._id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{esp.nombre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {esp.descripcion && <p className="text-sm text-gray-500">{esp.descripcion}</p>}
                        {esp.capacidad && <span className="text-xs text-gray-400">Cap: {esp.capacidad}</span>}
                        {!esp.activo && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactivo</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(esp)} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(esp._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Reservas */}
      {tab === 'reservas' && (
        <div className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <select
              value={filtroEdificio}
              onChange={e => setFiltroEdificio(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Todos los edificios</option>
              {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
            </select>
          </div>
          {reservasFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay reservas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Espacio</th>
                    <th className="px-6 py-3 text-left">Edificio</th>
                    <th className="px-6 py-3 text-left">Cliente</th>
                    <th className="px-6 py-3 text-left">Fecha</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-left">Notas</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservasFiltradas.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{r.espacio?.nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{r.edificio?.nombre}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{r.cliente?.nombre}</p>
                        <p className="text-gray-400 text-xs">{r.cliente?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{fmtFecha(r.fecha)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>{r.estado}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{r.notas}</td>
                      <td className="px-6 py-4">
                        {r.estado === 'confirmada' && (
                          <button onClick={() => handleCancelarReserva(r._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Espacio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editing ? 'Editar Espacio' : 'Nuevo Espacio'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Edificio</label>
                <select value={form.edificio} onChange={e => setForm({ ...form, edificio: e.target.value })} className="input-field" required>
                  <option value="">-- Seleccionar --</option>
                  {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Parrilla, SUM, Quincho..." required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="input-field" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Capacidad (personas)</label>
                <input type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} className="input-field" placeholder="Opcional" min="1" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary justify-center">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary justify-center">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservas;
