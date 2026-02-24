import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, X, Check, Trash2 } from 'lucide-react';

function Expensas() {
  const [expensas, setExpensas] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    propiedad: '', mes: new Date().getMonth() + 1, año: new Date().getFullYear(),
    montoTotal: '', moneda: 'ARS', ordinarias: '', extraordinarias: '', servicios: '', otros: '',
    fechaVencimiento: '', notas: '', archivo: null
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, propRes] = await Promise.all([
        axios.get('/api/expensas'),
        axios.get('/api/ventas/propiedades')
      ]);
      setExpensas(expRes.data);
      setPropiedades(propRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      await axios.post('/api/expensas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setForm({
        propiedad: '', mes: new Date().getMonth() + 1, año: new Date().getFullYear(),
        montoTotal: '', moneda: 'ARS', ordinarias: '', extraordinarias: '', servicios: '', otros: '',
        fechaVencimiento: '', notas: '', archivo: null
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handlePagar = async (id) => {
    try {
      await axios.put(`/api/expensas/${id}/pagar`);
      fetchData();
    } catch (err) {
      alert('Error al marcar como pagada');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta expensa?')) {
      await axios.delete(`/api/expensas/${id}`);
      fetchData();
    }
  };

  const fmt = (n, moneda = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(n || 0);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Expensas</h1>
          <p className="text-white/60 mt-1">Gestión de expensas por propiedad</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nueva Expensa</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 text-white/60 font-medium">Propiedad</th>
                <th className="text-left py-3 text-white/60 font-medium">Período</th>
                <th className="text-left py-3 text-white/60 font-medium">Vencimiento</th>
                <th className="text-right py-3 text-white/60 font-medium">Monto</th>
                <th className="text-center py-3 text-white/60 font-medium">Estado</th>
                <th className="text-right py-3 text-white/60 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expensas.map(exp => (
                <tr key={exp._id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 text-white">{exp.propiedad?.nombre || exp.propiedad?.codigo}</td>
                  <td className="py-3 text-white">{meses[exp.periodo.mes - 1]} {exp.periodo.año}</td>
                  <td className="py-3 text-white/60">{exp.fechaVencimiento ? new Date(exp.fechaVencimiento).toLocaleDateString() : '-'}</td>
                  <td className="py-3 text-right font-medium text-amber-400">{fmt(exp.montoTotal, exp.moneda)}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${exp.estado === 'pagada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {exp.estado}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {exp.estado === 'pendiente' && (
                        <button onClick={() => handlePagar(exp._id)} className="p-2 hover:bg-white/10 rounded-lg" title="Marcar pagada">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(exp._id)} className="p-2 hover:bg-white/10 rounded-lg">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expensas.length === 0 && <p className="text-center text-white/50 py-8">No hay expensas registradas</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nueva Expensa</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Propiedad</label>
                <select value={form.propiedad} onChange={(e) => setForm({...form, propiedad: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {propiedades.map(p => <option key={p._id} value={p._id}>{p.nombre || p.codigo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Mes</label>
                  <select value={form.mes} onChange={(e) => setForm({...form, mes: e.target.value})} className="input-field">
                    {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Año</label>
                  <input type="number" value={form.año} onChange={(e) => setForm({...form, año: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Monto Total</label>
                  <input type="number" value={form.montoTotal} onChange={(e) => setForm({...form, montoTotal: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm({...form, moneda: e.target.value})} className="input-field">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Ordinarias</label>
                  <input type="number" value={form.ordinarias} onChange={(e) => setForm({...form, ordinarias: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Extraordinarias</label>
                  <input type="number" value={form.extraordinarias} onChange={(e) => setForm({...form, extraordinarias: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Servicios</label>
                  <input type="number" value={form.servicios} onChange={(e) => setForm({...form, servicios: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Otros</label>
                  <input type="number" value={form.otros} onChange={(e) => setForm({...form, otros: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Fecha Vencimiento</label>
                <input type="date" value={form.fechaVencimiento} onChange={(e) => setForm({...form, fechaVencimiento: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Notas</label>
                <textarea value={form.notas} onChange={(e) => setForm({...form, notas: e.target.value})} className="input-field" rows="2"></textarea>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Adjuntar archivo</label>
                <input type="file" onChange={(e) => setForm({...form, archivo: e.target.files[0]})} className="input-field" accept="image/*,.pdf" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Crear Expensa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expensas;
