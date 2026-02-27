import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, X, MessageCircle, Eye, EyeOff, Send, Trash2, Users, ThumbsUp } from 'lucide-react';

const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

function Denuncias() {
  const [denuncias, setDenuncias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDenuncia, setSelectedDenuncia] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => { fetchData(); }, [filtroEstado]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/denuncias/admin${filtroEstado ? `?estado=${filtroEstado}` : ''}`);
      setDenuncias(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/denuncias/${selectedDenuncia._id}/respuesta`, { mensaje: respuesta });
      setRespuesta('');
      fetchData();
      const updated = await axios.get('/api/denuncias/admin');
      setSelectedDenuncia(updated.data.find(d => d._id === selectedDenuncia._id));
    } catch (err) {
      alert('Error al responder');
    }
  };

  const handleCambiarEstado = async (id, estado) => {
    try {
      await axios.put(`/api/denuncias/${id}`, { estado });
      fetchData();
      if (selectedDenuncia?._id === id) {
        setSelectedDenuncia({ ...selectedDenuncia, estado });
      }
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleToggleVisibilidad = async (id, visible) => {
    try {
      await axios.put(`/api/denuncias/${id}`, { visibleCliente: visible });
      fetchData();
    } catch (err) {
      alert('Error');
    }
  };

  const handleToggleVecinos = async (id, aprobada) => {
    try {
      await axios.put(`/api/denuncias/${id}`, { aprobadaVecinos: aprobada });
      fetchData();
      if (selectedDenuncia?._id === id) setSelectedDenuncia(prev => ({ ...prev, aprobadaVecinos: aprobada }));
    } catch (err) {
      alert('Error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta denuncia?')) {
      await axios.delete(`/api/denuncias/${id}`);
      setSelectedDenuncia(null);
      fetchData();
    }
  };

  const estadoColors = {
    pendiente: 'bg-amber-100 text-amber-700',
    en_proceso: 'bg-blue-100 text-blue-700',
    resuelto: 'bg-emerald-100 text-emerald-700',
    cerrado: 'bg-gray-100 text-gray-700'
  };

  const prioridadColors = {
    baja: 'bg-gray-100 text-gray-600',
    media: 'bg-blue-100 text-blue-600',
    alta: 'bg-amber-100 text-amber-600',
    urgente: 'bg-rose-100 text-rose-600'
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Denuncias y Reclamos</h1>
          <p className="text-gray-500 mt-1">Gestión de denuncias de clientes</p>
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input-field w-auto">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelto">Resueltos</option>
          <option value="cerrado">Cerrados</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de denuncias */}
        <div className="lg:col-span-1 space-y-3">
          {denuncias.map((d) => (
            <div 
              key={d._id} 
              onClick={() => setSelectedDenuncia(d)}
              className={`bg-white rounded-xl p-4 shadow border cursor-pointer transition-all ${selectedDenuncia?._id === d._id ? 'border-green-500 ring-2 ring-green-200' : 'border-green-100 hover:border-green-300'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${estadoColors[d.estado]}`}>{d.estado.replace('_', ' ')}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${prioridadColors[d.prioridad]}`}>{d.prioridad}</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">{d.asunto}</h4>
              <p className="text-gray-500 text-sm mb-2">{d.cliente?.nombre}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  {d.aprobadaVecinos && <span className="flex items-center gap-0.5 text-blue-500"><Users className="w-3 h-3" /></span>}
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {d.likes?.length || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {d.respuestas?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {denuncias.length === 0 && <p className="text-gray-400 text-center py-8">No hay denuncias</p>}
        </div>

        {/* Detalle de denuncia */}
        <div className="lg:col-span-2">
          {selectedDenuncia ? (
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{selectedDenuncia.asunto}</h3>
                    <p className="text-gray-500">{selectedDenuncia.cliente?.nombre} - {selectedDenuncia.cliente?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleVisibilidad(selectedDenuncia._id, !selectedDenuncia.visibleCliente)} className={`p-2 rounded-lg ${selectedDenuncia.visibleCliente ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title={selectedDenuncia.visibleCliente ? 'Visible para cliente' : 'Oculto para cliente'}>
                      {selectedDenuncia.visibleCliente ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleToggleVecinos(selectedDenuncia._id, !selectedDenuncia.aprobadaVecinos)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium ${selectedDenuncia.aprobadaVecinos ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`} title={selectedDenuncia.aprobadaVecinos ? 'Visible para vecinos del edificio' : 'Aprobar para vecinos'}>
                      <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(selectedDenuncia._id)} className="p-2 rounded-lg bg-rose-100 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${estadoColors[selectedDenuncia.estado]}`}>{selectedDenuncia.estado.replace('_', ' ')}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${prioridadColors[selectedDenuncia.prioridad]}`}>{selectedDenuncia.prioridad}</span>
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">{selectedDenuncia.tipo}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedDenuncia.descripcion}</p>
                {selectedDenuncia.archivo && (
                  isImage(selectedDenuncia.archivo)
                    ? <a href={selectedDenuncia.archivo} target="_blank" rel="noopener noreferrer">
                        <img src={selectedDenuncia.archivo} alt="Adjunto" className="mt-3 w-full max-h-48 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                      </a>
                    : <a href={selectedDenuncia.archivo} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-green-600 text-sm hover:underline">Ver archivo adjunto</a>
                )}
                {selectedDenuncia.aprobadaVecinos && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                    <Users className="w-3.5 h-3.5" /> Visible para vecinos del edificio · {selectedDenuncia.likes?.length || 0} likes
                  </div>
                )}
              </div>

              {/* Cambiar estado */}
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-2">
                <span className="text-gray-600 text-sm mr-2">Cambiar estado:</span>
                {['pendiente', 'en_proceso', 'resuelto', 'cerrado'].map((est) => (
                  <button key={est} onClick={() => handleCambiarEstado(selectedDenuncia._id, est)} className={`px-3 py-1 rounded-full text-xs transition-all ${selectedDenuncia.estado === est ? estadoColors[est] + ' ring-2 ring-offset-1' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {est.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Respuestas */}
              <div className="p-6 max-h-64 overflow-y-auto space-y-3">
                {selectedDenuncia.respuestas?.map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg ${r.usuario?._id === selectedDenuncia.cliente?._id ? 'bg-gray-100 ml-8' : 'bg-green-50 mr-8'}`}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="font-medium">{r.usuario?.nombre || 'Usuario'}</span>
                      <span>{new Date(r.fecha).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{r.mensaje}</p>
                  </div>
                ))}
              </div>

              {/* Responder */}
              <form onSubmit={handleResponder} className="p-4 border-t border-gray-100 flex gap-3">
                <input type="text" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} className="input-field flex-1" placeholder="Escribir respuesta..." required />
                <button type="submit" className="btn-primary"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una denuncia para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Denuncias;
