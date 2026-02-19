import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, X, CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

function Certificados() {
  const [certificados, setCertificados] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [form, setForm] = useState({
    obra: '', contratista: { nombre: '', cuit: '' }, descripcion: '', montoTotal: '', moneda: 'ARS'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certRes, cajasRes] = await Promise.all([
        axios.get('/api/certificados'),
        axios.get('/api/cajas')
      ]);
      setCertificados(certRes.data);
      setCajas(cajasRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/certificados', { ...form, montoTotal: parseFloat(form.montoTotal) });
      setShowModal(false);
      setForm({ obra: '', contratista: { nombre: '', cuit: '' }, descripcion: '', montoTotal: '', moneda: 'ARS' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const aprobar = async (id) => {
    try {
      await axios.post(`/api/certificados/${id}/aprobar`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const pagar = async (cajaId) => {
    try {
      await axios.post(`/api/certificados/${selectedCert._id}/pagar`, { cajaId });
      setShowPagoModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n, c = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const pendientes = certificados.filter(c => c.estado === 'pendiente');
  const aprobados = certificados.filter(c => c.estado === 'aprobado');
  const pagados = certificados.filter(c => c.estado === 'pagado');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Certificados</h1>
          <p className="text-white/60 mt-1">Certificados de obra al obrador</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nuevo Certificado</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20"><Clock className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Pendientes</p>
              <p className="text-xl font-bold text-white">{pendientes.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20"><CheckCircle className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Aprobados</p>
              <p className="text-xl font-bold text-white">{aprobados.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Por Pagar (ARS)</p>
              <p className="text-lg font-bold text-white">{fmt(aprobados.filter(c => c.moneda === 'ARS').reduce((s, c) => s + c.montoTotal, 0), 'ARS')}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20"><DollarSign className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-white/60 text-sm">Por Pagar (USD)</p>
              <p className="text-lg font-bold text-white">{fmt(aprobados.filter(c => c.moneda === 'USD').reduce((s, c) => s + c.montoTotal, 0), 'USD')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Todos los Certificados</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-white/50 text-sm border-b border-white/10">
                <th className="pb-3 font-medium">Número</th>
                <th className="pb-3 font-medium">Obra</th>
                <th className="pb-3 font-medium">Contratista</th>
                <th className="pb-3 font-medium">Descripción</th>
                <th className="pb-3 font-medium">Monto</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {certificados.map((c) => (
                <tr key={c._id} className="table-row">
                  <td className="py-3 font-mono text-white/70">{c.numero}</td>
                  <td className="py-3 text-white">{c.obra}</td>
                  <td className="py-3 text-white">{c.contratista?.nombre}</td>
                  <td className="py-3 text-white/70 max-w-xs truncate">{c.descripcion}</td>
                  <td className="py-3 font-semibold text-white">{fmt(c.montoTotal, c.moneda)}</td>
                  <td className="py-3">
                    <span className={`badge ${c.estado === 'pagado' ? 'badge-success' : c.estado === 'aprobado' ? 'badge-info' : c.estado === 'rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {c.estado === 'pendiente' && (
                        <button onClick={() => aprobar(c._id)} className="text-sm text-blue-400 hover:text-blue-300">Aprobar</button>
                      )}
                      {c.estado === 'aprobado' && (
                        <button onClick={() => { setSelectedCert(c); setShowPagoModal(true); }} className="text-sm text-emerald-400 hover:text-emerald-300">Pagar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {certificados.length === 0 && <p className="text-white/50 text-center py-8">No hay certificados</p>}
        </div>
      </div>

      {/* Modal Nuevo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nuevo Certificado</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Obra</label>
                <input type="text" value={form.obra} onChange={(e) => setForm({...form, obra: e.target.value})} className="input-field" placeholder="Nombre del proyecto/obra" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Contratista</label>
                  <input type="text" value={form.contratista.nombre} onChange={(e) => setForm({...form, contratista: {...form.contratista, nombre: e.target.value}})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">CUIT</label>
                  <input type="text" value={form.contratista.cuit} onChange={(e) => setForm({...form, contratista: {...form.contratista, cuit: e.target.value}})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} className="input-field" rows="3" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Monto Total</label>
                  <input type="number" value={form.montoTotal} onChange={(e) => setForm({...form, montoTotal: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm({...form, moneda: e.target.value})} className="input-field">
                    <option value="ARS">Pesos (ARS)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Crear Certificado</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPagoModal && selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Pagar Certificado</h3>
              <button onClick={() => setShowPagoModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <div className="mb-4 p-4 rounded-lg bg-white/5">
              <p className="text-white font-medium">{selectedCert.numero}</p>
              <p className="text-white/60 text-sm">{selectedCert.contratista?.nombre}</p>
              <p className="text-2xl font-bold text-white mt-2">{fmt(selectedCert.montoTotal, selectedCert.moneda)}</p>
            </div>
            <p className="text-white/70 mb-4">Seleccionar caja para debitar:</p>
            <div className="space-y-2">
              {cajas.filter(c => c.tipo === selectedCert.moneda).map(c => (
                <button key={c._id} onClick={() => pagar(c._id)} className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all">
                  <span className="text-white">{c.nombre}</span>
                  <span className={`font-semibold ${c.saldo >= selectedCert.montoTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmt(c.saldo, c.tipo)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Certificados;
