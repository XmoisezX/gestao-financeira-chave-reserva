import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Lock, Camera, ShieldCheck, Check, X, AlertCircle, Upload, Trash2 } from 'lucide-react';

export const ConfiguracoesModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useApp();

  const [name, setName] = useState(user?.name || 'Moisés Torres');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
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
      role: user.role,
      avatar: photoUrl ? null : (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MT')
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="cr-modal-overlay" onClick={onClose}>
      <div className="cr-modal cr-modal-md" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="cr-modal-header">
          <div>
            <h3 className="text-[15px] font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="cr-kpi-icon w-8 h-8" style={{ background: 'var(--brand-50)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--brand-600)' }} />
              </div>
              Configurações de Perfil
            </h3>
            <p className="text-[12px] mt-1 ml-10" style={{ color: 'var(--text-tertiary)' }}>
              Personalize seu nome e foto de perfil
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Body */}
          <div className="cr-modal-body space-y-5 text-xs">
            {savedSuccess && (
              <div className="p-3 rounded-lg flex items-center gap-2 font-medium text-xs animate-cr-scaleIn"
                style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(5,150,105,0.2)' }}
              >
                <Check className="w-4 h-4" /> Alterações salvas com sucesso!
              </div>
            )}

            {/* Photo Upload */}
            <div
              className="flex items-center gap-4 p-4 rounded-lg"
              style={{ background: 'var(--neutral-50)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="cr-avatar-ring">
                    <img
                      src={photoUrl}
                      alt={name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full font-extrabold text-lg flex items-center justify-center"
                    style={{ background: 'var(--brand-100)', color: 'var(--brand-700)', border: '2px solid var(--brand-300)' }}
                  >
                    {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'MT'}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <label className="cr-label">Foto de Perfil</label>

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
                    className="cr-btn cr-btn-primary py-1.5 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fazer Upload</span>
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

                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Formatos aceitos: JPG, PNG, WEBP (Máx: 5MB)
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="cr-label">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="cr-input"
                placeholder="Ex: Moisés Torres"
              />
            </div>

            {/* Locked Role */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="cr-label mb-0 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  Cargo / Função
                </label>
                <span className="cr-badge cr-badge-neutral text-[10px]">Bloqueado</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={user.role || 'Colaborador'}
                  className="cr-input cursor-not-allowed opacity-60"
                  style={{ background: 'var(--neutral-100)' }}
                />
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <AlertCircle className="w-3 h-3 shrink-0" />
                O cargo é designado pelo administrador no painel de equipe e não pode ser alterado aqui.
              </p>
            </div>

            {/* Locked Email */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="cr-label mb-0 flex items-center gap-1">
                  <Lock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                  E-mail
                </label>
                <span className="cr-badge cr-badge-neutral text-[10px]">Imutável</span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user.email}
                  className="cr-input cursor-not-allowed opacity-60 font-mono"
                  style={{ background: 'var(--neutral-100)' }}
                />
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <AlertCircle className="w-3 h-3 shrink-0" />
                O e-mail de acesso não pode ser alterado por razões de segurança.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="cr-modal-footer">
            <button type="button" onClick={onClose} className="cr-btn cr-btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="cr-btn cr-btn-primary">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
