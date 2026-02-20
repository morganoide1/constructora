import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Building2, DollarSign, Banknote, Filter } from 'lucide-react';

function PYL() {
  const [edificios, setEdificios] = useState([]);
  const [selectedEdificio, setSelectedEdificio] = useState('todos');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEdificios();
  }, []);

  useEffect(() => {
    fetchPYL();
  }, [selectedEdificio]);

  const fetchEdificios = async () => {
    try {
      const res = await axios.get('/api/edificios');
      setEdificios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPYL = async () => {
    try {
      setLoading(true);
      const url = selectedEdificio === 'todos' 
        ? '/api/pyl' 
        : `/api/pyl?edificio=${selectedEdificio}`;
      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n, currency = 'USD') => new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: 0 
  }).format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">P&L - Estado de Resultados</h1>
          <p className="text-white/60 mt-1">Análisis de ingresos y egresos por edificio</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-white/60" />
          <select 
            value={selectedEdificio} 
            onChange={(e) => setSelectedEdificio(e.target.value)}
            className="input-field min-w-[200px]"
          >
            <option value="todos">Todos los edificios</option>
            {edificios.map(e => (
              <option key={e._id} value={e._id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/60">Ingresos USD</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{fmt(data?.ingresos?.USD, 'USD')}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60">Ingresos ARS</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{fmt(data?.ingresos?.ARS, 'ARS')}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-white/60">Egresos USD</span>
          </div>
          <p className="text-2xl font-bold text-rose-400">{fmt(data?.egresos?.USD, 'USD')}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-white/60">Egresos ARS</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{fmt(data?.egresos?.ARS, 'ARS')}</p>
        </div>
      </div>

      {/* Resultado Neto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-2 border-emerald-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Resultado Neto USD</h3>
          <p className={`text-3xl font-bold ${(data?.resultado?.USD || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fmt(data?.resultado?.USD, 'USD')}
          </p>
        </div>
        <div className="card border-2 border-blue-500/30">
          <h3 className="text-lg font-semibold text-white mb-4">Resultado Neto ARS</h3>
          <p className={`text-3xl font-bold ${(data?.resultado?.ARS || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {fmt(data?.resultado?.ARS, 'ARS')}
          </p>
        </div>
      </div>

      {/* Detalle por Concepto */}
      {data?.detalleEgresos?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Detalle de Egresos por Concepto</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-white/60 font-medium">Concepto</th>
                  <th className="text-right py-3 text-white/60 font-medium">USD</th>
                  <th className="text-right py-3 text-white/60 font-medium">ARS</th>
                </tr>
              </thead>
              <tbody>
                {data.detalleEgresos.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white">{item.concepto}</td>
                    <td className="py-3 text-right text-rose-400">{fmt(item.USD, 'USD')}</td>
                    <td className="py-3 text-right text-orange-400">{fmt(item.ARS, 'ARS')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* P&L por Edificio */}
      {selectedEdificio === 'todos' && data?.porEdificio?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">P&L por Edificio</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 text-white/60 font-medium">Edificio</th>
                  <th className="text-right py-3 text-white/60 font-medium">Ingresos USD</th>
                  <th className="text-right py-3 text-white/60 font-medium">Egresos USD</th>
                  <th className="text-right py-3 text-white/60 font-medium">Resultado USD</th>
                  <th className="text-right py-3 text-white/60 font-medium">Ingresos ARS</th>
                  <th className="text-right py-3 text-white/60 font-medium">Egresos ARS</th>
                  <th className="text-right py-3 text-white/60 font-medium">Resultado ARS</th>
                </tr>
              </thead>
              <tbody>
                {data.porEdificio.map((ed, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-white font-medium">{ed.nombre}</td>
                    <td className="py-3 text-right text-emerald-400">{fmt(ed.ingresos?.USD, 'USD')}</td>
                    <td className="py-3 text-right text-rose-400">{fmt(ed.egresos?.USD, 'USD')}</td>
                    <td className={`py-3 text-right font-bold ${(ed.resultado?.USD || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fmt(ed.resultado?.USD, 'USD')}
                    </td>
                    <td className="py-3 text-right text-blue-400">{fmt(ed.ingresos?.ARS, 'ARS')}</td>
                    <td className="py-3 text-right text-orange-400">{fmt(ed.egresos?.ARS, 'ARS')}</td>
                    <td className={`py-3 text-right font-bold ${(ed.resultado?.ARS || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {fmt(ed.resultado?.ARS, 'ARS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PYL;
