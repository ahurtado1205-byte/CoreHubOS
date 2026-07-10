'use client';

import { useState } from 'react';
import { Hexagon, Lock, Mail, ArrowRight, Hotel, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePMS } from '../../context/PMSContext';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);
  const router = useRouter();
  const { login, initializeSystem } = usePMS();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await login(email, password);
      router.push('/roomrack');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!propertyName.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu hotel.');
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario.');

      // 2. Create the Property
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .insert([{ name: propertyName }])
        .select()
        .single();

      if (propError) throw propError;

      // 3. Create the Team Member
      const { error: teamError } = await supabase
        .from('team_members')
        .insert([{
          first_name: firstName,
          last_name: lastName,
          email: email,
          property_id: propData.id,
          status: 'active'
        }]);

      if (teamError) throw teamError;

      setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
      
      // Auto login
      await login(email, password);
      router.push('/roomrack');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error durante el registro.');
      setLoading(false);
    }
  };

  const handleDemo = (mode: 'demo_1' | 'demo_2' | 'demo_3') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDemoLoading(true);
    setTimeout(() => {
      login();
      initializeSystem(mode);
      router.push('/roomrack');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl inline-block mb-4 shadow-lg shadow-indigo-600/20">
            <Hexagon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">CoreHub OS</h1>
          <p className="text-slate-500 mt-2 font-medium">El Ecosistema Operativo para tu Hotel</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex gap-4 mb-6 border-b border-slate-150 pb-1">
            <button
              onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 font-bold text-sm transition-colors border-b-2 ${!isSignUp ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 font-bold text-sm transition-colors border-b-2 ${isSignUp ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
            >
              Registrar Hotel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl text-center animate-pulse">
              {successMsg}
            </div>
          )}

          {!isSignUp ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                    placeholder="admin@hotel.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-black p-4 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Entrar al Sistema
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Hotel / Alojamiento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hotel className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="block w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                    placeholder="Ej: Cabañas del Sol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none text-sm"
                      placeholder="Juan"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Apellido</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none text-sm"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico de Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña de Acceso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-black p-4 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Crear Cuenta y Hotel
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8">
          {!showDemoOptions ? (
            <div className="text-center">
              <p className="text-sm text-slate-500 mt-8 font-medium">
                ¿Querés probar una demo rápida?{' '}
                <button 
                  onClick={(e) => { e.preventDefault(); setShowDemoOptions(true); }}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Entrar como Invitado
                </button>
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-slate-500 font-medium mb-4 animate-in fade-in slide-in-from-bottom-2">
                Selecciona una plantilla para probar:
              </p>
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <button 
                  onClick={handleDemo('demo_1')}
                  disabled={demoLoading}
                  className="w-full text-sm p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <span>Empresa 1 (5 Cabañas)</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
                <button 
                  onClick={handleDemo('demo_2')}
                  disabled={demoLoading}
                  className="w-full text-sm p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <span>Empresa 2 (Dptos + Casas)</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
                <button 
                  onClick={handleDemo('demo_3')}
                  disabled={demoLoading}
                  className="w-full text-sm p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-between"
                >
                  <span>Empresa 3 (Gran Complejo 30 habs)</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
