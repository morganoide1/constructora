import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Plus, X, DollarSign, Calendar, User, CheckCircle, Clock, AlertCircle, Edit } from 'lucide-react';

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
  const [editingPropiedad, setEditingPropiedad] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [propForm, setPropForm] = useState({ codigo: '', nombre: '', tipo: 'departamento', precioLista: '', valorFuturo: '', edificio: '', ubicacion: { piso: '', unidad: '' } });
  const [ventaForm, setVentaForm] = useState({ propiedadId: '', clienteId: '', precioVenta: '', anticipo: { monto: '' }, cuotasNum: 12 });
  const [pagoForm, setPagoForm] = useState({ cuotaNumero: '', monto: '', cajaId: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ventasRes, propsRes, clientesRes, edificiosRes, cajasRes] = await Promise.all([
        axios.get("/api/ventas").catch(() => ({ data: [] })),
        axios.get("/api/ventas/propiedades").catch(() => ({ data: [] })),
        axios.get("/api/clientes").catch(() => ({ data: [] })),
        axios.get("/api/edificios").catch(() => ({ data: [] })),
        axios.get("/api/cajas").catch(() => ({ data: [] }))
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
    setPropForm({
      codigo: prop.codigo,
      nombre: prop.nombre,
      tipo: prop.tipo,
      precioLista: prop.precioLista,
      valorFuturo: prop.valorFuturo || "",
      edificio: prop.edificio?._id || prop.edificio || "",
      ubicacion: { piso: prop.ubicacion?.piso || "", unidad: prop.ubicacion?.unidad || "" }
    });
    setEditingPropiedad(prop._id);
    setShowPropModal(true);
  };

  const handlePropiedad = async (e) => {
    e.preventDefault();
    try {
      if (editingPropiedad) {
        await axios.put(`/api/ventas/propiedades/${editingPropiedad}`, { ...propForm, precioLista: parseFloat(propForm.precioLista), valorFuturo: propForm.valorFuturo ? parseFloat(propForm.valorFuturo) : undefined });
      } else {
        await axios.post("/api/ventas/propiedades", { ...propForm, precioLista: parseFloat(propForm.precioLista), valorFuturo: propForm.valorFuturo ? parseFloat(propForm.valorFuturo) : undefined });
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
      const numCuotas = parseInt(ventaForm.cuotasNum);
      const saldoFinanciar = precio - anticipo;
      const montoCuota = saldoFinanciar / numCuotas;
      const cuotas = Array.from({ length: numCuotas }, (_, i) => ({
        numero: i + 1,
        monto: montoCuota,
        fechaVencimiento: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000)
      }));
      await axios.post('/api/ventas', {
        propiedadId: ventaForm.propiedadId,
        clienteId: ventaForm.clienteId,
        precioVenta: precio,
        anticipo: { monto: anticipo, pagado: false },
        cuotas
      });
      setShowVentaModal(false);
      setVentaForm({ propiedadId: '', clienteId: '', precioVenta: '', anticipo: { monto: '' }, cuotasNum: 12 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handlePago = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/ventas/${selectedVenta._id}/pago`, {
        cuotaNumero: parseInt(pagoForm.cuotaNumero),
        monto: parseFloat(pagoForm.monto),
        cajaId: pagoForm.cajaId || undefined
      });
      setShowPagoModal(false);
      setPagoForm({ cuotaNumero: '', monto: '', cajaId: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
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
          {propiedades.length === 0 && <p className="text-gray-400 col-span-full text-center py-8">No hay propiedades registradas</p>}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{editingPropiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
              <button onClick={() => { setShowPropModal(false); setEditingPropiedad(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handlePropiedad} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Código</label>
                  <input type="text" value={propForm.codigo} onChange={(e) => setPropForm({...propForm, codigo: e.target.value})} className="input-field" placeholder="A-101" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Tipo</label>
                  <select value={propForm.tipo} onChange={(e) => setPropForm({...propForm, tipo: e.target.value})} className="input-field">
                    <option value="departamento">Departamento</option>
                    <option value="cochera">Cochera</option>
                    <option value="local">Local</option>
                    <option value="oficina">Oficina</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Edificio</label>
                <select value={propForm.edificio} onChange={(e) => setPropForm({...propForm, edificio: e.target.value})} className="input-field">
                  <option value="">-- Seleccionar Edificio --</option>
                  {edificios.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Nombre</label>
                <input type="text" value={propForm.nombre} onChange={(e) => setPropForm({...propForm, nombre: e.target.value})} className="input-field" placeholder="Depto 2 ambientes con balcón" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Piso</label>
                  <input type="text" value={propForm.ubicacion.piso} onChange={(e) => setPropForm({...propForm, ubicacion: {...propForm.ubicacion, piso: e.target.value}})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Unidad</label>
                  <input type="text" value={propForm.ubicacion.unidad} onChange={(e) => setPropForm({...propForm, ubicacion: {...propForm.ubicacion, unidad: e.target.value}})} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Precio Lista (USD)</label>
                  <input type="number" value={propForm.precioLista} onChange={(e) => setPropForm({...propForm, precioLista: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Valor Futuro (USD)</label>
                  <input type="number" value={propForm.valorFuturo} onChange={(e) => setPropForm({...propForm, valorFuturo: e.target.value})} className="input-field" />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">{editingPropiedad ? 'Guardar Cambios' : 'Crear Propiedad'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venta */}
      {showVentaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Nueva Venta</h3>
              <button onClick={() => setShowVentaModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleVenta} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Propiedad</label>
                <select value={ventaForm.propiedadId} onChange={(e) => setVentaForm({...ventaForm, propiedadId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {propiedades.filter(p => p.estado === 'disponible').map(p => <option key={p._id} value={p._id}>{p.codigo} - {p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Cliente</label>
                <select value={ventaForm.clienteId} onChange={(e) => setVentaForm({...ventaForm, clienteId: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Precio Venta (USD)</label>
                  <input type="number" value={ventaForm.precioVenta} onChange={(e) => setVentaForm({...ventaForm, precioVenta: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Anticipo (USD)</label>
                  <input type="number" value={ventaForm.anticipo.monto} onChange={(e) => setVentaForm({...ventaForm, anticipo: { monto: e.target.value }})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Cantidad de Cuotas</label>
                <input type="number" value={ventaForm.cuotasNum} onChange={(e) => setVentaForm({...ventaForm, cuotasNum: e.target.value})} className="input-field" min="1" max="120" />
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Venta</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Registrar Pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-gray-500 mb-4">Venta: <span className="text-gray-800">{selectedVenta?.propiedad?.nombre}</span></p>
            <form onSubmit={handlePago} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Cuota a pagar</label>
                <select value={pagoForm.cuotaNumero} onChange={(e) => setPagoForm({...pagoForm, cuotaNumero: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {selectedVenta?.cuotas?.filter(c => c.estado === 'pendiente').map(c => (
                    <option key={c.numero} value={c.numero}>Cuota {c.numero} - {fmt(c.monto)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Monto</label>
                <input type="number" value={pagoForm.monto} onChange={(e) => setPagoForm({...pagoForm, monto: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Depositar en Caja (opcional)</label>
                <select value={pagoForm.cajaId} onChange={(e) => setPagoForm({...pagoForm, cajaId: e.target.value})} className="input-field">
                  <option value="">No registrar en caja</option>
                  {cajas.filter(c => c.tipo === 'USD').map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full btn-primary justify-center">Registrar Pago</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ventas;
