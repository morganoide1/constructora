import { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Plus, X, Edit, Trash2, ThumbsUp, Globe, Building2 } from 'lucide-react';

function Anuncios() {
  const [anuncios, setAnuncios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', contenido: '', imagen: '', edificio: '', imagenFile: null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [anunciosRes, edificiosRes] = await Promise.all([
        axios.get('/api/anuncios/admin'),
        axios.get('/api/edificios').catch(() => ({ data: [] }))
      ]);
      setAnuncios(anunciosRes.data);
      setEdificios(edificiosRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('contenido', form.contenido);
      formData.append('edificio', form.edificio || '');
      if (form.imagenFile) formData.append('imagen', form.imagenFile);
      else if (form.imagen) formData.append('imagen', form.imagen);

      if (editing) {
        await axios.put(`/api/anuncios/${editing}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/anuncios', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (a) => {
    setForm({
      titulo:    a.titulo,
      contenido: a.contenido,
      imagen:    a.imagen || '',
      imagenFile: null,
      edificio:  a.edificio?._id || ''
    });
    setEditing(a._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este anuncio?')) {
      await axios.delete(`/api/anuncios/${id}`);
      fetchData();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ titulo: '', contenido: '', imagen: '', imagenFile: null, edificio: '' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Anuncios</h1>
          <p className="text-gray-500 mt-1">Comunicados para clientes en el portal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Anuncio
        </button>
      </div>

      <div className="space-y-4">
        {anuncios.map((a) => (
          <div key={a._id} className={`bg-white rounded-2xl shadow-lg border border-green-100 p-5 ${!a.activo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              {a.imagen && (
                <img src={a.imagen} alt={a.titulo} className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-800">{a.titulo}</h3>
                  {a.activo
                    ? <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Activo</span>
                    : <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactivo</span>
                  }
                  {a.edificio
                    ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" />{a.edificio.nombre}</span>
                    : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700"><Globe className="w-3 h-3" />Global</span>
                  }
                </div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{a.contenido}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>{new Date(a.createdAt).toLocaleDateString('es-AR')}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{a.likes?.length || 0} likes</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(a)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => handleDelete(a._id)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {anuncios.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay anuncios</h3>
          <p className="text-gray-500">Crea el primer comunicado para tus clientes</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editing ? 'Editar Anuncio' : 'Nuevo Anuncio'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Novedades del proyecto"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Contenido</label>
                <textarea
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  className="input-field"
                  rows="5"
                  placeholder="Escribe el mensaje del anuncio..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Imagen (opcional)</label>
                {form.imagen && !form.imagenFile && (
                  <img src={form.imagen} alt="preview" className="w-full object-contain rounded-xl mb-2 border border-gray-100 bg-gray-50" />
                )}
                {form.imagenFile && (
                  <img src={URL.createObjectURL(form.imagenFile)} alt="preview" className="w-full object-contain rounded-xl mb-2 border border-gray-100 bg-gray-50" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, imagenFile: e.target.files[0] || null })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Edificio</label>
                <select
                  value={form.edificio}
                  onChange={(e) => setForm({ ...form, edificio: e.target.value })}
                  className="input-field"
                >
                  <option value="">Global (todos los clientes)</option>
                  {edificios.map(ed => (
                    <option key={ed._id} value={ed._id}>{ed.nombre}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">
                {editing ? 'Guardar Cambios' : 'Publicar Anuncio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Anuncios;
