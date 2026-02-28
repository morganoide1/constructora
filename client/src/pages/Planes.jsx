import { useState, useEffect } from 'react';
import axios from 'axios';
import { Percent, Plus, X, Edit, Trash2, Building2, CheckCircle2, Clock } from 'lucide-react';

const emptyForm = { titulo: '', descripcion: '', descuento: '', cuotasMinimas: '1', vigenciaHasta: '', activo: true, edificio: '' };

function Planes() {
  const [planes, setPlanes] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        axios.get('/api/planes/admin'),
        axios.get('/api/edificios').catch(() => ({ data: [] }))
      ]);
      setPlanes(pRes.data);
      setEdificios(eRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (plan = null) => {
    setEditing(plan?._id || null);
    setForm(plan ? {
      titulo:        plan.titulo,
      descripcion:   plan.descripcion || '',
      descuento:     plan.descuento,
      cuotasMinimas: plan.cuotasMinimas,
      vigenciaHasta: plan.vigenciaHasta ? plan.vigenciaHasta.slice(0, 10) : '',
      activo:        plan.activo,
      edificio:      plan.edificio?._id || ''
    } : emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        titulo:        form.titulo,
        descripcion:   form.descripcion,
        descuento:     form.descuento,
        cuotasMinimas: form.cuotasMinimas,
        vigenciaHasta: form.vigenciaHasta || null,
        activo:        form.activo,
        edificio:      form.edificio || null
      };
      if (editing) {
        await axios.put(`/api/planes/${editing}`, payload);
      } else {
        await axios.post('/api/planes', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este plan?')) return;
    await axios.delete(`/api/planes/${id}`);
    fetchData();
  };

  const handleToggleActivo = async (plan) => {
    await axios.put(`/api/planes/${plan._id}`, { ...plan, activo: !plan.activo, edificio: plan.edificio?._id || null });
    fetchData();
  };

  const hoy = new Date();
  const vigente = (p) => !p.vigenciaHasta || new Date(p.vigenciaHasta) >= hoy;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Planes de Adelanto</h1>
          <p className="text-gray-500 mt-1">Descuentos por pago anticipado de cuotas</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Plan</button>
      </div>

      {planes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow border border-green-100">
          <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay planes creados. Creá el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map(p => {
            const activo = p.activo && vigente(p);
            return (
              <div key={p._id} className={`bg-white rounded-2xl shadow border overflow-hidden ${activo ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                <div className={`px-5 py-3 flex items-center justify-between ${activo ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${activo ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                      {p.descuento}%
                    </div>
                    <span className="font-semibold text-gray-800 truncate">{p.titulo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openModal(p)} className="p-1.5 hover:bg-green-100 rounded-lg text-gray-400 hover:text-green-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-2">
                  {p.descripcion && <p className="text-gray-500 text-sm">{p.descripcion}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Mínimo {p.cuotasMinimas} cuota{p.cuotasMinimas !== 1 ? 's' : ''}
                    </span>
                    {p.edificio && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        <Building2 className="w-3 h-3" /> {p.edificio.nombre}
                      </span>
                    )}
                    {!p.edificio && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">Todos los edificios</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    {p.vigenciaHasta ? (
                      <span className={`flex items-center gap-1 text-xs ${vigente(p) ? 'text-amber-600' : 'text-gray-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        Vence {new Date(p.vigenciaHasta).toLocaleDateString('es-AR')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sin vencimiento</span>
                    )}
                    <button
                      onClick={() => handleToggleActivo(p)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        p.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-800">{editing ? 'Editar Plan' : 'Nuevo Plan'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Título</label>
                <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="input-field" placeholder="Ej: Descuento por pago anticipado" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="input-field" rows="2" placeholder="Ej: Pagá 3 o más cuotas juntas y ahorrás en el total" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Descuento (%)</label>
                  <input type="number" value={form.descuento} onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))} className="input-field" placeholder="Ej: 5" min="0" max="100" step="0.5" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cuotas mínimas</label>
                  <input type="number" value={form.cuotasMinimas} onChange={e => setForm(f => ({ ...f, cuotasMinimas: e.target.value }))} className="input-field" placeholder="1" min="1" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Válido hasta (opcional)</label>
                  <input type="date" value={form.vigenciaHasta} onChange={e => setForm(f => ({ ...f, vigenciaHasta: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Edificio (opcional)</label>
                  <select value={form.edificio} onChange={e => setForm(f => ({ ...f, edificio: e.target.value }))} className="input-field">
                    <option value="">Todos</option>
                    {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="w-4 h-4 accent-green-600" />
                <span className="text-sm text-gray-700">Plan activo</span>
              </label>
              <div className="flex gap-3 pt-1">
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

export default Planes;
