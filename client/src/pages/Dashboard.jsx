import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Banknote, Building2, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-react';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [cajas, setCajas] = useState({ cajas: [], totales: { USD: 0, ARS: 0 }, ultimosMovimientos: [] });
  const [ventas, setVentas] = useState({ ventasTotales: 0, totalCobrado: 0, totalPorCobrar: 0, propiedades: {} });
  const [certificados, setCertificados] = useState({ pendientes: 0, montosPendientes: { ARS: 0, USD: 0 } });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cajasRes, ventasRes, certRes] = await Promise.all([
        axios.get('/api/cajas/dashboard').catch(() => ({ data: { cajas: [], totales: { USD: 0, ARS: 0 }, ultimosMovimientos: [] } })),
        axios.get('/api/ventas/dashboard/stats').catch(() => ({ data: {} })),
        axios.get('/api/certificados/dashboard/stats').catch(() => ({ data: {} }))
      ]);
      setCajas(cajasRes.data);
      setVentas(ventasRes.data);
      setCertificados(certRes.data);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n, c = 'USD') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-white/60 mt-1">Resumen general del sistema</p>
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" /> Actualizar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
            <span className="badge badge-success">USD</span>
          </div>
          <p className="text-white/60 text-sm">Caja Principal</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(cajas.totales?.USD, 'USD')}</p>
        </div>

        <div className="stat-card animate-fade-in stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20"><Banknote className="w-6 h-6 text-blue-400" /></div>
            <span className="badge badge-info">ARS</span>
          </div>
          <p className="text-white/60 text-sm">Cajas Chicas</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(cajas.totales?.ARS, 'ARS')}</p>
        </div>

        <div className="stat-card animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20"><Building2 className="w-6 h-6 text-purple-400" /></div>
            <span className="badge badge-warning">{ventas.propiedades?.disponibles || 0} disp.</span>
          </div>
          <p className="text-white/60 text-sm">Ventas</p>
          <p className="text-2xl font-bold text-white mt-1">{ventas.ventasTotales || 0}</p>
        </div>

        <div className="stat-card animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20"><FileText className="w-6 h-6 text-amber-400" /></div>
            <span className="badge badge-warning">{certificados.pendientes || 0} pend.</span>
          </div>
          <p className="text-white/60 text-sm">Certificados Pend.</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(certificados.montosPendientes?.ARS, 'ARS')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-emerald-500/20"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Total Cobrado</p>
              <p className="text-xl font-bold text-white">{fmt(ventas.totalCobrado, 'USD')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-amber-500/20"><DollarSign className="w-6 h-6 text-amber-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Por Cobrar</p>
              <p className="text-xl font-bold text-white">{fmt(ventas.totalPorCobrar, 'USD')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-rose-500/20"><FileText className="w-6 h-6 text-rose-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Cert. USD Pend.</p>
              <p className="text-xl font-bold text-white">{fmt(certificados.montosPendientes?.USD, 'USD')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Cajas</h3>
          <div className="space-y-3">
            {cajas.cajas?.length > 0 ? cajas.cajas.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.tipo === 'USD' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                    {c.tipo === 'USD' ? <DollarSign className="w-5 h-5 text-green-400" /> : <Banknote className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{c.nombre}</p>
                    <p className="text-xs text-white/50 capitalize">{c.categoria}</p>
                  </div>
                </div>
                <p className={`font-bold ${c.tipo === 'USD' ? 'text-green-400' : 'text-blue-400'}`}>{fmt(c.saldo, c.tipo)}</p>
              </div>
            )) : <p className="text-white/50 text-center py-8">No hay cajas configuradas. Ve a Cajas → Configurar</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Últimos Movimientos</h3>
          <div className="space-y-3">
            {cajas.ultimosMovimientos?.length > 0 ? cajas.ultimosMovimientos.slice(0, 6).map((m) => (
              <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                    {m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm truncate max-w-[200px]">{m.concepto}</p>
                    <p className="text-xs text-white/50">{m.caja?.nombre}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? '+' : '-'}{fmt(m.monto, m.caja?.tipo || 'ARS')}
                </p>
              </div>
            )) : <p className="text-white/50 text-center py-8">No hay movimientos recientes</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
