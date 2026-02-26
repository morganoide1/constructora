import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, Building2 } from 'lucide-react';

function PYL() {
  const [data, setData] = useState(null);
  const [edificios, setEdificios] = useState([]);
  const [selectedEdificio, setSelectedEdificio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [selectedEdificio]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pylRes, edRes] = await Promise.all([
        axios.get(`/api/pyl${selectedEdificio ? `?edificio=${selectedEdificio}` : ''}`),
        axios.get('/api/edificios')
      ]);
      setData(pylRes.data);
      setEdificios(edRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n, currency = 'USD') => new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">P&L - Estado de Resultados</h1>
          <p className="text-gray-500 mt-1">Análisis de ingresos y egresos por edificio</p>
        </div>
        <select value={selectedEdificio} onChange={(e) => setSelectedEdificio(e.target.value)} className="input-field w-auto">
          <option value="">Todos los edificios</option>
          {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-gray-500 text-sm">Ingresos USD</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(data?.totales?.ingresos?.USD)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <span className="text-gray-500 text-sm">Ingresos ARS</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{fmt(data?.totales?.ingresos?.ARS, 'ARS')}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-rose-100"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
            <span className="text-gray-500 text-sm">Egresos USD</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{fmt(data?.totales?.egresos?.USD)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
            <span className="text-gray-500 text-sm">Egresos ARS</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{fmt(data?.totales?.egresos?.ARS, 'ARS')}</p>
        </div>
      </div>

      {/* Resultado Neto */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultado Neto</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 mb-2">USD</p>
            <p className={`text-3xl font-bold ${(data?.totales?.ingresos?.USD - data?.totales?.egresos?.USD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt((data?.totales?.ingresos?.USD || 0) - (data?.totales?.egresos?.USD || 0))}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-500 mb-2">ARS</p>
            <p className={`text-3xl font-bold ${(data?.totales?.ingresos?.ARS - data?.totales?.egresos?.ARS) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt((data?.totales?.ingresos?.ARS || 0) - (data?.totales?.egresos?.ARS || 0), 'ARS')}
            </p>
          </div>
        </div>
      </div>

      {/* Detalle por Edificio */}
      {data?.porEdificio && data.porEdificio.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle por Edificio</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium">Edificio</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Ingresos USD</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Egresos USD</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Resultado USD</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Ingresos ARS</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Egresos ARS</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Resultado ARS</th>
                </tr>
              </thead>
              <tbody>
                {data.porEdificio.map((ed, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-green-50">
                    <td className="py-3 text-gray-800 font-medium">{ed.nombre || 'Sin asignar'}</td>
                    <td className="py-3 text-right text-emerald-600">{fmt(ed.ingresos?.USD)}</td>
                    <td className="py-3 text-right text-rose-600">{fmt(ed.egresos?.USD)}</td>
                    <td className={`py-3 text-right font-medium ${(ed.ingresos?.USD - ed.egresos?.USD) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {fmt((ed.ingresos?.USD || 0) - (ed.egresos?.USD || 0))}
                    </td>
                    <td className="py-3 text-right text-blue-600">{fmt(ed.ingresos?.ARS, 'ARS')}</td>
                    <td className="py-3 text-right text-amber-600">{fmt(ed.egresos?.ARS, 'ARS')}</td>
                    <td className={`py-3 text-right font-medium ${(ed.ingresos?.ARS - ed.egresos?.ARS) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {fmt((ed.ingresos?.ARS || 0) - (ed.egresos?.ARS || 0), 'ARS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalle por Concepto */}
      {data?.porConcepto && Object.keys(data.porConcepto).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Egresos por Concepto</h3>
          <div className="space-y-3">
            {Object.entries(data.porConcepto).map(([concepto, valores]) => (
              <div key={concepto} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{concepto}</span>
                <div className="flex gap-4">
                  {valores.USD > 0 && <span className="text-rose-600 font-medium">{fmt(valores.USD)}</span>}
                  {valores.ARS > 0 && <span className="text-amber-600 font-medium">{fmt(valores.ARS, 'ARS')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PYL;
