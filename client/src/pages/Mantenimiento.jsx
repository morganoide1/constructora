import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wrench, Plus, X, Edit, Trash2, Building2, ImagePlus } from 'lucide-react';

const TIPOS = ['limpieza', 'mantenimiento', 'reparacion', 'inspeccion', 'otro'];
const TIPO_COLORS = {
  limpieza:     'bg-blue-100 text-blue-700',
  mantenimiento:'bg-amber-100 text-amber-700',
  reparacion:   'bg-rose-100 text-rose-700',
  inspeccion:   'bg-purple-100 text-purple-700',
  otro:         'bg-gray-100 text-gray-700'
};

const emptyForm = { edificio: '', tipo: 'mantenimiento', titulo: '', descripcion: '', fecha: new Date().toISOString().slice(0,10), imagen: null };

function Mantenimiento() {
  const [registros, setRegistros] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filtroEdificio, setFiltroEdificio] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regRes, edRes] = await Promise.all([
        axios.get('/api/mantenimiento/admin'),
        axios.get('/api/edificios').catch(() => ({ data: [] }))
      ]);
      setRegistros(regRes.data);
      setEdificios(edRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (reg = null) => {
    setEditing(reg?._id || null);
    setForm(reg
      ? { edificio: reg.edificio?._id || '', tipo: reg.tipo, titulo: reg.titulo, descripcion: reg.descripcion || '', fecha: reg.fecha?.slice(0,10) || '', imagen: null }
      : emptyForm
    );
    setPreview(reg?.imagen || null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('edificio',    form.edificio);
      fd.append('tipo',        form.tipo);
      fd.append('titulo',      form.titulo);
      fd.append('descripcion', form.descripcion);
      fd.append('fecha',       form.fecha);
      if (form.imagen) fd.append('imagen', form.imagen);

      if (editing) {
        await axios.put(`/api/mantenimiento/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/mantenimiento', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await axios.delete(`/api/mantenimiento/${id}`);
    fetchData();
  };

  const filtrados = filtroEdificio ? registros.filter(r => r.edificio?._id === filtroEdificio) : registros;

  // Agrupar por edificio para la vista
  const agrupados = filtrados.reduce((acc, r) => {
    const key = r.edificio?._id || 'sin';
    const label = r.edificio?.nombre || 'Sin edificio';
    if (!acc[key]) acc[key] = { label, items: [] };
    acc[key].items.push(r);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Mantenimiento</h1>
          <p className="text-gray-500 mt-1">Historial de limpieza y mantenimiento por edificio</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Registro</button>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3">
        <select value={filtroEdificio} onChange={e => setFiltroEdificio(e.target.value)} className="input-field max-w-xs">
          <option value="">Todos los edificios</option>
          {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
        </select>
        <span className="text-sm text-gray-400">{filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Lista agrupada por edificio */}
      {Object.keys(agrupados).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow border border-green-100">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Sin registros. Crea el primero.</p>
        </div>
      ) : (
        Object.entries(agrupados).map(([key, grupo]) => (
          <div key={key} className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
            <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-gray-800">{grupo.label}</span>
              <span className="text-xs text-gray-400 ml-1">{grupo.items.length} entrada{grupo.items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {grupo.items.map(r => (
                <div key={r._id} className="flex items-start gap-4 px-6 py-4">
                  {/* Imagen miniatura */}
                  {r.imagen ? (
                    <a href={r.imagen} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={r.imagen} alt={r.titulo} className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                    </a>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[r.tipo]}`}>{r.tipo}</span>
                      <span className="text-xs text-gray-400">{new Date(r.fecha).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric', timeZone:'UTC' })}</span>
                      <span className="text-xs text-gray-300 ml-auto">por {r.creadoPor?.nombre}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{r.titulo}</p>
                    {r.descripcion && <p className="text-gray-500 text-sm mt-0.5">{r.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openModal(r)} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-800">{editing ? 'Editar Registro' : 'Nuevo Registro'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Edificio</label>
                <select value={form.edificio} onChange={e => setForm(f => ({ ...f, edificio: e.target.value }))} className="input-field" required>
                  <option value="">-- Seleccionar --</option>
                  {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="input-field">
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Título</label>
                <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="input-field" placeholder="Ej: Limpieza general de tanque" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="input-field" rows="2" placeholder="Detalles del trabajo realizado..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Imagen (opcional)</label>
                {preview && !form.imagen && (
                  <img src={preview} alt="preview" className="w-full object-contain rounded-xl mb-2 bg-gray-50 border border-gray-100" style={{ maxHeight: 140 }} />
                )}
                {form.imagen && (
                  <img src={URL.createObjectURL(form.imagen)} alt="preview" className="w-full object-contain rounded-xl mb-2 bg-gray-50 border border-gray-100" style={{ maxHeight: 140 }} />
                )}
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-gray-300 rounded-xl hover:border-green-400 text-sm text-gray-500 hover:text-green-600 transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {form.imagen ? form.imagen.name : 'Elegir imagen'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setForm(f => ({ ...f, imagen: e.target.files[0] || null }))} />
                </label>
              </div>
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

export default Mantenimiento;
