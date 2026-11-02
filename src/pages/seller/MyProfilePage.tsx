import { useState, useEffect } from 'react';
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

  if (isLoading) return <div className="p-8 text-center">Cargando perfil...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">No se encontró el perfil.</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
        <button 
          onClick={() => setIsPasswordModalOpen(true)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-700 transition-colors"
        >
          Cambiar Contraseña
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {profile.seller_profile?.first_name} {profile.seller_profile?.last_name}
            </h2>
            <p className="text-slate-300 mt-1">{profile.email}</p>
          </div>
          <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
            Vendedor Activo
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Tu Link de Ventas</p>
              <p className="text-sm text-blue-900 break-all">{B2C_URL}?ref={profile.id}</p>
            </div>
            <button 
              onClick={handleCopyLink}
              className="whitespace-nowrap px-4 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 transition-colors"
            >
              {copied ? '¡Copiado!' : 'Copiar Link'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase">Código Interno (Ref Code)</p>
              <p className="text-lg font-mono font-semibold text-gray-800 mt-1">{profile.seller_profile?.ref_code}</p>
            </div>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-gray-500 uppercase">CBU / Alias (Para cobros)</p>
                {!isEditingCBU && (
                  <button onClick={() => setIsEditingCBU(true)} className="text-blue-600 text-xs font-bold hover:underline">
                    Editar
                  </button>
                )}
              </div>
              
              {isEditingCBU ? (
                <div className="mt-2 space-y-2">
                  <input 
                    type="text" 
                    value={cbuValue} 
                    onChange={(e) => setCbuValue(e.target.value)} 
                    placeholder="Ingresa tu CBU o Alias"
                    className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveCBU} disabled={isSavingCBU} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50">
                      {isSavingCBU ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => { setIsEditingCBU(false); setCbuValue(profile.seller_profile?.cbu_alias || ''); }} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-bold">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {profile.seller_profile?.cbu_alias || <span className="text-gray-400 italic text-sm">No configurado</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Seguridad de la Cuenta</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Contraseña Actual *</label>
                <input 
                  type="password" required 
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={passwordData.current}
                  onChange={e => setPasswordData({...passwordData, current: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nueva Contraseña *</label>
                <input 
                  type="password" required minLength={8}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={passwordData.new}
                  onChange={e => setPasswordData({...passwordData, new: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Confirmar Nueva Contraseña *</label>
                <input 
                  type="password" required minLength={8}
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingPassword} 
                  className="px-4 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50"
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