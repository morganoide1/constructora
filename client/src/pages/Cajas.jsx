import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Banknote, Plus, ArrowRightLeft, ArrowUpRight, ArrowDownRight, X, Settings, RefreshCw, Building2, Edit } from 'lucide-react';

function Cajas() {
  const [cajas, setCajas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [showEdificioModal, setShowEdificioModal] = useState(false);
  const [editingEdificio, setEditingEdificio] = useState(null);
  const [selectedCaja, setSelectedCaja] = useState(null);
  const [movForm, setMovForm] = useState({ tipo: 'ingreso', monto: '', concepto: '', notas: '', edificio: '', archivo: null });
  const [transForm, setTransForm] = useState({ cajaOrigenId: '', cajaDestinoId: '', monto: '', tipoCambio: '', concepto: '' });
  const [edificioForm, setEdificioForm] = useState({ 
    nombre: '', direccion: '', estado: 'en_construccion', 
    avanceObra: '', porcentajeVendido: '', rentabilidadPozo: '', 
    fechaInicioObra: '', fechaEntregaEstimada: '', 
    driveUrl: '', historialObraUrl: '', expensasUrl: '' 
  });

  const emptyEdificioForm = { 
    nombre: '', direccion: '', estado: 'en_construccion', 
    avanceObra: '', porcentajeVendido: '', rentabilidadPozo: '', 
    fechaInicioObra: '', fechaEntregaEstimada: '', 
    driveUrl: '', historialObraUrl: '', expensasUrl: '' 
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cajasRes, edificiosRes] = await Promise.all([
        axios.get('/api/cajas/dashboard'),
        axios.get('/api/edificios')
      ]);
      setCajas(cajasRes.data.cajas || []);
      setMovimientos(cajasRes.data.ultimosMovimientos || []);
      setEdificios(edificiosRes.data || []);
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
      const formData = new FormData();
      formData.append("tipo", movForm.tipo);
      formData.append("monto", movForm.monto);
      formData.append("concepto", movForm.concepto);
      formData.append("notas", movForm.notas || "");
      if (movForm.edificio) formData.append("edificio", movForm.edificio);
      if (movForm.archivo) formData.append("archivo", movForm.archivo);
      await axios.post(`/api/cajas/${selectedCaja._id}/movimiento`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setShowMovModal(false);
      setMovForm({ tipo: "ingreso", monto: "", concepto: "", notas: "", edificio: "", archivo: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
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

  const handleEdificio = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...edificioForm,
        avanceObra: edificioForm.avanceObra ? parseFloat(edificioForm.avanceObra) : undefined,
        porcentajeVendido: edificioForm.porcentajeVendido ? parseFloat(edificioForm.porcentajeVendido) : undefined,
        rentabilidadPozo: edificioForm.rentabilidadPozo ? parseFloat(edificioForm.rentabilidadPozo) : undefined,
        fechaInicioObra: edificioForm.fechaInicioObra || undefined,
        fechaEntregaEstimada: edificioForm.fechaEntregaEstimada || undefined
      };
      if (editingEdificio) {
        await axios.put(`/api/edificios/${editingEdificio}`, data);
      } else {
        await axios.post('/api/edificios', data);
      }
      setShowEdificioModal(false);
      setEdificioForm(emptyEdificioForm);
      setEditingEdificio(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEditEdificio = (edificio) => {
    setEdificioForm({
      nombre: edificio.nombre,
      direccion: edificio.direccion || '',
      estado: edificio.estado,
      avanceObra: edificio.avanceObra || '',
      porcentajeVendido: edificio.porcentajeVendido || '',
      rentabilidadPozo: edificio.rentabilidadPozo || '',
      fechaInicioObra: edificio.fechaInicioObra ? edificio.fechaInicioObra.split('T')[0] : '',
      fechaEntregaEstimada: edificio.fechaEntregaEstimada ? edificio.fechaEntregaEstimada.split('T')[0] : '',
      driveUrl: edificio.driveUrl || '',
      historialObraUrl: edificio.historialObraUrl || '',
      expensasUrl: edificio.expensasUrl || ''
    });
    setEditingEdificio(edificio._id);
    setShowEdificioModal(true);
  };

  const closeEdificioModal = () => {
    setShowEdificioModal(false);
    setEditingEdificio(null);
    setEdificioForm(emptyEdificioForm);
  };

  const fmt = (n, c = 'USD') => new Intl.NumberFormat('es-AR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n || 0);

  const needsTipoCambio = () => {
    if (!transForm.cajaOrigenId || !transForm.cajaDestinoId) return false;
    const origen = cajas.find(c => c._id === transForm.cajaOrigenId);
    const destino = cajas.find(c => c._id === transForm.cajaDestinoId);
    return origen && destino && origen.tipo !== destino.tipo;
  };

  const getEdificioNombre = (edificioId) => {
    const edificio = edificios.find(e => e._id === edificioId);
    return edificio ? edificio.nombre : '-';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Cajas</h1>
          <p className="text-gray-500 mt-1">Gestión de fondos y movimientos</p>
        </div>
        <div className="flex gap-3">
          {cajas.length === 0 && (
            <button onClick={setupCajas} className="btn-primary"><Settings className="w-4 h-4" /> Configurar Cajas</button>
          )}
          {cajas.length > 0 && (
            <button onClick={() => setShowTransModal(true)} className="btn-secondary"><ArrowRightLeft className="w-4 h-4" /> Transferir</button>
          )}
          <button onClick={() => setShowEdificioModal(true)} className="btn-secondary"><Building2 className="w-4 h-4" /> Nuevo Edificio</button>
          <button onClick={fetchData} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cajas.map(caja => (
          <div key={caja._id} className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${caja.tipo === 'USD' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                {caja.tipo === 'USD' ? <DollarSign className="w-6 h-6 text-emerald-600" /> : <Banknote className="w-6 h-6 text-blue-600" />}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${caja.categoria === 'principal' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {caja.categoria}
              </span>
            </div>
            <h3 className="text-gray-800 font-medium mb-1">{caja.nombre}</h3>
            <p className={`text-2xl font-bold ${caja.tipo === 'USD' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {fmt(caja.saldo, caja.tipo)}
            </p>
            <button
              onClick={() => { setSelectedCaja(caja); setShowMovModal(true); }}
              className="w-full mt-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar Movimiento
            </button>
          </div>
        ))}
      </div>

      {/* Edificios */}
      {edificios.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Edificios ({edificios.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {edificios.map(ed => (
              <div key={ed._id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-gray-800 font-medium">{ed.nombre}</h4>
                  <button onClick={() => handleEditEdificio(ed)} className="p-1 hover:bg-green-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                </div>
                <p className="text-gray-500 text-sm mb-2">{ed.direccion || 'Sin dirección'}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${ed.estado === 'en_construccion' ? 'bg-amber-100 text-amber-700' : ed.estado === 'finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ed.estado.replace('_', ' ')}
                  </span>
                  {ed.avanceObra > 0 && <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{ed.avanceObra}% avance</span>}
                  {ed.porcentajeVendido > 0 && <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">{ed.porcentajeVendido}% vendido</span>}
                </div>
                {ed.rentabilidadPozo > 0 && <p className="text-xs text-gray-500">Rentabilidad media inversor pozo: {ed.rentabilidadPozo}%</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movimientos */}
      {movimientos.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium">Fecha</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Caja</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Edificio</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Concepto</th>
                  <th className="text-left py-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-right py-3 text-gray-500 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m._id} className="border-b border-gray-100 hover:bg-green-50">
                    <td className="py-3 text-gray-500">{new Date(m.fecha).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-800">{m.caja?.nombre}</td>
                    <td className="py-3 text-gray-600">{m.edificio ? getEdificioNombre(m.edificio) : '-'}</td>
                    <td className="py-3 text-gray-800">{m.concepto}</td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-medium ${m.tipo.includes('ingreso') || m.tipo.includes('entrada') ? 'text-emerald-600' : 'text-rose-600'}`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Nuevo Movimiento</h3>
              <button onClick={() => setShowMovModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-gray-500 mb-4">Caja: <span className="text-gray-800">{selectedCaja?.nombre}</span></p>
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tipo</label>
                <select value={movForm.tipo} onChange={(e) => setMovForm({...movForm, tipo: e.target.value})} className="input-field">
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Edificio</label>
                <select value={movForm.edificio} onChange={(e) => setMovForm({...movForm, edificio: e.target.value})} className="input-field">
                  <option value="">-- Sin asignar --</option>
                  {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Monto</label>
                <input type="number" step="0.01" value={movForm.monto} onChange={(e) => setMovForm({...movForm, monto: e.target.value})} className="input-field" placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Concepto</label>
                <input type="text" value={movForm.concepto} onChange={(e) => setMovForm({...movForm, concepto: e.target.value})} className="input-field" placeholder="Descripción del movimiento" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Notas (opcional)</label>
                <textarea value={movForm.notas} onChange={(e) => setMovForm({...movForm, notas: e.target.value})} className="input-field" rows="2"></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Adjuntar archivo (opcional)</label>
                <input type="file" onChange={(e) => setMovForm({...movForm, archivo: e.target.files[0]})} className="input-field" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Movimiento</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {showTransModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Transferencia entre Cajas</h3>
              <button onClick={() => setShowTransModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleTransferencia} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Caja Origen</label>
                <select value={transForm.cajaOrigenId} onChange={(e) => setTransForm({...transForm, cajaOrigenId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {cajas.map(c => <option key={c._id} value={c._id}>{c.nombre} ({fmt(c.saldo, c.tipo)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Caja Destino</label>
                <select value={transForm.cajaDestinoId} onChange={(e) => setTransForm({...transForm, cajaDestinoId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {cajas.filter(c => c._id !== transForm.cajaOrigenId).map(c => <option key={c._id} value={c._id}>{c.nombre} ({fmt(c.saldo, c.tipo)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Monto</label>
                <input type="number" step="0.01" value={transForm.monto} onChange={(e) => setTransForm({...transForm, monto: e.target.value})} className="input-field" placeholder="0.00" required />
              </div>
              {needsTipoCambio() && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Tipo de Cambio</label>
                  <input type="number" step="0.01" value={transForm.tipoCambio} onChange={(e) => setTransForm({...transForm, tipoCambio: e.target.value})} className="input-field" placeholder="Ej: 1000" required />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Concepto</label>
                <input type="text" value={transForm.concepto} onChange={(e) => setTransForm({...transForm, concepto: e.target.value})} className="input-field" placeholder="Motivo de la transferencia" required />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Realizar Transferencia</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edificio */}
      {showEdificioModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editingEdificio ? 'Editar Edificio' : 'Nuevo Edificio'}</h3>
              <button onClick={closeEdificioModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleEdificio} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Nombre del Edificio</label>
                  <input type="text" value={edificioForm.nombre} onChange={(e) => setEdificioForm({...edificioForm, nombre: e.target.value})} className="input-field" placeholder="Ej: Torre Norte" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Dirección</label>
                  <input type="text" value={edificioForm.direccion} onChange={(e) => setEdificioForm({...edificioForm, direccion: e.target.value})} className="input-field" placeholder="Ej: Av. Principal 123" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Estado</label>
                  <select value={edificioForm.estado} onChange={(e) => setEdificioForm({...edificioForm, estado: e.target.value})} className="input-field">
                    <option value="en_construccion">En Construcción</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="en_venta">En Venta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">% Avance de Obra</label>
                  <input type="number" min="0" max="100" value={edificioForm.avanceObra} onChange={(e) => setEdificioForm({...edificioForm, avanceObra: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">% Vendido</label>
                  <input type="number" min="0" max="100" value={edificioForm.porcentajeVendido} onChange={(e) => setEdificioForm({...edificioForm, porcentajeVendido: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">% Rentabilidad media estimada inversor pozo</label>
                  <input type="number" value={edificioForm.rentabilidadPozo} onChange={(e) => setEdificioForm({...edificioForm, rentabilidadPozo: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Fecha Inicio Obra</label>
                  <input type="date" value={edificioForm.fechaInicioObra} onChange={(e) => setEdificioForm({...edificioForm, fechaInicioObra: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Fecha Entrega Estimada</label>
                  <input type="date" value={edificioForm.fechaEntregaEstimada} onChange={(e) => setEdificioForm({...edificioForm, fechaEntregaEstimada: e.target.value})} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Link Google Drive</label>
                  <input type="url" value={edificioForm.driveUrl} onChange={(e) => setEdificioForm({...edificioForm, driveUrl: e.target.value})} className="input-field" placeholder="https://drive.google.com/..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Link Historial Obra</label>
                  <input type="url" value={edificioForm.historialObraUrl} onChange={(e) => setEdificioForm({...edificioForm, historialObraUrl: e.target.value})} className="input-field" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Link Expensas</label>
                  <input type="url" value={edificioForm.expensasUrl} onChange={(e) => setEdificioForm({...edificioForm, expensasUrl: e.target.value})} className="input-field" placeholder="https://..." />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">{editingEdificio ? 'Guardar Cambios' : 'Crear Edificio'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cajas;
