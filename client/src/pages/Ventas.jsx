import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, X, Edit, ImagePlus, Link } from 'lucide-react';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPropModal, setShowPropModal] = useState(false);
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showEditVentaModal, setShowEditVentaModal] = useState(false);
  const [editingPropiedad, setEditingPropiedad] = useState(null);
  const [editingVenta, setEditingVenta] = useState(null);
  const [uploadingImagenEdificio, setUploadingImagenEdificio] = useState(null);
  const [editingEdificio, setEditingEdificio] = useState(null);
  const [edificioLinkForm, setEdificioLinkForm] = useState({ linkPagoAutomatico: '', linkPagoMomento: '' });
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [propForm, setPropForm] = useState({ codigo: '', nombre: '', tipo: 'departamento', precioLista: '', valorFuturo: '', edificio: '', ubicacion: { piso: '', unidad: '' } });
  const [ventaForm, setVentaForm] = useState({ propiedadId: '', clienteId: '', precioVenta: '', anticipo: { monto: '' }, modalidad: 'cuotas', cuotasNum: 12 });
  const [pagoForm, setPagoForm] = useState({ tipoPago: 'cuota', cuotaNumero: '', monto: '', cajaId: '', notas: '' });
  const [editVentaForm, setEditVentaForm] = useState({ precioVenta: '', anticipo: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ventasRes, propsRes, clientesRes, edificiosRes, cajasRes] = await Promise.all([
        axios.get('/api/ventas').catch(() => ({ data: [] })),
        axios.get('/api/ventas/propiedades').catch(() => ({ data: [] })),
        axios.get('/api/clientes').catch(() => ({ data: [] })),
        axios.get('/api/edificios').catch(() => ({ data: [] })),
        axios.get('/api/cajas').catch(() => ({ data: [] }))
      ]);
      setVentas(ventasRes.data);
      setPropiedades(propsRes.data);
      setClientes(clientesRes.data);
      setEdificios(edificiosRes.data);
      setCajas(cajasRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPropiedad = (prop) => {
    setPropForm({ codigo: prop.codigo, nombre: prop.nombre, tipo: prop.tipo, precioLista: prop.precioLista, valorFuturo: prop.valorFuturo || '', edificio: prop.edificio?._id || prop.edificio || '', ubicacion: { piso: prop.ubicacion?.piso || '', unidad: prop.ubicacion?.unidad || '' } });
    setEditingPropiedad(prop._id);
    setShowPropModal(true);
  };

  const handlePropiedad = async (e) => {
    e.preventDefault();
    try {
      if (editingPropiedad) {
        await axios.put(`/api/ventas/propiedades/${editingPropiedad}`, { ...propForm, precioLista: parseFloat(propForm.precioLista), valorFuturo: propForm.valorFuturo ? parseFloat(propForm.valorFuturo) : undefined });
      } else {
        await axios.post('/api/ventas/propiedades', { ...propForm, precioLista: parseFloat(propForm.precioLista), valorFuturo: propForm.valorFuturo ? parseFloat(propForm.valorFuturo) : undefined });
      }
      setShowPropModal(false);
      setPropForm({ codigo: '', nombre: '', tipo: 'departamento', precioLista: '', valorFuturo: '', edificio: '', ubicacion: { piso: '', unidad: '' } });
      setEditingPropiedad(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleVenta = async (e) => {
    e.preventDefault();
    try {
      const precio = parseFloat(ventaForm.precioVenta);
      const anticipo = parseFloat(ventaForm.anticipo.monto) || 0;
      let cuotas = [];
      if (ventaForm.modalidad === 'cuotas') {
        const numCuotas = parseInt(ventaForm.cuotasNum);
        const saldoFinanciar = precio - anticipo;
        const montoCuota = saldoFinanciar / numCuotas;
        cuotas = Array.from({ length: numCuotas }, (_, i) => ({ numero: i + 1, monto: montoCuota, fechaVencimiento: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000) }));
      }
      await axios.post('/api/ventas', { propiedadId: ventaForm.propiedadId, clienteId: ventaForm.clienteId, precioVenta: precio, anticipo: { monto: anticipo, pagado: ventaForm.modalidad === 'contado' }, cuotas });
      setShowVentaModal(false);
      setVentaForm({ propiedadId: '', clienteId: '', precioVenta: '', anticipo: { monto: '' }, modalidad: 'cuotas', cuotasNum: 12 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handlePago = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        monto: parseFloat(pagoForm.monto),
        cajaId: pagoForm.cajaId || undefined,
        notas: pagoForm.notas || undefined,
      };
      if (pagoForm.tipoPago === 'libre') {
        payload.pagoLibre = true;
      } else {
        payload.cuotaNumero = parseInt(pagoForm.cuotaNumero);
      }
      await axios.post(`/api/ventas/${selectedVenta._id}/pago`, payload);
      setShowPagoModal(false);
      setPagoForm({ tipoPago: 'cuota', cuotaNumero: '', monto: '', cajaId: '', notas: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEditVenta = (v) => {
    setEditingVenta(v._id);
    setEditVentaForm({ precioVenta: v.precioVenta, anticipo: v.anticipo?.monto || 0 });
    setShowEditVentaModal(true);
  };

  const handleUpdateVenta = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/ventas/${editingVenta}`, { precioVenta: parseFloat(editVentaForm.precioVenta), anticipo: { monto: parseFloat(editVentaForm.anticipo) || 0 } });
      setShowEditVentaModal(false);
      setEditingVenta(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const openEdificioLinks = (ed) => {
    setEditingEdificio(ed._id);
    setEdificioLinkForm({ linkPagoAutomatico: ed.linkPagoAutomatico || '', linkPagoMomento: ed.linkPagoMomento || '' });
  };

  const handleGuardarLinks = async () => {
    try {
      await axios.put(`/api/edificios/${editingEdificio}`, edificioLinkForm);
      setEditingEdificio(null);
      fetchData();
    } catch (err) {
      alert('Error al guardar');
    }
  };

  const handleImagenEdificio = async (edificioId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('imagen', file);
    try {
      await axios.put(`/api/edificios/${edificioId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
    } catch (err) {
      alert('Error al subir imagen');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-500 mt-1">Gestión de propiedades y ventas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPropModal(true)} className="btn-secondary"><Plus className="w-4 h-4" /> Nueva Propiedad</button>
          <button onClick={() => setShowVentaModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nueva Venta</button>
        </div>
      </div>

      {/* Edificios / Proyectos */}
      {edificios.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Proyectos ({edificios.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {edificios.map(ed => (
              <div key={ed._id} className="rounded-xl border border-gray-200 overflow-hidden">
                {ed.imagen
                  ? <img src={ed.imagen} alt={ed.nombre} className="w-full h-28 object-contain bg-gray-50" />
                  : <div className="w-full h-28 bg-gray-100 flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-300" /></div>
                }
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{ed.nombre}</p>
                  <label className="mt-1 flex items-center gap-1 text-xs text-green-600 hover:text-green-700 cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5" />
                    {ed.imagen ? 'Cambiar imagen' : 'Subir imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImagenEdificio(ed._id, e.target.files[0])} />
                  </label>
                  <button onClick={() => openEdificioLinks(ed)} className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <Link className="w-3.5 h-3.5" /> Links de pago
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Propiedades */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Propiedades ({propiedades.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propiedades.map((p) => (
            <div key={p._id} className={`p-4 rounded-xl border ${p.estado === 'disponible' ? 'border-emerald-200 bg-emerald-50' : p.estado === 'reservado' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-gray-500">{p.codigo}</span>
                <div className="flex items-center gap-2">
                  <span className={`badge ${p.estado === 'disponible' ? 'badge-success' : p.estado === 'reservado' ? 'badge-warning' : 'badge-info'}`}>{p.estado}</span>
                  <button onClick={() => handleEditPropiedad(p)} className="p-1 hover:bg-white/50 rounded"><Edit className="w-4 h-4 text-gray-400" /></button>
                </div>
              </div>
              <h4 className="font-semibold text-gray-800">{p.nombre}</h4>
              {p.ubicacion?.piso && <p className="text-sm text-gray-500">Piso {p.ubicacion.piso} - Unidad {p.ubicacion.unidad}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-800">{fmt(p.precioLista)}</span>
                {p.valorFuturo && <span className="text-sm text-emerald-600">Futuro: {fmt(p.valorFuturo)}</span>}
              </div>
            </div>
          ))}
          {propiedades.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No hay propiedades</p>}
        </div>
      </div>

      {/* Ventas */}
      {ventas.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas Registradas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-medium text-gray-500">Propiedad</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Precio</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Pagado</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Pendiente</th>
                  <th className="pb-3 text-left font-medium text-gray-500">Estado</th>
                  <th className="pb-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <tr key={v._id} className="border-b border-gray-100 hover:bg-green-50">
                    <td className="py-3 text-gray-800">{v.propiedad?.nombre || v.propiedad?.codigo}</td>
                    <td className="py-3 text-gray-800">{v.cliente?.nombre}</td>
                    <td className="py-3 text-gray-800">{fmt(v.precioVenta)}</td>
                    <td className="py-3 text-emerald-600">{fmt(v.totalPagado)}</td>
                    <td className="py-3 text-amber-600">{fmt(v.saldoPendiente)}</td>
                    <td className="py-3"><span className={`badge ${v.estado === 'escritura' ? 'badge-success' : 'badge-warning'}`}>{v.estado}</span></td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleEditVenta(v)} className="btn-secondary text-sm mr-2"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedVenta(v); setShowPagoModal(true); }} className="btn-secondary text-sm">Registrar Pago</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Propiedad */}
      {showPropModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editingPropiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
              <button onClick={() => { setShowPropModal(false); setEditingPropiedad(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handlePropiedad} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-2">Código</label><input type="text" value={propForm.codigo} onChange={(e) => setPropForm({...propForm, codigo: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-gray-600 mb-2">Tipo</label><select value={propForm.tipo} onChange={(e) => setPropForm({...propForm, tipo: e.target.value})} className="input-field"><option value="departamento">Departamento</option><option value="cochera">Cochera</option><option value="local">Local</option></select></div>
              </div>
              <div><label className="block text-sm text-gray-600 mb-2">Edificio</label><select value={propForm.edificio} onChange={(e) => setPropForm({...propForm, edificio: e.target.value})} className="input-field"><option value="">-- Seleccionar --</option>{edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}</select></div>
              <div><label className="block text-sm text-gray-600 mb-2">Nombre</label><input type="text" value={propForm.nombre} onChange={(e) => setPropForm({...propForm, nombre: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-2">Piso</label><input type="text" value={propForm.ubicacion.piso} onChange={(e) => setPropForm({...propForm, ubicacion: {...propForm.ubicacion, piso: e.target.value}})} className="input-field" /></div>
                <div><label className="block text-sm text-gray-600 mb-2">Unidad</label><input type="text" value={propForm.ubicacion.unidad} onChange={(e) => setPropForm({...propForm, ubicacion: {...propForm.ubicacion, unidad: e.target.value}})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-2">Precio (USD)</label><input type="number" value={propForm.precioLista} onChange={(e) => setPropForm({...propForm, precioLista: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-gray-600 mb-2">Valor Futuro</label><input type="number" value={propForm.valorFuturo} onChange={(e) => setPropForm({...propForm, valorFuturo: e.target.value})} className="input-field" /></div>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">{editingPropiedad ? 'Guardar' : 'Crear'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venta */}
      {showVentaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Nueva Venta</h3>
              <button onClick={() => setShowVentaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleVenta} className="space-y-4">
              <div><label className="block text-sm text-gray-600 mb-2">Propiedad</label><select value={ventaForm.propiedadId} onChange={(e) => setVentaForm({...ventaForm, propiedadId: e.target.value})} className="input-field" required><option value="">Seleccionar...</option>{propiedades.filter(p => p.estado === 'disponible').map(p => <option key={p._id} value={p._id}>{p.codigo} - {p.nombre}</option>)}</select></div>
              <div><label className="block text-sm text-gray-600 mb-2">Cliente</label><select value={ventaForm.clienteId} onChange={(e) => setVentaForm({...ventaForm, clienteId: e.target.value})} className="input-field" required><option value="">Seleccionar...</option>{clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}</select></div>
              <div><label className="block text-sm text-gray-600 mb-2">Precio de venta (USD)</label><input type="number" value={ventaForm.precioVenta} onChange={(e) => setVentaForm({...ventaForm, precioVenta: e.target.value})} className="input-field" required /></div>
              {/* Modalidad de pago */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Modalidad de pago</label>
                <div className="flex gap-2">
                  {[{ v: 'contado', label: 'Contado' }, { v: 'cuotas', label: 'En cuotas' }].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setVentaForm(f => ({ ...f, modalidad: opt.v }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${ventaForm.modalidad === opt.v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
              {ventaForm.modalidad === 'contado' ? (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Monto pagado al contado (USD)</label>
                  <input type="number" value={ventaForm.anticipo.monto} onChange={(e) => setVentaForm({...ventaForm, anticipo: { monto: e.target.value }})} className="input-field" placeholder="Igual al precio de venta si es pago total" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-2">Anticipo (USD)</label><input type="number" value={ventaForm.anticipo.monto} onChange={(e) => setVentaForm({...ventaForm, anticipo: { monto: e.target.value }})} className="input-field" placeholder="0" /></div>
                  <div><label className="block text-sm text-gray-600 mb-2">Cantidad de cuotas</label><input type="number" value={ventaForm.cuotasNum} onChange={(e) => setVentaForm({...ventaForm, cuotasNum: e.target.value})} className="input-field" min="1" max="120" /></div>
                </div>
              )}
              {ventaForm.modalidad === 'cuotas' && ventaForm.precioVenta && (
                <div className="px-4 py-3 bg-green-50 rounded-xl border border-green-200 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Saldo a financiar:</span><span className="font-medium">{fmt((parseFloat(ventaForm.precioVenta) || 0) - (parseFloat(ventaForm.anticipo.monto) || 0))}</span></div>
                  {ventaForm.cuotasNum > 0 && <div className="flex justify-between text-gray-600 mt-1"><span>Cuota estimada:</span><span className="font-medium">{fmt(((parseFloat(ventaForm.precioVenta) || 0) - (parseFloat(ventaForm.anticipo.monto) || 0)) / (parseInt(ventaForm.cuotasNum) || 1))}</span></div>}
                </div>
              )}
              <button type="submit" className="w-full btn-primary justify-center">Registrar Venta</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Registrar Pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-gray-500 mb-4 text-sm">Propiedad: <span className="text-gray-800 font-medium">{selectedVenta?.propiedad?.nombre}</span></p>
            <form onSubmit={handlePago} className="space-y-4">
              {/* Tipo de pago */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Tipo de pago</label>
                <div className="flex gap-2">
                  {[{ v: 'cuota', label: 'Cuota específica' }, { v: 'libre', label: 'Pago libre / anticipo' }].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setPagoForm(f => ({ ...f, tipoPago: opt.v, cuotaNumero: '' }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${pagoForm.tipoPago === opt.v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {pagoForm.tipoPago === 'cuota' ? (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Cuota</label>
                  {selectedVenta?.cuotas?.filter(c => c.estado !== 'pagada').length > 0 ? (
                    <select value={pagoForm.cuotaNumero} onChange={(e) => {
                      const cuota = selectedVenta.cuotas.find(c => c.numero === parseInt(e.target.value));
                      setPagoForm(f => ({ ...f, cuotaNumero: e.target.value, monto: cuota ? cuota.monto : f.monto }));
                    }} className="input-field" required>
                      <option value="">Seleccionar cuota...</option>
                      {selectedVenta.cuotas.filter(c => c.estado !== 'pagada').map(c => (
                        <option key={c.numero} value={c.numero}>
                          Cuota {c.numero} — {fmt(c.monto)}{c.estado === 'vencida' ? ' ⚠ Vencida' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-emerald-600 p-3 bg-emerald-50 rounded-xl">No hay cuotas pendientes</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Descripción (opcional)</label>
                  <input type="text" value={pagoForm.notas} onChange={(e) => setPagoForm(f => ({ ...f, notas: e.target.value }))} className="input-field" placeholder="Ej: Anticipo, adelanto cuotas 5-7, seña..." />
                </div>
              )}

              <div><label className="block text-sm text-gray-600 mb-2">Monto (USD)</label><input type="number" value={pagoForm.monto} onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})} className="input-field" required placeholder="0" /></div>
              <div><label className="block text-sm text-gray-600 mb-2">Depositar en Caja</label><select value={pagoForm.cajaId} onChange={(e) => setPagoForm({...pagoForm, cajaId: e.target.value})} className="input-field"><option value="">No registrar en caja</option>{cajas.filter(c => c.tipo === 'USD').map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}</select></div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Pago</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Links de pago edificio */}
      {editingEdificio && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-800">Links de pago</h3>
              <button onClick={() => setEditingEdificio(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Link pago automático mensual</label>
                <p className="text-xs text-gray-400 mb-1">El cliente se adhiere con tarjeta (puede tener precio especial)</p>
                <input type="url" value={edificioLinkForm.linkPagoAutomatico} onChange={e => setEdificioLinkForm(f => ({ ...f, linkPagoAutomatico: e.target.value }))} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Link pago en el momento</label>
                <p className="text-xs text-gray-400 mb-1">Pago único por cada expensa</p>
                <input type="url" value={edificioLinkForm.linkPagoMomento} onChange={e => setEdificioLinkForm(f => ({ ...f, linkPagoMomento: e.target.value }))} className="input-field" placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingEdificio(null)} className="flex-1 btn-secondary justify-center">Cancelar</button>
                <button onClick={handleGuardarLinks} className="flex-1 btn-primary justify-center">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Venta */}
      {showEditVentaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Editar Venta</h3>
              <button onClick={() => setShowEditVentaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleUpdateVenta} className="space-y-4">
              <div><label className="block text-sm text-gray-600 mb-2">Precio Venta (USD)</label><input type="number" value={editVentaForm.precioVenta} onChange={(e) => setEditVentaForm({...editVentaForm, precioVenta: e.target.value})} className="input-field" required /></div>
              <div><label className="block text-sm text-gray-600 mb-2">Anticipo (USD)</label><input type="number" value={editVentaForm.anticipo} onChange={(e) => setEditVentaForm({...editVentaForm, anticipo: e.target.value})} className="input-field" /></div>
              <button type="submit" className="w-full btn-primary justify-center">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ventas;
