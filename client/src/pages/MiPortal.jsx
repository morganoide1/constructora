import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, DollarSign, Calendar, TrendingUp, LogOut, CheckCircle, Clock, AlertCircle, FolderOpen, Gift, Briefcase, ExternalLink, Receipt, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function MiPortal() {
  const [propiedades, setPropiedades] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [expensas, setExpensas] = useState([]);
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [gastoForm, setGastoForm] = useState({ tipo: 'expensas', descripcion: '', monto: '', moneda: 'ARS', propiedad: '', archivo: null });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const propsRes = await axios.get('/api/clientes/mi-portal/propiedades');
      setPropiedades(propsRes.data);
      const beneficiosRes = await axios.get('/api/beneficios').catch(() => ({ data: [] }));
      setBeneficios(beneficiosRes.data);
      const edificiosRes = await axios.get('/api/edificios').catch(() => ({ data: [] }));
      setEdificios(edificiosRes.data);
      const gastosRes = await axios.get('/api/gastos/mis-gastos').catch(() => ({ data: [] }));
      setGastos(gastosRes.data);
      const misPropRes = await axios.get('/api/gastos/mis-propiedades').catch(() => ({ data: [] }));
      setMisPropiedades(misPropRes.data);
      const expensasRes = await axios.get('/api/expensas/mis-expensas').catch(() => ({ data: [] }));
      setExpensas(expensasRes.data);
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
      alert(err.response?.data?.error || 'Error al registrar gasto');
    }
  };

  const handleDeleteGasto = async (id) => {
    if (confirm('¿Eliminar este gasto?')) {
      await axios.delete(`/api/gastos/${id}`);
      fetchData();
    }
  };

  const fmtARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
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
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
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
                <p className="text-gray-500">{p.propiedad.ubicacion?.piso && `Piso ${p.propiedad.ubicacion.piso}`} {p.propiedad.ubicacion?.unidad && `- Unidad ${p.propiedad.ubicacion.unidad}`}</p>
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
                    <p className="text-xs text-gray-400">Valor futuro</p>
                    <p className="text-lg font-bold text-blue-600">{fmt(p.propiedad.valorFuturo)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info del Edificio */}
            {p.propiedad?.edificio && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">{p.propiedad.edificio.nombre}</h4>
                  {p.propiedad.edificio.estado && (
                    <span className={`px-2 py-1 rounded-full text-xs ${p.propiedad.edificio.estado === 'en_construccion' ? 'bg-amber-100 text-amber-700' : p.propiedad.edificio.estado === 'finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{p.propiedad.edificio.estado.replace('_', ' ')}</span>
                  )}
                </div>
                {p.propiedad.edificio.direccion && <p className="text-gray-500 text-sm mb-3">{p.propiedad.edificio.direccion}</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {p.propiedad.edificio.avanceObra > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xl font-bold text-purple-600">{p.propiedad.edificio.avanceObra}%</p>
                      <p className="text-xs text-gray-500">Avance obra</p>
                    </div>
                  )}
                  {p.propiedad.edificio.porcentajeVendido > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xl font-bold text-emerald-600">{p.propiedad.edificio.porcentajeVendido}%</p>
                      <p className="text-xs text-gray-500">Vendido</p>
                    </div>
                  )}
                  {p.propiedad.edificio.rentabilidadPozo > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xl font-bold text-blue-600">{p.propiedad.edificio.rentabilidadPozo}%</p>
                      <p className="text-xs text-gray-500">Rentabilidad media</p>
                    </div>
                  )}
                  {p.propiedad.edificio.fechaEntregaEstimada && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-sm font-bold text-gray-800">{new Date(p.propiedad.edificio.fechaEntregaEstimada).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500">Entrega est.</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {p.propiedad.edificio.historialObraUrl && (
                    <a href={p.propiedad.edificio.historialObraUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-600 text-sm hover:underline">
                      <ExternalLink className="w-4 h-4" /> Ver historial de obra
                    </a>
                  )}
                  {p.propiedad.edificio.expensasUrl && (
                    <a href={p.propiedad.edificio.expensasUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 text-sm hover:underline ml-4">
                      <ExternalLink className="w-4 h-4" /> Ver expensas
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Progreso de pago */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Progreso de pago</span>
                <span className="text-gray-800 font-medium">{p.resumen.porcentajePagado}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${p.resumen.porcentajePagado}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-emerald-600">Pagado: {fmt(p.totalPagado)}</span>
                <span className="text-amber-600">Pendiente: {fmt(p.saldoPendiente)}</span>
              </div>
            </div>

            {/* Próxima cuota */}
            {p.resumen.proximaCuota && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-800">Próximo vencimiento: Cuota {p.resumen.proximaCuota.numero}</p>
                    <p className="text-sm text-gray-500">{new Date(p.resumen.proximaCuota.fechaVencimiento).toLocaleDateString()} - {fmt(p.resumen.proximaCuota.monto)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cuotas */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Detalle de cuotas</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {p.cuotas.map((c) => (
                  <div key={c.numero} className={`p-3 rounded-lg text-center ${c.estado === 'pagada' ? 'bg-emerald-50 border border-emerald-200' : c.estado === 'vencida' ? 'bg-rose-50 border border-rose-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center justify-center mb-1">
                      {c.estado === 'pagada' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : c.estado === 'vencida' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Clock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <p className="text-xs text-gray-500">Cuota {c.numero}</p>
                    <p className={`text-sm font-medium ${c.estado === 'pagada' ? 'text-emerald-600' : c.estado === 'vencida' ? 'text-rose-600' : 'text-gray-800'}`}>{fmt(c.monto)}</p>
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
            <p className="text-gray-500">Aún no tienes propiedades registradas en el sistema</p>
          </div>
        )}

        {/* Proyectos de Inversión */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-emerald-100">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Proyectos de Inversión</h2>
              <p className="text-gray-500 text-sm">Conoce todos nuestros desarrollos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edificios.map((ed) => (
              <div key={ed._id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 text-lg">{ed.nombre}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${ed.estado === 'en_construccion' ? 'bg-amber-100 text-amber-700' : ed.estado === 'finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{ed.estado.replace('_', ' ')}</span>
                </div>
                {ed.direccion && <p className="text-gray-500 text-sm mb-3">{ed.direccion}</p>}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {ed.avanceObra > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{ed.avanceObra}%</p>
                      <p className="text-xs text-gray-500">Avance obra</p>
                    </div>
                  )}
                  {ed.porcentajeVendido > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{ed.porcentajeVendido}%</p>
                      <p className="text-xs text-gray-500">Vendido</p>
                    </div>
                  )}
                  {ed.rentabilidadPozo > 0 && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{ed.rentabilidadPozo}%</p>
                      <p className="text-xs text-gray-500">Rentabilidad media inversor pozo</p>
                    </div>
                  )}
                  {ed.fechaEntregaEstimada && (
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-sm font-bold text-gray-800">{new Date(ed.fechaEntregaEstimada).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500">Entrega est.</p>
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

        {/* Mis Expensas */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Mis Expensas</h2>
              <p className="text-gray-500 text-sm">Historial de expensas de tus propiedades</p>
            </div>
          </div>
          {expensas.length > 0 ? (
            <div className="space-y-3">
              {expensas.map((exp) => (
                <div key={exp._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-800 font-medium">{exp.propiedad?.nombre || exp.propiedad?.codigo}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${exp.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{exp.estado}</span>
                    </div>
                    <p className="text-gray-500 text-sm">Período: {exp.periodo.mes}/{exp.periodo.año}</p>
                    {exp.fechaVencimiento && <p className="text-gray-400 text-xs">Vence: {new Date(exp.fechaVencimiento).toLocaleDateString('es-AR')}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-amber-600">{exp.moneda === 'USD' ? fmt(exp.montoTotal) : fmtARS(exp.montoTotal)}</p>
                    {exp.archivo && <a href={exp.archivo} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg"><FileText className="w-4 h-4 text-gray-500" /></a>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No tienes expensas registradas</p>
          )}
        </div>

        {/* Mis Gastos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100">
                <Receipt className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Mis Gastos</h2>
                <p className="text-gray-500 text-sm">Registra tus gastos de expensas y mantenimiento</p>
              </div>
            </div>
            <button onClick={() => setShowGastoModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Agregar Gasto</button>
          </div>
          {gastos.length > 0 ? (
            <div className="space-y-3">
              {gastos.map((g) => (
                <div key={g._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${g.tipo === 'expensas' ? 'bg-blue-100 text-blue-700' : g.tipo === 'mantenimiento' ? 'bg-amber-100 text-amber-700' : g.tipo === 'servicios' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{g.tipo}</span>
                      <span className="text-gray-400 text-sm">{new Date(g.fecha).toLocaleDateString('es-AR')}</span>
                    </div>
                    <p className="text-gray-800">{g.descripcion}</p>
                    {g.propiedad && <p className="text-gray-400 text-sm">{g.propiedad.nombre || g.propiedad.codigo}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-lg font-bold ${g.moneda === 'USD' ? 'text-emerald-600' : 'text-blue-600'}`}>{g.moneda === 'USD' ? fmt(g.monto) : fmtARS(g.monto)}</p>
                    {g.archivo && <a href={g.archivo} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-lg"><Upload className="w-4 h-4 text-gray-500" /></a>}
                    <button onClick={() => handleDeleteGasto(g._id)} className="p-2 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No tienes gastos registrados</p>
          )}
        </div>

        {/* Beneficios Cliente Wave */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-rose-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-red-100">
              <Gift className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Beneficios Cliente Wave</h2>
              <p className="text-gray-500 text-sm">Descuentos y beneficios exclusivos para ti</p>
            </div>
          </div>
          {beneficios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beneficios.map((b) => (
                <div key={b._id} className="p-4 bg-rose-50 rounded-xl border border-rose-200 hover:shadow-md transition-all">
                  {b.imagen && <img src={b.imagen} alt={b.titulo} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${b.categoria === 'descuento' ? 'bg-emerald-100 text-emerald-700' : b.categoria === 'servicio' ? 'bg-blue-100 text-blue-700' : b.categoria === 'experiencia' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{b.categoria}</span>
                  <h4 className="font-semibold text-gray-800 mb-1">{b.titulo}</h4>
                  <p className="text-gray-500 text-sm mb-3">{b.descripcion}</p>
                  {b.link && <a href={b.link} target="_blank" rel="noopener noreferrer" className="text-rose-600 text-sm hover:underline">Ver más →</a>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Próximamente nuevos beneficios</p>
          )}
        </div>
      </main>

      {/* Modal Agregar Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Agregar Gasto</h3>
              <button onClick={() => setShowGastoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
            </div>
            <form onSubmit={handleGasto} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tipo de Gasto</label>
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
                <input type="text" value={gastoForm.descripcion} onChange={(e) => setGastoForm({...gastoForm, descripcion: e.target.value})} className="input-field" placeholder="Ej: Expensas Marzo 2024" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Monto</label>
                  <input type="number" value={gastoForm.monto} onChange={(e) => setGastoForm({...gastoForm, monto: e.target.value})} className="input-field" placeholder="0" required />
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
                <label className="block text-sm text-gray-600 mb-2">Comprobante (opcional)</label>
                <input type="file" onChange={(e) => setGastoForm({...gastoForm, archivo: e.target.files[0]})} className="input-field" accept="image/*,.pdf" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Gasto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiPortal;
