import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, User, Mail, Lock, AlertCircle } from 'lucide-react';

function Setup() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const result = await setup(nombre, email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Configuración Inicial</h1>
          <p className="text-white/60 mt-2">Crear cuenta de administrador</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Nombre</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-field pl-12" placeholder="Tu nombre" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-12" placeholder="admin@constructora.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-12" placeholder="Mínimo 6 caracteres" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pl-12" placeholder="Repetir contraseña" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl font-semibold mt-6 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Setup;
