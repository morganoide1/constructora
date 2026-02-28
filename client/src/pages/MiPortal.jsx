import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Building2, LogOut, CheckCircle, Clock, AlertCircle, FolderOpen, Gift, Briefcase, ExternalLink, Receipt, Plus, Trash2, Upload, FileText, ChevronLeft, ChevronRight, AlertTriangle, MessageCircle, Megaphone, ThumbsUp, Calendar, Users, Wrench, Percent } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function PlanAdelantoCalc({ pendientes, planes, fmt }) {
  const [n, setN] = useState(1);
  const max = pendientes.length;
  const seleccionadas = pendientes.slice(0, n);
  const subtotal = seleccionadas.reduce((s, c) => s + (c.monto || 0), 0);
  const moneda = seleccionadas[0]?.moneda || 'USD';

  // Mejor plan aplicable: mayor descuento con cuotasMinimas <= n
  const mejorPlan = planes
    .filter(pl => pl.cuotasMinimas <= n && (!pl.edificio || true))
    .sort((a, b) => b.descuento - a.descuento)[0] || null;

  const descuento = mejorPlan ? Math.round(subtotal * mejorPlan.descuento / 100) : 0;
  const total = subtotal - descuento;

  return (
    <div className="mt-5 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <Percent className="w-4 h-4 text-amber-600" />
        <h5 className="font-semibold text-gray-800 text-sm">Calculador de adelanto de cuotas</h5>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">¿Cuántas cuotas querés adelantar?</label>
          <span className="text-sm font-bold text-amber-700">{n} cuota{n !== 1 ? 's' : ''}</span>
        </div>
        <input
          type="range"
          min="1"
          max={max}
          value={n}
          onChange={e => setN(parseInt(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>1</span><span>{max}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Cuota{seleccionadas.length > 1 ? 's' : ''} {seleccionadas.map(c => c.numero).join(', ')}
        </p>
      </div>

      {/* Resultado */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({n} cuotas)</span>
          <span className="font-medium">{fmt(subtotal, moneda)}</span>
        </div>
        {mejorPlan ? (
          <>
            <div className="flex justify-between text-emerald-700">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {mejorPlan.titulo} (–{mejorPlan.descuento}%)
              </span>
              <span className="font-medium">–{fmt(descuento, moneda)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 border-t border-amber-200 pt-1.5">
              <span>Total a pagar</span>
              <span className="text-emerald-700 text-base">{fmt(total, moneda)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">
            {planes.length > 0
              ? `Necesitás al menos ${Math.min(...planes.map(p => p.cuotasMinimas))} cuotas para aplicar un descuento`
              : 'Sin descuento aplicable'}
          </p>
        )}
      </div>

      {/* Planes disponibles */}
      <div className="mt-4 pt-3 border-t border-amber-200">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Planes disponibles</p>
        <div className="space-y-1.5">
          {planes.map(pl => (
            <div key={pl._id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
              mejorPlan?._id === pl._id ? 'bg-emerald-100 border border-emerald-300' : 'bg-white border border-amber-100'
            }`}>
              <span className="font-medium text-gray-700">{pl.titulo}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-gray-500">{pl.cuotasMinimas}+ cuotas</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${mejorPlan?._id === pl._id ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                  {pl.descuento}% off
                </span>
              </div>
            </div>
          ))}
        </div>
        {mejorPlan && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            Para gestionar este adelanto, comunicate con nosotros mencionando el plan <strong>{mejorPlan.titulo}</strong>.
          </p>
        )}
      </div>
    </div>
  );
}

function MiPortal() {
  const [propiedades, setPropiedades] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [expensas, setExpensas] = useState([]);
  const [denuncias, setDenuncias] = useState([]);
  const [denunciasVecinos, setDenunciasVecinos] = useState([]);
  const [misPropiedades, setMisPropiedades] = useState([]);
  // Reservas
  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
  const [calMes, setCalMes] = useState(new Date().getMonth() + 1);
  const [calAnio, setCalAnio] = useState(new Date().getFullYear());
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [planesAdelanto, setPlanesAdelanto] = useState([]);
  const [estadoEdificio, setEstadoEdificio] = useState([]);
  const [estadoMes, setEstadoMes] = useState(new Date().getMonth() + 1);
  const [estadoAnio, setEstadoAnio] = useState(new Date().getFullYear());
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [notasReserva, setNotasReserva] = useState('');
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [showDenunciaModal, setShowDenunciaModal] = useState(false);
  const [gastoForm, setGastoForm] = useState({ tipo: 'expensas', descripcion: '', monto: '', moneda: 'ARS', propiedad: '', archivo: null });
  const [denunciaForm, setDenunciaForm] = useState({ tipo: 'reclamo', asunto: '', descripcion: '', propiedad: '', archivo: null });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const proyectosRef = useRef(null);
  const beneficiosRef = useRef(null);
  const anunciosRef = useRef(null);
  const gastosRef = useRef(null);
  const mantRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propsRes, anunciosRes, beneficiosRes, edificiosRes, gastosRes, misPropRes, expensasRes, denunciasRes, vecinosRes, espaciosRes, misReservasRes, mantRes, planesRes] = await Promise.all([
        axios.get('/api/clientes/mi-portal/propiedades'),
        axios.get('/api/anuncios').catch(() => ({ data: [] })),
        axios.get('/api/beneficios').catch(() => ({ data: [] })),
        axios.get('/api/edificios').catch(() => ({ data: [] })),
        axios.get('/api/gastos/mis-gastos').catch(() => ({ data: [] })),
        axios.get('/api/gastos/mis-propiedades').catch(() => ({ data: [] })),
        axios.get('/api/expensas/mis-expensas').catch(() => ({ data: [] })),
        axios.get('/api/denuncias/mis-denuncias').catch(() => ({ data: [] })),
        axios.get('/api/denuncias/vecinos').catch(() => ({ data: [] })),
        axios.get('/api/espacios').catch(() => ({ data: [] })),
        axios.get('/api/reservas/mis-reservas').catch(() => ({ data: [] })),
        axios.get('/api/mantenimiento').catch(() => ({ data: [] })),
        axios.get('/api/planes').catch(() => ({ data: [] }))
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
      setDenunciasVecinos(vecinosRes.data.map(d => ({
        ...d,
        _liked: (d.likes || []).some(id => id.toString() === user._id?.toString())
      })));
      const espList = espaciosRes.data;
      setEspacios(espList);
      setMisReservas(misReservasRes.data);
      if (espList.length > 0 && !espacioSeleccionado) setEspacioSeleccionado(espList[0]._id);
      setMantenimientos(mantRes.data);
      setPlanesAdelanto(planesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch estado del edificio cuando cambia mes/año
  useEffect(() => {
    axios.get('/api/expensas/estado-edificio', { params: { mes: estadoMes, año: estadoAnio } })
      .then(res => setEstadoEdificio(res.data))
      .catch(() => setEstadoEdificio([]));
  }, [estadoMes, estadoAnio]);

  // Fetch disponibilidad cuando cambia espacio o mes
  useEffect(() => {
    if (!espacioSeleccionado) return;
    axios.get('/api/reservas/disponibilidad', { params: { espacioId: espacioSeleccionado, mes: calMes, año: calAnio } })
      .then(res => setFechasBloqueadas(res.data))
      .catch(() => setFechasBloqueadas([]));
  }, [espacioSeleccionado, calMes, calAnio]);

  const handleReservar = async () => {
    try {
      await axios.post('/api/reservas', { espacio: espacioSeleccionado, fecha: fechaSeleccionada, notas: notasReserva });
      setShowReservaModal(false);
      setNotasReserva('');
      setFechaSeleccionada(null);
      // Refrescar
      const [dispRes, misRes] = await Promise.all([
        axios.get('/api/reservas/disponibilidad', { params: { espacioId: espacioSeleccionado, mes: calMes, año: calAnio } }),
        axios.get('/api/reservas/mis-reservas')
      ]);
      setFechasBloqueadas(dispRes.data);
      setMisReservas(misRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reservar');
    }
  };

  const handleCancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await axios.delete(`/api/reservas/${id}`);
    const [dispRes, misRes] = await Promise.all([
      axios.get('/api/reservas/disponibilidad', { params: { espacioId: espacioSeleccionado, mes: calMes, año: calAnio } }),
      axios.get('/api/reservas/mis-reservas')
    ]);
    setFechasBloqueadas(dispRes.data);
    setMisReservas(misRes.data);
  };

  // Generar grilla de días del mes
  const buildCalendar = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const primerDia = new Date(calAnio, calMes - 1, 1).getDay(); // 0=dom
    const diasEnMes = new Date(calAnio, calMes, 0).getDate();
    // Convertir domingo=0 a lunes=0
    const offset = (primerDia + 6) % 7;
    const celdas = [];
    for (let i = 0; i < offset; i++) celdas.push(null);
    for (let d = 1; d <= diasEnMes; d++) celdas.push(d);
    return { celdas, hoy };
  };

  const navegarMes = (dir) => {
    let m = calMes + dir;
    let a = calAnio;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setCalMes(m);
    setCalAnio(a);
  };

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

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

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

  const handleLikeDenuncia = async (denunciaId) => {
    try {
      const res = await axios.post(`/api/denuncias/${denunciaId}/like`);
      setDenunciasVecinos(prev => prev.map(d => d._id === denunciaId
        ? { ...d, _liked: res.data.liked, likes: Array(res.data.likes).fill(null) }
        : d
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
      <header className="sticky top-0 z-40 bg-white border-b border-green-200 shadow-sm">
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
                  <p className="text-xs text-gray-500 mb-1">Valor estimado</p>
                  <p className="text-xl font-bold text-emerald-600">{fmt(p.propiedad.valorFuturo)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">según última venta / proyección de mercado</p>
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
            {/* Calculador de planes de adelanto */}
            {planesAdelanto.length > 0 && (() => {
              const pendientes = p.cuotas.filter(c => c.estado === 'pendiente').sort((a, b) => a.numero - b.numero);
              if (pendientes.length === 0) return null;
              return <PlanAdelantoCalc pendientes={pendientes} planes={planesAdelanto} fmt={fmt} />;
            })()}
          </div>
        ))}

        {propiedades.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-green-100 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin propiedades asignadas</h3>
          </div>
        )}

        {/* Anuncios — Carrusel */}
        {anuncios.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100"><Megaphone className="w-6 h-6 text-blue-600" /></div>
                <h2 className="text-xl font-bold text-gray-800">Anuncios</h2>
              </div>
              {anuncios.length > 1 && (
                <div className="flex gap-2">
                  <button onClick={() => scroll(anunciosRef, 'left')} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scroll(anunciosRef, 'right')} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700"><ChevronRight className="w-5 h-5" /></button>
                </div>
              )}
            </div>
            <div ref={anunciosRef} className="flex gap-4 overflow-x-auto pb-3 snap-x" style={{ scrollbarWidth: 'none' }}>
              {anuncios.map((a) => {
                const liked = a._liked || false;
                const likeCount = a.likes?.length || 0;
                return (
                  <div key={a._id} className="flex-shrink-0 w-80 p-4 bg-blue-50 rounded-xl border border-blue-200 snap-start flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{a.titulo}</h4>
                      {a.edificio && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-200 text-blue-800">{a.edificio.nombre}</span>}
                    </div>
                    <p className="text-gray-400 text-xs mb-2">{new Date(a.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    {a.imagen && <img src={a.imagen} alt={a.titulo} className="w-full object-contain rounded-lg bg-gray-50 mb-2 max-h-32" />}
                    <p className="text-gray-700 text-sm flex-1 line-clamp-4">{a.contenido}</p>
                    <div className="flex justify-end mt-3">
                      <button onClick={() => handleLike(a._id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${liked ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
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
              <div key={ed._id} className="flex-shrink-0 w-80 bg-green-50 rounded-xl border border-green-200 snap-start overflow-hidden">
                {ed.imagen && (
                  <img src={ed.imagen} alt={ed.nombre} className="w-full max-h-48 object-contain bg-gray-50" />
                )}
                <div className="p-4">
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
              {expensas.map((exp) => {
                const edificio = exp.propiedad?.edificio;
                return (
                  <div key={exp._id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-gray-800 font-medium">{exp.propiedad?.nombre}</span>
                        <p className="text-gray-500 text-sm">{exp.periodo.mes}/{exp.periodo.año}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">{fmtARS(exp.montoTotal)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${exp.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{exp.estado}</span>
                      </div>
                    </div>
                    {exp.estado !== 'pagada' && (edificio?.linkPagoAutomatico || edificio?.linkPagoMomento) && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {edificio?.linkPagoAutomatico && (
                          <a href={edificio.linkPagoAutomatico} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            Débito automático
                          </a>
                        )}
                        {edificio?.linkPagoMomento && (
                          <a href={edificio.linkPagoMomento} target="_blank" rel="noopener noreferrer" className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                            Pagar ahora
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <p className="text-gray-400 text-center py-8">No tienes expensas</p>}
        </div>

        {/* Estado del Edificio — quién pagó y quién debe */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100"><Building2 className="w-6 h-6 text-green-600" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Estado del Edificio</h2>
                <p className="text-sm text-gray-500">Quién está al día y quién debe expensas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={estadoMes}
                onChange={e => setEstadoMes(parseInt(e.target.value))}
                className="input-field py-1.5 text-sm"
              >
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                  <option key={i} value={i+1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={estadoAnio}
                onChange={e => setEstadoAnio(parseInt(e.target.value))}
                className="input-field py-1.5 text-sm w-20"
              />
            </div>
          </div>
          {estadoEdificio.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Sin datos para ese período</p>
          ) : (() => {
            const agrupados = estadoEdificio.reduce((acc, u) => {
              const key = u.edificioId || 'sin';
              const label = u.edificioNombre || 'Edificio';
              if (!acc[key]) acc[key] = { label, items: [] };
              acc[key].items.push(u);
              return acc;
            }, {});
            const totalPorEdificio = Object.values(agrupados).map(g => ({
              label: g.label,
              total: g.items.length,
              pagados: g.items.filter(u => u.estado === 'pagada').length,
              deben: g.items.filter(u => u.estado === 'pendiente').length,
              items: g.items
            }));
            return (
              <div className="space-y-5">
                {totalPorEdificio.map((g, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{g.label}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {g.pagados} al día
                        </span>
                        <span className="flex items-center gap-1 text-rose-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {g.deben} deben
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {g.items.map(u => (
                        <div
                          key={u.propiedadId}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${
                            u.estado === 'pagada'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : u.estado === 'pendiente'
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            u.estado === 'pagada' ? 'bg-emerald-500' : u.estado === 'pendiente' ? 'bg-rose-500' : 'bg-gray-300'
                          }`} />
                          <span className="truncate">{u.nombre}</span>
                          {u.ubicacion?.piso && (
                            <span className="text-xs opacity-60 ml-auto flex-shrink-0">P{u.ubicacion.piso}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Gastos — Carrusel */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100"><Receipt className="w-6 h-6 text-rose-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Mis Gastos</h2>
            </div>
            <div className="flex items-center gap-2">
              {gastos.length > 2 && (
                <>
                  <button onClick={() => scroll(gastosRef, 'left')} className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scroll(gastosRef, 'right')} className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700"><ChevronRight className="w-5 h-5" /></button>
                </>
              )}
              <button onClick={() => setShowGastoModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Agregar</button>
            </div>
          </div>
          {gastos.length > 0 ? (
            <div ref={gastosRef} className="flex gap-3 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
              {gastos.map((g) => (
                <div key={g._id} className="flex-shrink-0 w-56 p-4 bg-rose-50 rounded-xl border border-rose-100 snap-start flex flex-col gap-2">
                  <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${g.tipo === 'expensas' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{g.tipo}</span>
                  <p className="text-gray-800 text-sm font-medium flex-1">{g.descripcion}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-base font-bold text-blue-600">{g.moneda === 'USD' ? fmt(g.monto) : fmtARS(g.monto)}</p>
                    <button onClick={() => handleDeleteGasto(g._id)} className="p-1.5 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
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
                  {d.archivo && isImage(d.archivo) && (
                    <a href={d.archivo} target="_blank" rel="noopener noreferrer">
                      <img src={d.archivo} alt="adjunto" className="mt-2 w-full object-contain rounded-lg border border-green-200 hover:opacity-90 bg-gray-50" />
                    </a>
                  )}
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

        {/* Denuncias del Edificio (aprobadas por admin) */}
        {denunciasVecinos.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-100"><Users className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Novedades del Edificio</h2>
            </div>
            <div className="space-y-4">
              {denunciasVecinos.map((d) => {
                const liked = d._liked || false;
                const likeCount = d.likes?.length || 0;
                return (
                  <div key={d._id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${d.tipo === 'urgencia' ? 'bg-rose-100 text-rose-700' : d.tipo === 'reclamo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{d.tipo}</span>
                      {d.edificio && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{d.edificio.nombre}</span>}
                      <span className="text-gray-400 text-xs ml-auto">{new Date(d.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{d.asunto}</h4>
                    <p className="text-gray-600 text-sm">{d.descripcion}</p>
                    {d.archivo && isImage(d.archivo) && (
                      <a href={d.archivo} target="_blank" rel="noopener noreferrer">
                        <img src={d.archivo} alt="adjunto" className="mt-2 w-full object-contain rounded-lg border border-blue-200 hover:opacity-90 bg-gray-50" />
                      </a>
                    )}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleLikeDenuncia(d._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          liked ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-blue-600 text-blue-600' : ''}`} />
                        {likeCount}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reservas de Espacios Comunes */}
        {espacios.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-100"><Calendar className="w-6 h-6 text-green-600" /></div>
              <h2 className="text-xl font-bold text-gray-800">Reservar Espacio Común</h2>
            </div>

            {/* Select espacio */}
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">Espacio</label>
              <select
                value={espacioSeleccionado}
                onChange={e => setEspacioSeleccionado(e.target.value)}
                className="input-field max-w-xs"
              >
                {espacios.map(esp => (
                  <option key={esp._id} value={esp._id}>{esp.nombre} — {esp.edificio?.nombre}</option>
                ))}
              </select>
            </div>

            {/* Calendario */}
            {(() => {
              const { celdas, hoy } = buildCalendar();
              return (
                <div className="max-w-sm">
                  {/* Cabecera mes */}
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => navegarMes(-1)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-gray-800">{MESES[calMes - 1]} {calAnio}</span>
                    <button onClick={() => navegarMes(1)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-500">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Días semana */}
                  <div className="grid grid-cols-7 mb-1">
                    {['L','M','X','J','V','S','D'].map(d => (
                      <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                    ))}
                  </div>
                  {/* Grilla */}
                  <div className="grid grid-cols-7 gap-1">
                    {celdas.map((dia, i) => {
                      if (!dia) return <div key={`e-${i}`} />;
                      const dateStr = `${calAnio}-${String(calMes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                      const fechaUTC = new Date(`${dateStr}T00:00:00Z`);
                      const esPasado = fechaUTC < hoy;
                      const esBloqueado = fechasBloqueadas.includes(dateStr);
                      const esMioReservado = misReservas.some(r => r.estado === 'confirmada' && r.espacio?._id === espacioSeleccionado && new Date(r.fecha).toISOString().slice(0,10) === dateStr);
                      return (
                        <button
                          key={dateStr}
                          disabled={esPasado || esBloqueado}
                          onClick={() => { setFechaSeleccionada(dateStr); setShowReservaModal(true); }}
                          title={esBloqueado ? 'Ya reservado' : esPasado ? 'Fecha pasada' : `Reservar ${dateStr}`}
                          className={`h-9 w-full rounded-lg text-sm font-medium transition-all
                            ${esPasado ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                              : esBloqueado ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                              : esMioReservado ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'}
                          `}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                  {/* Leyenda */}
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" />Disponible</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />Ocupado</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block" />Mi reserva</span>
                  </div>
                </div>
              );
            })()}

            {/* Mis reservas */}
            {misReservas.filter(r => r.estado === 'confirmada').length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-3">Mis Reservas Activas</h4>
                <div className="space-y-2">
                  {misReservas.filter(r => r.estado === 'confirmada').map(r => (
                    <div key={r._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div>
                        <span className="font-medium text-gray-800">{r.espacio?.nombre}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-600 text-sm">
                          {new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </span>
                        {r.notas && <p className="text-gray-400 text-xs mt-0.5">{r.notas}</p>}
                      </div>
                      <button onClick={() => handleCancelarReserva(r._id)} className="text-xs text-red-500 hover:text-red-700 hover:underline">Cancelar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historial de Mantenimiento — Carrusel */}
        {mantenimientos.length > 0 && (() => {
          const TIPO_COLORS = { limpieza: 'bg-blue-100 text-blue-700', mantenimiento: 'bg-amber-100 text-amber-700', reparacion: 'bg-rose-100 text-rose-700', inspeccion: 'bg-purple-100 text-purple-700', otro: 'bg-gray-100 text-gray-700' };
          return (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100"><Wrench className="w-6 h-6 text-amber-600" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Historial de Mantenimiento</h2>
                    <p className="text-sm text-gray-500">Trabajos realizados en tu edificio</p>
                  </div>
                </div>
                {mantenimientos.length > 2 && (
                  <div className="flex gap-2">
                    <button onClick={() => scroll(mantRef, 'left')} className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => scroll(mantRef, 'right')} className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
              <div ref={mantRef} className="flex gap-4 overflow-x-auto pb-3 snap-x" style={{ scrollbarWidth: 'none' }}>
                {mantenimientos.map(r => (
                  <div key={r._id} className="flex-shrink-0 w-64 bg-amber-50 rounded-xl border border-amber-100 snap-start overflow-hidden">
                    {r.imagen ? (
                      <a href={r.imagen} target="_blank" rel="noopener noreferrer">
                        <img src={r.imagen} alt={r.titulo} className="w-full h-36 object-contain bg-white border-b border-amber-100" />
                      </a>
                    ) : (
                      <div className="w-full h-28 bg-amber-100 flex items-center justify-center">
                        <Wrench className="w-8 h-8 text-amber-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[r.tipo] || 'bg-gray-100 text-gray-600'}`}>{r.tipo}</span>
                        {r.edificio && <span className="text-xs text-gray-400">{r.edificio.nombre}</span>}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{r.titulo}</p>
                      {r.descripcion && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{r.descripcion}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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

      {/* Modal Reserva */}
      {showReservaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Confirmar Reserva</h3>
              <button onClick={() => setShowReservaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-600">Espacio: <span className="font-semibold text-gray-800">{espacios.find(e => e._id === espacioSeleccionado)?.nombre}</span></p>
              <p className="text-sm text-gray-600 mt-1">Fecha: <span className="font-semibold text-gray-800">{fechaSeleccionada ? new Date(`${fechaSeleccionada}T00:00:00Z`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''}</span></p>
            </div>
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">Notas (opcional)</label>
              <textarea
                value={notasReserva}
                onChange={e => setNotasReserva(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Ej: cumpleaños, asado familiar..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReservaModal(false)} className="flex-1 btn-secondary justify-center">Cancelar</button>
              <button onClick={handleReservar} className="flex-1 btn-primary justify-center">Confirmar</button>
            </div>
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
