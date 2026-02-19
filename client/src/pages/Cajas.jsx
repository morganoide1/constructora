import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Banknote, Plus, ArrowRightLeft, ArrowUpRight, ArrowDownRight, X, Settings, RefreshCw } from 'lucide-react';

function Cajas() {
  const [cajas, setCajas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [selectedCaja, setSelectedCaja] = useState(null);
  const [movForm, setMovForm] = useState({ tipo: 'ingreso', monto: '', concepto: '', notas: '' });
  const [transForm, setTransForm] = useState({ cajaOrigenId: '', cajaDestinoId: '', monto: '', tipoCambio: '', concepto: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cajas/dashboard');
      setCajas(res.data.cajas || []);
      setMovimientos(res.data.ultimosMovimientos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupCajas = async () => {
    try {
      await axios.post('/api/cajas/setup');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleMovimiento = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/cajas/${selectedCaja._id}/movimiento`, {
        ...movForm,
        monto: parseFloat(movForm.monto)
      });
      setShowMovModal(false);
      setMovForm({ tipo: 'ingreso', monto: '', concepto: '', notas: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleTransferencia = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transferencias', {
        ...transForm,
        monto: parseFloat(transForm.monto),
        tipoCambio: transForm.tipoCambio ? parseFloat(transForm.tipoCambio) : undefined
      });
      setShowTransModal(false);
      setTransForm({ cajaOrigenId: '', cajaDestinoId: '', monto: '', tipoCambio: '', concepto: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n, c = 'USD') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n || 0);

  const needsTipoCambio = () => {
    if (!transForm.cajaOrigenId || !transForm.cajaDestinoId) return false;
    const origen = cajas.find(c => c._id === transForm.cajaOrigenId);
    const destino = cajas.find(c => c._id === transForm.cajaDestinoId);
    return origen && destino && origen.tipo !== destino.tipo;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Cajas</h1>
          <p className="text-white/60 mt-1">Gestión de fondos y movimientos</p>
        </div>
        <div className="flex gap-3">
          {cajas.length === 0 && (
            <button onClick={setupCajas} className="btn-primary"><Settings className="w-4 h-4" /> Configurar Cajas</button>
          )}
          {cajas.length > 0 && (
            <button onClick={() => setShowTransModal(true)} className="btn-secondary"><ArrowRightLeft className="w-4 h-4" /> Transferir</button>
          )}
          <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Cajas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cajas.map((caja) => (
          <div key={caja._id} className="card hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${caja.tipo === 'USD' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                {caja.tipo === 'USD' ? <DollarSign className="w-6 h-6 text-green-400" /> : <Banknote className="w-6 h-6 text-blue-400" />}
              </div>
              <span className={`badge ${caja.tipo === 'USD' ? 'badge-success' : 'badge-info'}`}>{caja.tipo}</span>
            </div>
            <h3 className="font-semibold text-white">{caja.nombre}</h3>
            <p className="text-xs text-white/50 capitalize mb-3">{caja.categoria}</p>
            <p className={`text-2xl font-bold ${caja.tipo === 'USD' ? 'text-green-400' : 'text-blue-400'}`}>{fmt(caja.saldo, caja.tipo)}</p>
            <button 
              onClick={() => { setSelectedCaja(caja); setShowMovModal(true); }}
              className="mt-4 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar Movimiento
            </button>
          </div>
        ))}
      </div>

      {cajas.length === 0 && (
        <div className="card text-center py-12">
          <Banknote className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No hay cajas configuradas</h3>
          <p className="text-white/60 mb-4">Haz clic en "Configurar Cajas" para crear las cajas iniciales</p>
        </div>
      )}

      {/* Movimientos */}
      {movimientos.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Historial de Movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Caja</th>
                  <th className="pb-3 font-medium">Concepto</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m._id} className="table-row">
                    <td className="py-3 text-white/70 text-sm">{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="py-3 text-white">{m.caja?.nombre}</td>
                    <td className="py-3 text-white">{m.concepto}</td>
                    <td className="py-3">
                      <span className={`badge ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'badge-success' : 'badge-danger'}`}>
                        {m.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-semibold ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? '+' : '-'}{fmt(m.monto, m.caja?.tipo || 'ARS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {showMovModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nuevo Movimiento</h3>
              <button onClick={() => setShowMovModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <p className="text-white/60 mb-4">Caja: <span className="text-white font-medium">{selectedCaja?.nombre}</span></p>
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMovForm({...movForm, tipo: 'ingreso'})} className={`p-3 rounded-xl border ${movForm.tipo === 'ingreso' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 text-white/60'}`}>
                  <ArrowUpRight className="w-5 h-5 mx-auto mb-1" /> Ingreso
                </button>
                <button type="button" onClick={() => setMovForm({...movForm, tipo: 'egreso'})} className={`p-3 rounded-xl border ${movForm.tipo === 'egreso' ? 'border-rose-500 bg-rose-500/20 text-rose-400' : 'border-white/10 text-white/60'}`}>
                  <ArrowDownRight className="w-5 h-5 mx-auto mb-1" /> Egreso
                </button>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Monto ({selectedCaja?.tipo})</label>
                <input type="number" step="0.01" value={movForm.monto} onChange={(e) => setMovForm({...movForm, monto: e.target.value})} className="input-field" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Concepto</label>
                <input type="text" value={movForm.concepto} onChange={(e) => setMovForm({...movForm, concepto: e.target.value})} className="input-field" placeholder="Descripción del movimiento" required />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Notas (opcional)</label>
                <textarea value={movForm.notas} onChange={(e) => setMovForm({...movForm, notas: e.target.value})} className="input-field" rows="2" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Movimiento</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {showTransModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Transferencia entre Cajas</h3>
              <button onClick={() => setShowTransModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <form onSubmit={handleTransferencia} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Caja Origen</label>
                <select value={transForm.cajaOrigenId} onChange={(e) => setTransForm({...transForm, cajaOrigenId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre} ({fmt(c.saldo, c.tipo)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Caja Destino</label>
                <select value={transForm.cajaDestinoId} onChange={(e) => setTransForm({...transForm, cajaDestinoId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {cajas.filter(c => c._id !== transForm.cajaOrigenId).map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Monto</label>
                <input type="number" step="0.01" value={transForm.monto} onChange={(e) => setTransForm({...transForm, monto: e.target.value})} className="input-field" required />
              </div>
              {needsTipoCambio() && (
                <div>
                  <label className="block text-sm text-white/70 mb-2">Tipo de Cambio</label>
                  <input type="number" step="0.01" value={transForm.tipoCambio} onChange={(e) => setTransForm({...transForm, tipoCambio: e.target.value})} className="input-field" placeholder="Ej: 1050" required />
                </div>
              )}
              <div>
                <label className="block text-sm text-white/70 mb-2">Concepto (opcional)</label>
                <input type="text" value={transForm.concepto} onChange={(e) => setTransForm({...transForm, concepto: e.target.value})} className="input-field" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center"><ArrowRightLeft className="w-4 h-4" /> Transferir</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cajas;
