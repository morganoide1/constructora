import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Plus, X, Edit, ExternalLink, Trash2 } from 'lucide-react';

function Beneficios() {
  const [beneficios, setBeneficios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', imagen: '', link: '', categoria: 'otro' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/beneficios/admin');
      setBeneficios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`/api/beneficios/${editing}`, form);
      } else {
        await axios.post('/api/beneficios', form);
      }
      setShowModal(false);
      setForm({ titulo: '', descripcion: '', imagen: '', link: '', categoria: 'otro' });
      setEditing(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (b) => {
    setForm({ titulo: b.titulo, descripcion: b.descripcion || '', imagen: b.imagen || '', link: b.link || '', categoria: b.categoria });
    setEditing(b._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este beneficio?')) {
      await axios.delete(`/api/beneficios/${id}`);
      fetchData();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ titulo: '', descripcion: '', imagen: '', link: '', categoria: 'otro' });
  };

  const categoriaColors = {
    descuento: 'bg-emerald-100 text-emerald-700',
    servicio: 'bg-blue-100 text-blue-700',
    experiencia: 'bg-purple-100 text-purple-700',
    otro: 'bg-gray-100 text-gray-700'
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Beneficios Cliente Wave</h1>
          <p className="text-gray-500 mt-1">Gestiona los beneficios exclusivos para clientes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Beneficio</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beneficios.map((b) => (
          <div key={b._id} className={`bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden ${!b.activo ? 'opacity-50' : ''}`}>
            {b.imagen && (
              <img src={b.imagen} alt={b.titulo} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${categoriaColors[b.categoria]}`}>
                  {b.categoria}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(b)} className="p-1 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-400" /></button>
                  <button onClick={() => handleDelete(b._id)} className="p-1 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{b.titulo}</h3>
              <p className="text-gray-500 text-sm mb-3">{b.descripcion}</p>
              {b.link && (
                <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Ver más
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {beneficios.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay beneficios</h3>
          <p className="text-gray-500">Crea el primer beneficio para tus clientes</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editing ? 'Editar Beneficio' : 'Nuevo Beneficio'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Título</label>
                <input type="text" value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} className="input-field" placeholder="Ej: 20% en Muebles" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} className="input-field" rows="3" placeholder="Describe el beneficio..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">URL Imagen</label>
                <input type="url" value={form.imagen} onChange={(e) => setForm({...form, imagen: e.target.value})} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Link (opcional)</label>
                <input type="url" value={form.link} onChange={(e) => setForm({...form, link: e.target.value})} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Categoría</label>
                <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="input-field">
                  <option value="descuento">Descuento</option>
                  <option value="servicio">Servicio</option>
                  <option value="experiencia">Experiencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">{editing ? 'Guardar Cambios' : 'Crear Beneficio'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Beneficios;
