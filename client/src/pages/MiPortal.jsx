import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Building2, DollarSign, Calendar, TrendingUp, LogOut, CheckCircle, Clock, AlertCircle, FolderOpen, Gift } from 'lucide-react';

function MiPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resumenRes, propsRes] = await Promise.all([
        axios.get('/api/clientes/mi-portal/resumen'),
        axios.get('/api/clientes/mi-portal/propiedades'),
        axios.get('/api/beneficios')
      ]);
      setResumen(resumenRes.data);
      setPropiedades(propsRes.data);
      const beneficiosRes = await axios.get("/api/beneficios");
      setBeneficios(beneficiosRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      </main>

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
    </div>
  );
}

export default MiPortal;
