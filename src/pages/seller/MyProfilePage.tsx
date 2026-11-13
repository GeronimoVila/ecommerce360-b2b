import { useState, useEffect } from 'react';
import { 
  User, Lock, Copy, CheckCircle2, Edit3, 
  ShieldCheck, Wallet, X 
} from 'lucide-react';
import { UserService } from '../../services/user.service';

export const MyProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [isEditingCBU, setIsEditingCBU] = useState(false);
  const [cbuValue, setCbuValue] = useState('');
  const [isSavingCBU, setIsSavingCBU] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const B2C_URL = import.meta.env.VITE_B2C_URL || 'http://localhost:3000';

  const fetchProfile = () => {
    UserService.getMe()
      .then(data => {
        setProfile(data);
        setCbuValue(data.seller_profile?.cbu_alias || '');
      })
      .catch(() => alert('Error cargando tu perfil'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopyLink = () => {
    if (!profile) return;
    const referralLink = `${B2C_URL}?ref=${profile.id}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCBU = async () => {
    setIsSavingCBU(true);
    try {
      await UserService.updateMe({ cbu_alias: cbuValue });
      setIsEditingCBU(false);
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error guardando CBU');
    } finally {
      setIsSavingCBU(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (passwordData.new.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await UserService.changePassword({
        current_password: passwordData.current,
        new_password: passwordData.new
      });
      alert('✅ Contraseña actualizada correctamente. Tu cuenta es segura.');
      setIsPasswordModalOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center bg-[#F8FAFC] min-h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center text-rose-600 font-medium bg-[#F8FAFC] min-h-full">
        No se encontró el perfil.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Mi Perfil</h1>
            <p className="text-sm text-slate-500 mt-1">Configura tus datos comerciales, link de referidos y seguridad de cuenta.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1D27] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors w-full md:w-auto"
        >
          <Lock className="w-4 h-4" /> Cambiar Contraseña
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="bg-[#1A1D27] p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {profile.seller_profile?.first_name} {profile.seller_profile?.last_name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{profile.email}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Vendedor Activo
          </span>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 overflow-hidden">
              <p className="text-xs font-bold text-[#5B50D6] uppercase tracking-wider flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Tu Link de Ventas (Afiliado)
              </p>
              <p className="text-sm font-mono text-slate-700 bg-white/80 border border-indigo-100/60 px-3 py-2 rounded-xl break-all">
                {B2C_URL}?ref={profile.id}
              </p>
            </div>
            <button 
              onClick={handleCopyLink}
              className="whitespace-nowrap px-5 py-2.5 bg-[#5B50D6] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Link'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-center space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Código Interno (Ref Code)</p>
              <p className="text-lg font-mono font-bold text-slate-900">
                {profile.seller_profile?.ref_code || 'N/A'}
              </p>
            </div>
            
            <div className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> CBU / Alias (Para cobros)
                </p>
                {!isEditingCBU && (
                  <button 
                    onClick={() => setIsEditingCBU(true)} 
                    className="text-[#5B50D6] text-xs font-bold hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                )}
              </div>
              
              {isEditingCBU ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={cbuValue} 
                    onChange={(e) => setCbuValue(e.target.value)} 
                    placeholder="Ingresa tu CBU o Alias"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] font-mono shadow-sm outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveCBU} 
                      disabled={isSavingCBU} 
                      className="bg-[#5B50D6] text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm hover:bg-indigo-700 transition-colors"
                    >
                      {isSavingCBU ? 'Guardando...' : 'Guardar CBU'}
                    </button>
                    <button 
                      onClick={() => { setIsEditingCBU(false); setCbuValue(profile.seller_profile?.cbu_alias || ''); }} 
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base font-mono font-semibold text-slate-900">
                  {profile.seller_profile?.cbu_alias || <span className="text-slate-400 italic text-sm font-sans">No configurado</span>}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Seguridad de la Cuenta</h2>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña Actual *</label>
                <input 
                  type="password" required 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm outline-none transition-colors" 
                  value={passwordData.current}
                  onChange={e => setPasswordData({...passwordData, current: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nueva Contraseña *</label>
                <input 
                  type="password" required minLength={8}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm outline-none transition-colors" 
                  value={passwordData.new}
                  onChange={e => setPasswordData({...passwordData, new: e.target.value})} 
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirmar Nueva Contraseña *</label>
                <input 
                  type="password" required minLength={8}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm outline-none transition-colors" 
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingPassword} 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/25 transition-all"
                >
                  {isSavingPassword ? 'Actualizando...' : 'Actualizar Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};