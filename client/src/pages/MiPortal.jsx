import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Building2, LogOut, CheckCircle, Clock, AlertCircle, FolderOpen, Gift, Briefcase, ExternalLink, Receipt, Plus, Trash2, Upload, FileText, ChevronLeft, ChevronRight, AlertTriangle, MessageCircle, Megaphone, ThumbsUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function MiPortal() {
  const [propiedades, setPropiedades] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [expensas, setExpensas] = useState([]);
  const [denuncias, setDenuncias] = useState([]);
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [showDenunciaModal, setShowDenunciaModal] = useState(false);
  const [gastoForm, setGastoForm] = useState({ tipo: 'expensas', descripcion: '', monto: '', moneda: 'ARS', propiedad: '', archivo: null });
  const [denunciaForm, setDenunciaForm] = useState({ tipo: 'reclamo', asunto: '', descripcion: '', propiedad: '', archivo: null });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const proyectosRef = useRef(null);
  const beneficiosRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propsRes, anunciosRes, beneficiosRes, edificiosRes, gastosRes, misPropRes, expensasRes, denunciasRes] = await Promise.all([
        axios.get('/api/clientes/mi-portal/propiedades'),
        axios.get('/api/anuncios').catch(() => ({ data: [] })),
        axios.get('/api/beneficios').catch(() => ({ data: [] })),
        axios.get('/api/edificios').catch(() => ({ data: [] })),
        axios.get('/api/gastos/mis-gastos').catch(() => ({ data: [] })),
        axios.get('/api/gastos/mis-propiedades').catch(() => ({ data: [] })),
        axios.get('/api/expensas/mis-expensas').catch(() => ({ data: [] })),
        axios.get('/api/denuncias/mis-denuncias').catch(() => ({ data: [] }))
      ]);
      setPropiedades(propsRes.data);
      setAnuncios(anunciosRes.data.map(a => ({
        ...a,
        _liked: (a.likes || []).some(id => id.toString() === user._id?.toString())
      })));
      setBeneficios(beneficiosRes.data);
      setEdificios(edificiosRes.data);
      setGastos(gastosRes.data);
      setMisPropiedades(misPropRes.data);
      setExpensas(expensasRes.data);
      setDenuncias(denunciasRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const handleGasto = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('tipo', gastoForm.tipo);
      formData.append('descripcion', gastoForm.descripcion);
      formData.append('monto', gastoForm.monto);
      formData.append('moneda', gastoForm.moneda);
      if (gastoForm.propiedad) formData.append('propiedad', gastoForm.propiedad);
      if (gastoForm.archivo) formData.append('archivo', gastoForm.archivo);
      await axios.post('/api/gastos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowGastoModal(false);
      setGastoForm({ tipo: 'expensas', descripcion: '', monto: '', moneda: 'ARS', propiedad: '', archivo: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteGasto = async (id) => {
    if (confirm('¿Eliminar?')) {
      await axios.delete(`/api/gastos/${id}`);
      fetchData();
    }
  };

  const handleDenuncia = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('tipo', denunciaForm.tipo);
      formData.append('asunto', denunciaForm.asunto);
      formData.append('descripcion', denunciaForm.descripcion);
      if (denunciaForm.propiedad) formData.append('propiedad', denunciaForm.propiedad);
      if (denunciaForm.archivo) formData.append('archivo', denunciaForm.archivo);
      await axios.post('/api/denuncias', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowDenunciaModal(false);
      setDenunciaForm({ tipo: 'reclamo', asunto: '', descripcion: '', propiedad: '', archivo: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleLike = async (anuncioId) => {
    try {
      const res = await axios.post(`/api/anuncios/${anuncioId}/like`);
      setAnuncios(prev => prev.map(a => a._id === anuncioId
        ? { ...a, _liked: res.data.liked, likes: Array(res.data.likes).fill(null) }
        : a
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="bg-white border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="Wave Realty" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display font-bold text-gray-800">Wave Realty</h1>
              <p className="text-xs text-gray-500">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user?.nombre}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Mis Propiedades */}
        {propiedades.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{p.propiedad.nombre}</h2>
                <p className="text-gray-500">{p.propiedad.ubicacion?.piso && `Piso ${p.propiedad.ubicacion.piso} - Unidad ${p.propiedad.ubicacion.unidad}`}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${p.estado === 'escritura' ? 'badge-success' : 'badge-warning'}`}>{p.estado}</span>
                {p.propiedad?.edificio?.driveUrl && <a href={p.propiedad.edificio.driveUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm"><FolderOpen className="w-4 h-4" /> Planos</a>}
                {p.propiedad?.edificio?.historialObraUrl && <a href={p.propiedad.edificio.historialObraUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm"><ExternalLink className="w-4 h-4" /> Historial</a>}
              </div>
            </div>
            {/* Valores de inversión */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">Valor de Compra</p>
                <p className="text-xl font-bold text-blue-300">{fmt(p.precioVenta)}</p>
              </div>
              {p.propiedad.valorFuturo && (
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-gray-500 mb-1">Valor Futuro</p>
                  <p className="text-xl font-bold text-emerald-600">{fmt(p.propiedad.valorFuturo)}</p>
                </div>
              )}
              {p.propiedad.valorFuturo && p.precioVenta > 0 && (
                <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs text-gray-500 mb-1">Rentabilidad Est.</p>
                  <p className="text-xl font-bold text-purple-600">{(((p.propiedad.valorFuturo / p.precioVenta) - 1) * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
            {p.propiedad?.edificio && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">{p.propiedad.edificio.nombre}</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {p.propiedad.edificio.avanceObra > 0 && <div className="text-center p-2 bg-white rounded-lg"><p className="text-xl font-bold text-purple-600">{p.propiedad.edificio.avanceObra}%</p><p className="text-xs text-gray-500">Avance</p></div>}
                  {p.propiedad.edificio.porcentajeVendido > 0 && <div className="text-center p-2 bg-white rounded-lg"><p className="text-xl font-bold text-emerald-600">{p.propiedad.edificio.porcentajeVendido}%</p><p className="text-xs text-gray-500">Vendido</p></div>}
                </div>
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Progreso de pago</span>
                <span className="text-gray-800 font-medium">{p.resumen.porcentajePagado}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${p.resumen.porcentajePagado}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-emerald-600">Pagado: {fmt(p.totalPagado)}</span>
                <span className="text-amber-600">Pendiente: {fmt(p.saldoPendiente)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Detalle de cuotas</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> {p.cuotas.filter(c => c.estado === "pagada").length} pagadas</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" /> {p.cuotas.filter(c => c.estado === "pendiente").length} pendientes</span>
                  {p.cuotas.filter(c => c.estado === "vencida").length > 0 && <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-rose-500" /> {p.cuotas.filter(c => c.estado === "vencida").length} vencidas</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.cuotas.map((c) => (
                  <div key={c.numero} title={`Cuota ${c.numero}: ${fmt(c.monto)}`} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-default ${c.estado === "pagada" ? "bg-emerald-100 text-emerald-700" : c.estado === "vencida" ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600"}`}>
                    {c.numero}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {propiedades.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin propiedades asignadas</h3>
          </div>
        )}

        {/* Anuncios */}
        {anuncios.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-100"><Megaphone className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Anuncios</h2>
            </div>
            <div className="space-y-4">
              {anuncios.map((a) => {
                const liked = a._liked || false;
                const likeCount = a.likes?.length || 0;
                return (
                  <div key={a._id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-gray-800">{a.titulo}</h4>
                          {a.edificio && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-200 text-blue-800">{a.edificio.nombre}</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mb-2">{new Date(a.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{a.contenido}</p>
                        {a.imagen && (
                          <img src={a.imagen} alt={a.titulo} className="mt-3 w-full max-h-48 object-cover rounded-lg" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleLike(a._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          liked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-green-600 text-green-600' : ''}`} />
                        {likeCount}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Proyectos - Carrusel */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100"><Briefcase className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Proyectos de Inversión</h2>
            </div>
            {edificios.length > 2 && (
              <div className="flex gap-2">
                <button onClick={() => scroll(proyectosRef, 'left')} className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => scroll(proyectosRef, 'right')} className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
          <div ref={proyectosRef} className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
            {edificios.map((ed) => (
              <div key={ed._id} className="flex-shrink-0 w-80 p-4 bg-green-50 rounded-xl border border-green-200 snap-start">
                <h4 className="font-semibold text-gray-800 text-lg mb-2">{ed.nombre}</h4>
                {ed.direccion && <p className="text-gray-500 text-sm mb-3">{ed.direccion}</p>}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {ed.avanceObra > 0 && <div className="text-center p-2 bg-white rounded-lg"><p className="text-xl font-bold text-purple-600">{ed.avanceObra}%</p><p className="text-xs text-gray-500">Avance</p></div>}
                  {ed.porcentajeVendido > 0 && <div className="text-center p-2 bg-white rounded-lg"><p className="text-xl font-bold text-emerald-600">{ed.porcentajeVendido}%</p><p className="text-xs text-gray-500">Vendido</p></div>}
                </div>
                <div className="flex flex-col gap-2">
                  {ed.driveUrl && <a href={ed.driveUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm justify-center"><FolderOpen className="w-4 h-4" /> Imágenes</a>}
                  {ed.historialObraUrl && <a href={ed.historialObraUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm justify-center"><ExternalLink className="w-4 h-4" /> Historial de Obra</a>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expensas */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-amber-100"><FileText className="w-6 h-6 text-amber-600" /></div>
            <h2 className="text-xl font-bold text-gray-800">Mis Expensas</h2>
          </div>
          {expensas.length > 0 ? (
            <div className="space-y-3">
              {expensas.map((exp) => (
                <div key={exp._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <span className="text-gray-800 font-medium">{exp.propiedad?.nombre}</span>
                    <p className="text-gray-500 text-sm">{exp.periodo.mes}/{exp.periodo.año}</p>
                  </div>
                  <p className="text-lg font-bold text-amber-600">{fmtARS(exp.montoTotal)}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No tienes expensas</p>}
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100"><Receipt className="w-6 h-6 text-rose-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Mis Gastos</h2>
            </div>
            <button onClick={() => setShowGastoModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Agregar</button>
          </div>
          {gastos.length > 0 ? (
            <div className="space-y-3">
              {gastos.map((g) => (
                <div key={g._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${g.tipo === 'expensas' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{g.tipo}</span>
                    <p className="text-gray-800 mt-1">{g.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-blue-600">{g.moneda === 'USD' ? fmt(g.monto) : fmtARS(g.monto)}</p>
                    <button onClick={() => handleDeleteGasto(g._id)} className="p-2 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No tienes gastos</p>}
        </div>

        {/* Denuncias */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Mis Denuncias</h2>
            </div>
            <button onClick={() => setShowDenunciaModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Nueva</button>
          </div>
          {denuncias.length > 0 ? (
            <div className="space-y-3">
              {denuncias.map((d) => (
                <div key={d._id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs mr-2 ${d.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : d.estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{d.estado.replace('_', ' ')}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{d.tipo}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">{d.asunto}</h4>
                  <p className="text-gray-600 text-sm">{d.descripcion}</p>
                  {d.respuestas?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {d.respuestas.length} respuesta(s)</p>
                      <div className="bg-white p-2 rounded-lg text-sm text-gray-700">{d.respuestas[d.respuestas.length - 1].mensaje}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No tienes denuncias</p>}
        </div>

        {/* Beneficios - Carrusel */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-rose-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100"><Gift className="w-6 h-6 text-rose-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Beneficios Cliente Wave</h2>
            </div>
            {beneficios.length > 3 && (
              <div className="flex gap-2">
                <button onClick={() => scroll(beneficiosRef, 'left')} className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => scroll(beneficiosRef, 'right')} className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
          {beneficios.length > 0 ? (
            <div ref={beneficiosRef} className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
              {beneficios.map((b) => (
                <div key={b._id} className="flex-shrink-0 w-72 p-4 bg-rose-50 rounded-xl border border-rose-200 snap-start">
                  {b.imagen && <img src={b.imagen} alt={b.titulo} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <h4 className="font-semibold text-gray-800 mb-1">{b.titulo}</h4>
                  <p className="text-gray-500 text-sm mb-3">{b.descripcion}</p>
                  {b.link && <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-rose-600 text-sm hover:underline">Ver más →</a>}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center py-8">Próximamente</p>}
        </div>
      </main>

      {/* Modal Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Agregar Gasto</h3>
              <button onClick={() => setShowGastoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleGasto} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tipo</label>
                <select value={gastoForm.tipo} onChange={(e) => setGastoForm({...gastoForm, tipo: e.target.value})} className="input-field">
                  <option value="expensas">Expensas</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="servicios">Servicios</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Propiedad</label>
                <select value={gastoForm.propiedad} onChange={(e) => setGastoForm({...gastoForm, propiedad: e.target.value})} className="input-field">
                  <option value="">-- Seleccionar --</option>
                  {misPropiedades.map(p => <option key={p._id} value={p._id}>{p.nombre || p.codigo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Descripción</label>
                <input type="text" value={gastoForm.descripcion} onChange={(e) => setGastoForm({...gastoForm, descripcion: e.target.value})} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Monto</label>
                  <input type="number" value={gastoForm.monto} onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Moneda</label>
                  <select value={gastoForm.moneda} onChange={(e) => setGastoForm({...gastoForm, moneda: e.target.value})} className="input-field">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Comprobante</label>
                <input type="file" onChange={(e) => setGastoForm({...gastoForm, archivo: e.target.files[0]})} className="input-field" accept="image/*,.pdf" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Denuncia */}
      {showDenunciaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Nueva Denuncia</h3>
              <button onClick={() => setShowDenunciaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleDenuncia} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tipo</label>
                <select value={denunciaForm.tipo} onChange={(e) => setDenunciaForm({...denunciaForm, tipo: e.target.value})} className="input-field">
                  <option value="reclamo">Reclamo</option>
                  <option value="consulta">Consulta</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="urgencia">Urgencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Propiedad</label>
                <select value={denunciaForm.propiedad} onChange={(e) => setDenunciaForm({...denunciaForm, propiedad: e.target.value})} className="input-field">
                  <option value="">-- Seleccionar --</option>
                  {misPropiedades.map(p => <option key={p._id} value={p._id}>{p.nombre || p.codigo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Asunto</label>
                <input type="text" value={denunciaForm.asunto} onChange={(e) => setDenunciaForm({...denunciaForm, asunto: e.target.value})} className="input-field" placeholder="Breve descripción" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Descripción</label>
                <textarea value={denunciaForm.descripcion} onChange={(e) => setDenunciaForm({...denunciaForm, descripcion: e.target.value})} className="input-field" rows="4" placeholder="Detalla tu reclamo..." required></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adjuntar archivo</label>
                <input type="file" onChange={(e) => setDenunciaForm({...denunciaForm, archivo: e.target.files[0]})} className="input-field" accept="image/*,.pdf" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Enviar Denuncia</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiPortal;
