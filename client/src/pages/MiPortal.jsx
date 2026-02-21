import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Building2, DollarSign, Calendar, TrendingUp, LogOut, CheckCircle, Clock, AlertCircle, FolderOpen, Gift, Briefcase, ExternalLink, Receipt, Plus, Trash2, Upload } from 'lucide-react';

function MiPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoForm, setGastoForm] = useState({ tipo: "expensas", descripcion: "", monto: "", moneda: "ARS", propiedad: "", archivo: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resumenRes, propsRes] = await Promise.all([
        axios.get('/api/clientes/mi-portal/resumen'),
        axios.get('/api/clientes/mi-portal/propiedades'),
        axios.get('/api/beneficios'),
        axios.get('/api/edificios'),
        axios.get('/api/gastos/mis-gastos').catch(() => ({ data: [] })),
        axios.get('/api/gastos/mis-propiedades').catch(() => ({ data: [] }))
      ]);
      setResumen(resumenRes.data);
      setPropiedades(propsRes.data);
      const beneficiosRes = await axios.get("/api/beneficios");
      setBeneficios(beneficiosRes.data);
      const edificiosRes = await axios.get("/api/edificios");
      setEdificios(edificiosRes.data);
      const gastosRes = await axios.get("/api/gastos/mis-gastos").catch(() => ({ data: [] }));
      setGastos(gastosRes.data);
      const misPropRes = await axios.get("/api/gastos/mis-propiedades").catch(() => ({ data: [] }));
      setMisPropiedades(misPropRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleGasto = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("tipo", gastoForm.tipo);
      formData.append("descripcion", gastoForm.descripcion);
      formData.append("monto", gastoForm.monto);
      formData.append("moneda", gastoForm.moneda);
      if (gastoForm.propiedad) formData.append("propiedad", gastoForm.propiedad);
      if (gastoForm.archivo) formData.append("archivo", gastoForm.archivo);
      await axios.post("/api/gastos", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setShowGastoModal(false);
      setGastoForm({ tipo: "expensas", descripcion: "", monto: "", moneda: "ARS", propiedad: "", archivo: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Error al registrar gasto");
    }
  };

  const handleDeleteGasto = async (id) => {
    if (confirm("¿Eliminar este gasto?")) {
      await axios.delete(`/api/gastos/${id}`);
      fetchData();
    }
  };

  const fmtARS = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">Mi Portal</h1>
              <p className="text-xs text-white/50">Bienvenido, {user?.nombre}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary text-sm"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/20"><Building2 className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <p className="text-white/60 text-sm">Mis Propiedades</p>
                  <p className="text-2xl font-bold text-white">{resumen.totalPropiedades}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20"><DollarSign className="w-6 h-6 text-emerald-400" /></div>
                <div>
                  <p className="text-white/60 text-sm">Total Pagado</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmt(resumen.totalPagado)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20"><Clock className="w-6 h-6 text-amber-400" /></div>
                <div>
                  <p className="text-white/60 text-sm">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-amber-400">{fmt(resumen.saldoPendiente)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20"><TrendingUp className="w-6 h-6 text-blue-400" /></div>
                <div>
                  <p className="text-white/60 text-sm">Valor Futuro</p>
                  <p className="text-2xl font-bold text-blue-400">{fmt(resumen.valorFuturoTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Propiedades */}
        {propiedades.map((p) => (
          <div key={p.id} className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{p.propiedad.nombre}</h2>
                <p className="text-white/60">{p.propiedad.ubicacion?.piso && `Piso ${p.propiedad.ubicacion.piso}`} {p.propiedad.ubicacion?.unidad && `- Unidad ${p.propiedad.ubicacion.unidad}`}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge ${p.estado === 'escritura' ? 'badge-success' : 'badge-warning'}`}>{p.estado}</span>
                {p.propiedad?.edificio?.driveUrl && (
                  <a href={p.propiedad.edificio.driveUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                    <FolderOpen className="w-4 h-4" /> Planos e imágenes
                  </a>
                )}
                {p.propiedad.valorFuturo && (
                  <div className="text-right">
                    <p className="text-xs text-white/50">Valor futuro</p>
                    <p className="text-lg font-bold text-blue-400">{fmt(p.propiedad.valorFuturo)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info del Edificio */}
            {p.propiedad?.edificio && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h4 className="font-semibold text-white">{p.propiedad.edificio.nombre}</h4>
                  {p.propiedad.edificio.estado && (
                    <span className={`px-2 py-1 rounded-full text-xs ${p.propiedad.edificio.estado === "en_construccion" ? "bg-amber-500/20 text-amber-400" : p.propiedad.edificio.estado === "finalizado" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>{p.propiedad.edificio.estado.replace("_", " ")}</span>
                  )}
                </div>
                {p.propiedad.edificio.direccion && <p className="text-white/60 text-sm mb-3">{p.propiedad.edificio.direccion}</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {p.propiedad.edificio.avanceObra > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-xl font-bold text-purple-400">{p.propiedad.edificio.avanceObra}%</p>
                      <p className="text-xs text-white/50">Avance obra</p>
                    </div>
                  )}
                  {p.propiedad.edificio.porcentajeVendido > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-xl font-bold text-emerald-400">{p.propiedad.edificio.porcentajeVendido}%</p>
                      <p className="text-xs text-white/50">Vendido</p>
                    </div>
                  )}
                  {p.propiedad.edificio.rentabilidadPozo > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-xl font-bold text-blue-400">{p.propiedad.edificio.rentabilidadPozo}%</p>
                      <p className="text-xs text-white/50">Rentabilidad media</p>
                    </div>
                  )}
                  {p.propiedad.edificio.fechaEntregaEstimada && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-sm font-bold text-white">{new Date(p.propiedad.edificio.fechaEntregaEstimada).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-white/50">Entrega est.</p>
                    </div>
                  )}
                </div>
                {p.propiedad.edificio.historialObraUrl && (
                  <a href={p.propiedad.edificio.historialObraUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 text-sm hover:underline">
                    <ExternalLink className="w-4 h-4" /> Ver historial de obra
                  </a>
                )}
                {p.propiedad.edificio.expensasUrl && (
                  <a href={p.propiedad.edificio.expensasUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-400 text-sm hover:underline ml-4">
                    <ExternalLink className="w-4 h-4" /> Ver expensas
                  </a>
                )}
              </div>
            )}
            {/* Progreso de pago */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/60">Progreso de pago</span>
                <span className="text-white font-medium">{p.resumen.porcentajePagado}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${p.resumen.porcentajePagado}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-emerald-400">Pagado: {fmt(p.totalPagado)}</span>
                <span className="text-amber-400">Pendiente: {fmt(p.saldoPendiente)}</span>
              </div>
            </div>

            {/* Próxima cuota */}
            {p.resumen.proximaCuota && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Próxima cuota: #{p.resumen.proximaCuota.numero}</p>
                    <p className="text-amber-400 font-bold">{fmt(p.resumen.proximaCuota.monto)}</p>
                    <p className="text-white/60 text-sm">
                      Vence: {new Date(p.resumen.proximaCuota.fechaVencimiento).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detalle cuotas */}
            <div>
              <h4 className="text-sm font-medium text-white/70 mb-3">Plan de cuotas ({p.resumen.cuotasPagadas}/{p.resumen.cuotasTotales})</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {p.cuotas.map((c) => (
                  <div 
                    key={c.numero}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      c.estado === 'pagada' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : c.estado === 'vencida'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-white/5 text-white/60 border border-white/10'
                    }`}
                    title={`Cuota ${c.numero}: ${fmt(c.monto)} - ${c.estado}`}
                  >
                    {c.estado === 'pagada' ? <CheckCircle className="w-4 h-4" /> : c.numero}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {propiedades.length === 0 && (
          <div className="card text-center py-12">
            <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sin propiedades asignadas</h3>
            <p className="text-white/60">Aún no tienes propiedades registradas en el sistema</p>
          </div>
        )}


        {/* Proyectos de Inversión */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Proyectos de Inversión</h2>
              <p className="text-white/60 text-sm">Conoce todos nuestros desarrollos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edificios.map((ed) => (
              <div key={ed._id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-lg">{ed.nombre}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${ed.estado === "en_construccion" ? "bg-amber-500/20 text-amber-400" : ed.estado === "finalizado" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>{ed.estado.replace("_", " ")}</span>
                </div>
                {ed.direccion && <p className="text-white/60 text-sm mb-3">{ed.direccion}</p>}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {ed.avanceObra > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-purple-400">{ed.avanceObra}%</p>
                      <p className="text-xs text-white/50">Avance obra</p>
                    </div>
                  )}
                  {ed.porcentajeVendido > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-400">{ed.porcentajeVendido}%</p>
                      <p className="text-xs text-white/50">Vendido</p>
                    </div>
                  )}
                  {ed.rentabilidadPozo > 0 && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{ed.rentabilidadPozo}%</p>
                      <p className="text-xs text-white/50">Rentabilidad media inversor pozo</p>
                    </div>
                  )}
                  {ed.fechaEntregaEstimada && (
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-sm font-bold text-white">{new Date(ed.fechaEntregaEstimada).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</p>
                      <p className="text-xs text-white/50">Entrega est.</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {ed.driveUrl && <a href={ed.driveUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-sm justify-center"><FolderOpen className="w-4 h-4" /> Imágenes y planos</a>}
                  {ed.historialObraUrl && <a href={ed.historialObraUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-sm justify-center"><ExternalLink className="w-4 h-4" /> Historial</a>}
                  {ed.expensasUrl && <a href={ed.expensasUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-sm justify-center"><ExternalLink className="w-4 h-4" /> Expensas</a>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mis Gastos */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20">
                <Receipt className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mis Gastos</h2>
                <p className="text-white/60 text-sm">Registra tus gastos de expensas y mantenimiento</p>
              </div>
            </div>
            <button onClick={() => setShowGastoModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Agregar Gasto</button>
          </div>
          {gastos.length > 0 ? (
            <div className="space-y-3">
              {gastos.map((g) => (
                <div key={g._id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${g.tipo === "expensas" ? "bg-blue-500/20 text-blue-400" : g.tipo === "mantenimiento" ? "bg-amber-500/20 text-amber-400" : g.tipo === "servicios" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}>{g.tipo}</span>
                      <span className="text-white/50 text-sm">{new Date(g.fecha).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p className="text-white">{g.descripcion}</p>
                    {g.propiedad && <p className="text-white/50 text-sm">{g.propiedad.nombre || g.propiedad.codigo}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-lg font-bold ${g.moneda === "USD" ? "text-emerald-400" : "text-blue-400"}`}>{g.moneda === "USD" ? fmt(g.monto) : fmtARS(g.monto)}</p>
                    {g.archivo && <a href={g.archivo} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg"><Upload className="w-4 h-4 text-white/60" /></a>}
                    <button onClick={() => handleDeleteGasto(g._id)} className="p-2 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-center py-8">No tienes gastos registrados</p>
          )}
        </div>
        {/* Beneficios Cliente Wave */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Beneficios Cliente Wave</h2>
              <p className="text-white/60 text-sm">Descuentos y beneficios exclusivos para ti</p>
            </div>
          </div>
          {beneficios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beneficios.map((b) => (
                <div key={b._id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                  {b.imagen && <img src={b.imagen} alt={b.titulo} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${b.categoria === "descuento" ? "bg-emerald-500/20 text-emerald-400" : b.categoria === "servicio" ? "bg-blue-500/20 text-blue-400" : b.categoria === "experiencia" ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"}`}>{b.categoria}</span>
                  <h4 className="font-semibold text-white mb-1">{b.titulo}</h4>
                  <p className="text-white/60 text-sm mb-3">{b.descripcion}</p>
                  {b.link && <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">Ver más →</a>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-center py-8">Próximamente nuevos beneficios</p>
          )}
        </div>
      </main>

      {/* Modal Agregar Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Agregar Gasto</h3>
              <button onClick={() => setShowGastoModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/60">✕</button>
            </div>
            <form onSubmit={handleGasto} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Tipo de Gasto</label>
                <select value={gastoForm.tipo} onChange={(e) => setGastoForm({...gastoForm, tipo: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <option value="expensas">Expensas</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="servicios">Servicios</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Propiedad</label>
                <select value={gastoForm.propiedad} onChange={(e) => setGastoForm({...gastoForm, propiedad: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                  <option value="">-- Seleccionar --</option>
                  {misPropiedades.map(p => <option key={p._id} value={p._id}>{p.nombre || p.codigo}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Descripción</label>
                <input type="text" value={gastoForm.descripcion} onChange={(e) => setGastoForm({...gastoForm, descripcion: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" placeholder="Ej: Expensas Marzo 2024" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Monto</label>
                  <input type="number" value={gastoForm.monto} onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" placeholder="0" required />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Moneda</label>
                  <select value={gastoForm.moneda} onChange={(e) => setGastoForm({...gastoForm, moneda: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Comprobante (opcional)</label>
                <input type="file" onChange={(e) => setGastoForm({...gastoForm, archivo: e.target.files[0]})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" accept="image/*,.pdf" />
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold">Registrar Gasto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiPortal;
