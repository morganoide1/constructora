import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Users, Building2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cajasRes, ventasRes, clientesRes] = await Promise.all([
          axios.get('/api/cajas/dashboard').catch(() => ({ data: { cajas: [] } })),
          axios.get('/api/ventas/stats').catch(() => ({ data: {} })),
          axios.get('/api/clientes').catch(() => ({ data: [] }))
        ]);

        setStats({
          cajas: cajasRes.data.cajas || [],
          ventas: ventasRes.data,
          totalClientes: clientesRes.data.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const fmt = (n, currency = 'USD') => new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: 0 
  }).format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalUSD = stats?.cajas?.filter(c => c.tipo === 'USD').reduce((sum, c) => sum + c.saldo, 0) || 0;
  const totalARS = stats?.cajas?.filter(c => c.tipo === 'ARS').reduce((sum, c) => sum + c.saldo, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> USD
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{fmt(totalUSD, 'USD')}</p>
          <p className="text-gray-500 text-sm mt-1">Total en dólares</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> ARS
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{fmt(totalARS, 'ARS')}</p>
          <p className="text-gray-500 text-sm mt-1">Total en pesos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.totalClientes || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Clientes registrados</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.ventas?.propiedades?.total || 0}</p>
          <p className="text-gray-500 text-sm mt-1">Propiedades</p>
        </div>
      </div>

      {stats?.ventas?.propiedades && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado de Propiedades</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{stats.ventas.propiedades.disponibles}</p>
              <p className="text-gray-600 text-sm">Disponibles</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{stats.ventas.propiedades.reservadas}</p>
              <p className="text-gray-600 text-sm">Reservadas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.ventas.propiedades.vendidas}</p>
              <p className="text-gray-600 text-sm">Vendidas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
