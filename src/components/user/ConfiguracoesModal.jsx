import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Lock, Camera, ShieldCheck, Check, X, AlertCircle, Upload, Trash2 } from 'lucide-react';

export const ConfiguracoesModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useApp();

  const [name, setName] = useState(user?.name || 'Moisés Torres');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [role, setRole] = useState(user?.role || 'Administrador');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image size (e.g. max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem selecionada é muito grande. Escolha uma foto de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result); // Base64 data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({
      name,
      photoUrl,
      role,
      avatar: photoUrl ? null : (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MT')
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              Configurações de Perfil
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Personalize seu nome, foto de perfil e cargo
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4" /> Alterações salvas com sucesso!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">

          {/* Photo Upload Section */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-extrabold text-lg flex items-center justify-center border-2 border-amber-400 shadow-sm">
                  {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MT'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300">
                Foto de Perfil
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fazer Upload de Foto</span>
                </button>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Remover foto"
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-[10px] text-gray-400">
                Formatos aceitos: JPG, PNG, WEBP (Máx: 5MB)
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Ex: Moisés Torres"
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Cargo / Função
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Administrador"
            />
          </div>

          {/* LOCKED Email Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Lock className="w-3 h-3 text-gray-400" />
                E-mail (Bloqueado)
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Imutável</span>
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                readOnly
                value={user.email}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-mono cursor-not-allowed select-none"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" />
              O e-mail de acesso não pode ser alterado por razões de segurança.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition-colors shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
