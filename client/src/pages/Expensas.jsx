import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FileText, Plus, X, Check, Trash2, Building2, RefreshCw, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmt = (n, moneda = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(n || 0);

// ─── Tab Liquidaciones ────────────────────────────────────────────────────────
function TabLiquidaciones({ edificios }) {
  const hoy = new Date();
  const [edificio, setEdificio] = useState('');
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [año, setAño]   = useState(hoy.getFullYear());
  const [liq, setLiq]   = useState(null);   // liquidacion actual
  const [props, setProps] = useState([]);   // propiedades del edificio con coef
  const [saving, setSaving] = useState(false);
  const [liquidando, setLiquidando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [estadosDepto, setEstadosDepto] = useState({});  // propiedadId → estado

  // Cargar liquidacion cuando cambia edificio/mes/año
  useEffect(() => {
    if (!edificio) return;
    setResultado(null);
    axios.get('/api/liquidaciones', { params: { edificio, mes, año } })
      .then(r => setLiq(r.data))
      .catch(() => setLiq(null));
    // Propiedades del edificio
    axios.get(`/api/ventas/propiedades?edificio=${edificio}`)
      .then(r => setProps(r.data))
      .catch(() => setProps([]));
    // Cargar estados de pago por depto
    axios.get('/api/expensas/por-edificio', { params: { edificio, mes, año } })
      .then(r => {
        const map = {};
        r.data.forEach(e => { map[e.propiedadId] = e.estado; });
        setEstadosDepto(map);
      })
      .catch(() => setEstadosDepto({}));
  }, [edificio, mes, año]);

  const montoTotal = (liq?.gastos || []).reduce((s, g) => s + (parseFloat(g.monto) || 0), 0);

  const addGasto = () => setLiq(prev => ({
    ...prev,
    gastos: [...(prev?.gastos || []), { descripcion: '', monto: '', esRecurrente: true, _new: true }]
  }));

  const updateGasto = (i, field, value) => setLiq(prev => {
    const gastos = [...prev.gastos];
    gastos[i] = { ...gastos[i], [field]: value };
    return { ...prev, gastos };
  });

  const removeGasto = (i) => setLiq(prev => ({
    ...prev,
    gastos: prev.gastos.filter((_, idx) => idx !== i)
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        edificio,
        periodo: { mes, año },
        gastos: liq.gastos.map(g => ({ descripcion: g.descripcion, monto: parseFloat(g.monto) || 0, esRecurrente: !!g.esRecurrente })),
        moneda: liq.moneda || 'ARS',
        fechaVencimiento: liq.fechaVencimiento || undefined,
        notas: liq.notas
      };
      const res = await axios.post('/api/liquidaciones', payload);
      setLiq(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLiquidar = async () => {
    if (!liq?._id) {
      alert('Guardá primero los gastos antes de liquidar');
      return;
    }
    if (!confirm(`¿Generar expensas para ${MESES[mes-1]} ${año}?\nEsto creará una expensa por cada propiedad con coeficiente asignado.`)) return;
    setLiquidando(true);
    try {
      const res = await axios.post(`/api/liquidaciones/${liq._id}/liquidar`);
      setResultado(res.data);
      setLiq(prev => ({ ...prev, estado: 'liquidada' }));
      // Refrescar estados de pago
      axios.get('/api/expensas/por-edificio', { params: { edificio, mes, año } })
        .then(r => { const map = {}; r.data.forEach(e => { map[e.propiedadId] = e.estado; }); setEstadosDepto(map); })
        .catch(() => {});
    } catch (err) {
      alert(err.response?.data?.error || 'Error al liquidar');
    } finally {
      setLiquidando(false);
    }
  };

  const handleCoeficiente = async (propId, valor) => {
    try {
      const res = await axios.put(`/api/liquidaciones/propiedad/${propId}/coeficiente`, { coeficiente: valor });
      setProps(prev => prev.map(p => p._id === propId ? { ...p, coeficiente: res.data.coeficiente } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const esLiquidada = liq?.estado === 'liquidada';
  const sumaCoef = props.reduce((s, p) => s + (parseFloat(p.coeficiente) || 0), 0);

  return (
    <div className="space-y-5">
      {/* Selector edificio / periodo */}
      <div className="bg-white rounded-2xl p-5 shadow border border-green-100">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Edificio</label>
            <select value={edificio} onChange={e => setEdificio(e.target.value)} className="input-field">
              <option value="">-- Seleccionar --</option>
              {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mes</label>
            <select value={mes} onChange={e => setMes(parseInt(e.target.value))} className="input-field">
              {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Año</label>
            <input type="number" value={año} onChange={e => setAño(parseInt(e.target.value))} className="input-field" />
          </div>
        </div>
      </div>

      {!edificio && (
        <div className="bg-white rounded-2xl p-12 text-center shadow border border-green-100">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Seleccioná un edificio para empezar</p>
        </div>
      )}

      {edificio && liq && (
        <>
          {/* Estado badge */}
          {esLiquidada && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Período liquidado — las expensas ya fueron generadas
            </div>
          )}
          {resultado && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              ✓ Se generaron <strong>{resultado.generadas}</strong> expensas
              {resultado.omitidas > 0 && ` (${resultado.omitidas} ya existían)`}
              — Total distribuido: <strong>{fmt(resultado.montoTotal, liq.moneda)}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Panel gastos */}
            <div className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Gastos del edificio</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={liq.moneda || 'ARS'}
                    onChange={e => setLiq(p => ({ ...p, moneda: e.target.value }))}
                    disabled={esLiquidada}
                    className="input-field py-1 text-sm w-20"
                  >
                    <option>ARS</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {(liq.gastos || []).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">Sin gastos. Agregá el primero.</p>
                )}
                {(liq.gastos || []).map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={g.descripcion}
                      onChange={e => updateGasto(i, 'descripcion', e.target.value)}
                      placeholder="Concepto (ej: Municipalidad)"
                      disabled={esLiquidada}
                      className="input-field flex-1 text-sm py-2"
                    />
                    <input
                      type="number"
                      value={g.monto}
                      onChange={e => updateGasto(i, 'monto', e.target.value)}
                      placeholder="Monto"
                      disabled={esLiquidada}
                      className="input-field w-32 text-sm py-2"
                    />
                    <label className="flex items-center gap-1 cursor-pointer" title="Repetir el mes siguiente">
                      <input
                        type="checkbox"
                        checked={!!g.esRecurrente}
                        onChange={e => updateGasto(i, 'esRecurrente', e.target.checked)}
                        disabled={esLiquidada}
                        className="w-4 h-4 accent-green-600"
                      />
                      <RefreshCw className="w-3.5 h-3.5 text-green-500" />
                    </label>
                    {!esLiquidada && (
                      <button onClick={() => removeGasto(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {!esLiquidada && (
                  <button onClick={addGasto} className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-sm text-green-600 hover:bg-green-50 rounded-xl border border-dashed border-green-300 transition-all">
                    <Plus className="w-4 h-4" /> Agregar concepto
                  </button>
                )}
              </div>

              {/* Total + fecha vencimiento */}
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fecha vencimiento</label>
                  <input
                    type="date"
                    value={liq.fechaVencimiento ? liq.fechaVencimiento.slice(0,10) : ''}
                    onChange={e => setLiq(p => ({ ...p, fechaVencimiento: e.target.value }))}
                    disabled={esLiquidada}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-gray-600 font-medium">Total edificio</span>
                  <span className="text-xl font-bold text-green-700">{fmt(montoTotal, liq.moneda)}</span>
                </div>

                {!esLiquidada && (
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving} className="flex-1 btn-secondary justify-center text-sm">
                      {saving ? 'Guardando...' : 'Guardar borrador'}
                    </button>
                    <button
                      onClick={handleLiquidar}
                      disabled={liquidando || !liq._id || montoTotal === 0}
                      className="flex-1 btn-primary justify-center text-sm disabled:opacity-50"
                    >
                      {liquidando ? 'Generando...' : `Liquidar → ${props.filter(p => p.coeficiente > 0).length} expensas`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel distribución por depto */}
            <div className="bg-white rounded-2xl shadow border border-green-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Distribución por depto</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${Math.abs(sumaCoef - 100) < 0.1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  Σ coef: {sumaCoef.toFixed(2)}%
                </span>
              </div>
              {props.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No hay propiedades en este edificio</div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium text-xs">Unidad</th>
                        <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Estado</th>
                        <th className="px-4 py-2 text-center text-gray-500 font-medium text-xs">Coef %</th>
                        <th className="px-4 py-2 text-right text-gray-500 font-medium text-xs">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {props.map(p => {
                        const montoProp = montoTotal > 0 && p.coeficiente > 0
                          ? Math.round(montoTotal * p.coeficiente / 100)
                          : 0;
                        const estadoPago = estadosDepto[p._id];
                        return (
                          <tr key={p._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium">
                              <span className={estadoPago === 'pagada' ? 'text-emerald-700' : estadoPago === 'pendiente' ? 'text-rose-600' : 'text-gray-800'}>
                                {p.nombre || p.codigo}
                              </span>
                              {p.ubicacion?.piso && <span className="text-gray-400 text-xs ml-1">P{p.ubicacion.piso} U{p.ubicacion.unidad}</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {estadoPago === 'pagada' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Al día
                                </span>
                              )}
                              {estadoPago === 'pendiente' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Debe
                                </span>
                              )}
                              {!estadoPago && (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <input
                                type="number"
                                value={p.coeficiente || ''}
                                onChange={e => setProps(prev => prev.map(pp => pp._id === p._id ? { ...pp, coeficiente: e.target.value } : pp))}
                                onBlur={e => handleCoeficiente(p._id, e.target.value)}
                                placeholder="0"
                                step="0.01"
                                min="0"
                                max="100"
                                className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                              />
                            </td>
                            <td className={`px-4 py-2.5 text-right font-medium ${montoProp > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                              {montoProp > 0 ? fmt(montoProp, liq.moneda) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {Math.abs(sumaCoef - 100) > 0.1 && sumaCoef > 0 && (
                <div className="px-4 py-2.5 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700 bg-amber-50">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Los coeficientes suman {sumaCoef.toFixed(2)}% (deberían sumar 100%)
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab Expensas ─────────────────────────────────────────────────────────────
function TabExpensas() {
  const [expensas, setExpensas] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    propiedad: '', mes: new Date().getMonth() + 1, año: new Date().getFullYear(),
    montoTotal: '', moneda: 'ARS', ordinarias: '', extraordinarias: '', servicios: '', otros: '',
    fechaVencimiento: '', notas: ''
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => { if (form[k] !== null && form[k] !== '') formData.append(k, form[k]); });
      await axios.post('/api/expensas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setForm({ propiedad: '', mes: new Date().getMonth() + 1, año: new Date().getFullYear(), montoTotal: '', moneda: 'ARS', ordinarias: '', extraordinarias: '', servicios: '', otros: '', fechaVencimiento: '', notas: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handlePagar  = async (id) => { await axios.put(`/api/expensas/${id}/pagar`); fetchData(); };
  const handleDelete = async (id) => { if (confirm('¿Eliminar?')) { await axios.delete(`/api/expensas/${id}`); fetchData(); } };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Nueva Expensa</button>
      </div>
      <div className="bg-white rounded-2xl shadow border border-green-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-medium">
              <th className="text-left px-5 py-3">Propiedad</th>
              <th className="text-left px-5 py-3">Período</th>
              <th className="text-left px-5 py-3">Vencimiento</th>
              <th className="text-right px-5 py-3">Monto</th>
              <th className="text-center px-5 py-3">Estado</th>
              <th className="text-right px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expensas.map(exp => (
              <tr key={exp._id} className="border-b border-gray-100 hover:bg-green-50">
                <td className="px-5 py-3 text-gray-800">{exp.propiedad?.nombre || exp.propiedad?.codigo}</td>
                <td className="px-5 py-3">{MESES[exp.periodo.mes - 1]} {exp.periodo.año}</td>
                <td className="px-5 py-3 text-gray-500">{exp.fechaVencimiento ? new Date(exp.fechaVencimiento).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3 text-right font-medium text-amber-600">{fmt(exp.montoTotal, exp.moneda)}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${exp.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{exp.estado}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {exp.estado === 'pendiente' && (
                      <button onClick={() => handlePagar(exp._id)} className="p-1.5 hover:bg-green-100 rounded-lg" title="Marcar pagada"><Check className="w-4 h-4 text-emerald-600" /></button>
                    )}
                    <button onClick={() => handleDelete(exp._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expensas.length === 0 && <p className="text-center text-gray-400 py-8">No hay expensas registradas</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Nueva Expensa</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Propiedad</label>
                <select value={form.propiedad} onChange={e => setForm({...form, propiedad: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {propiedades.map(p => <option key={p._id} value={p._id}>{p.nombre || p.codigo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mes</label>
                  <select value={form.mes} onChange={e => setForm({...form, mes: e.target.value})} className="input-field">
                    {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Año</label>
                  <input type="number" value={form.año} onChange={e => setForm({...form, año: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Monto Total</label>
                  <input type="number" value={form.montoTotal} onChange={e => setForm({...form, montoTotal: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Moneda</label>
                  <select value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})} className="input-field">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha Vencimiento</label>
                <input type="date" value={form.fechaVencimiento} onChange={e => setForm({...form, fechaVencimiento: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="input-field" rows="2" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Crear Expensa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function Expensas() {
  const [tab, setTab] = useState('liquidaciones');
  const [edificios, setEdificios] = useState([]);

  useEffect(() => {
    axios.get('/api/edificios').then(r => setEdificios(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-800">Expensas</h1>
        <p className="text-gray-500 mt-1">Liquidación por edificio y gestión de expensas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'liquidaciones', label: 'Liquidaciones por edificio' },
          { key: 'expensas',      label: 'Todas las expensas' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 font-medium text-sm transition-all border-b-2 -mb-px ${
              tab === t.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'liquidaciones' && <TabLiquidaciones edificios={edificios} />}
      {tab === 'expensas'      && <TabExpensas />}
    </div>
  );
}

export default Expensas;
