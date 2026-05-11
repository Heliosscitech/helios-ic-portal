import React, { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, ChevronLeft, CheckCircle, AlertCircle, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { refreshUsersCache } from '../../lib/users';
import type { User } from '../../types/portal';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onAvatarChange: (url: string) => void;
}

const resizeImage = (file: File, maxPx = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onAvatarChange }) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Şifre
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Fotoğraf
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Notlar
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user.dbId) { setNotesLoading(false); return; }
    supabase
      .from('users')
      .select('private_notes')
      .eq('id', user.dbId)
      .single()
      .then(({ data, error }) => {
        if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
          setNotesError('db_missing');
        } else {
          setNotes(data?.private_notes ?? '');
        }
        setNotesLoading(false);
      });
  }, [user.dbId]);

  const handleSaveNotes = async () => {
    if (!user.dbId) return;
    setNotesSaving(true);
    setNotesSaved(false);
    const { error } = await supabase
      .from('users')
      .update({ private_notes: notes })
      .eq('id', user.dbId);
    setNotesSaving(false);
    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        setNotesError('db_missing');
      } else {
        toast.error('Not kaydedilemedi: ' + error.message);
      }
    } else {
      setNotesError(null);
      setNotesSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setNotesSaved(false), 2000);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleDeleteAvatar = async () => {
    if (!user.dbId) return;
    setAvatarUploading(true);
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', user.dbId);
    if (error) {
      toast.error('Fotoğraf kaldırılamadı: ' + error.message);
    } else {
      onAvatarChange('');
      await refreshUsersCache();
      toast.success('Fotoğraf kaldırıldı');
    }
    setAvatarUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.dbId) return;
    setAvatarUploading(true);

    let dataUrl: string;
    try {
      dataUrl = await resizeImage(file, 256);
    } catch {
      toast.error('Görsel okunamadı.');
      setAvatarUploading(false);
      e.target.value = '';
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: dataUrl })
      .eq('id', user.dbId);

    if (error) {
      toast.error('Profil güncellenemedi: ' + error.message);
      setAvatarUploading(false);
      e.target.value = '';
      return;
    }

    onAvatarChange(dataUrl);
    await refreshUsersCache();
    toast.success('Fotoğraf güncellendi');
    setAvatarUploading(false);
    e.target.value = '';
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 6) { setPwError('Şifre en az 6 karakter olmalı.'); return; }
    if (newPassword !== confirmPassword) { setPwError('Şifreler eşleşmiyor.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) { setPwError(error.message); return; }
    toast.success('Şifre güncellendi');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-2xl mx-auto p-8 md:p-10 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-3 hover:text-text transition-colors mb-2"
      >
        <ChevronLeft size={15} /> Ana Sayfa
      </button>

      {/* Fotoğraf & bilgi */}
      <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-5">Profil</p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="relative shrink-0 group"
            title="Fotoğraf değiştir"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className={cn(
                'w-20 h-20 rounded-xl flex items-center justify-center font-bold text-[20px] shadow-sm',
                user.color
              )}>
                {user.initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                <span className="text-white text-[11px] font-semibold">İşleniyor…</span>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div>
            <p className="text-[16px] font-bold text-text">{user.name}</p>
            <p className="text-[13px] text-text-3">{user.role}</p>
            {user.email && <p className="text-[12px] text-text-3 mt-0.5">{user.email}</p>}
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-text-3 hover:text-text transition-colors"
              >
                <Camera size={13} /> Fotoğraf değiştir
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={avatarUploading}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-red-text hover:text-red-text/70 transition-colors"
                >
                  <Trash2 size={13} /> Kaldır
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Şifre değiştir */}
      <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-5">Şifre Değiştir</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && (
            <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">
              {pwError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full p-3 pr-10 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Şifreyi Onayla</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tekrar girin"
                className="w-full p-3 pr-10 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwLoading || !newPassword}
              className="px-5 py-2 text-white rounded-lg text-[13px] font-semibold bg-[#1a1a19] hover:bg-black transition-colors disabled:opacity-50"
            >
              {pwLoading ? 'Güncelleniyor…' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>

      {/* Kişisel notlar */}
      <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-4">Kişisel Notlarım</p>

        {notesError === 'db_missing' ? (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-bg border border-amber-border/30 rounded-xl text-[13px] text-amber-text">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Notlar için veritabanı kolonu eksik.</p>
              <p className="text-[12px]">Supabase SQL Editor'da şunu çalıştır:</p>
              <code className="block mt-2 text-[11.5px] bg-amber-border/10 px-3 py-2 rounded font-mono whitespace-pre">
                ALTER TABLE users{'\n'}ADD COLUMN IF NOT EXISTS private_notes TEXT;
              </code>
            </div>
          </div>
        ) : notesLoading ? (
          <p className="text-[13px] text-text-3">Yükleniyor…</p>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              placeholder="Sadece senin göreceğin notlarını buraya yazabilirsin…"
              rows={8}
              className="w-full text-[14px] text-text bg-surface-2/40 border border-border/50 rounded-xl px-4 py-3 outline-none focus:border-text transition-colors resize-none placeholder:text-text-3/60"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[11px] text-text-3">Bu notlar sadece sana görünür.</p>
              <div className="flex items-center gap-3">
                {notesSaved && (
                  <span className="flex items-center gap-1 text-[12px] text-teal-text font-semibold">
                    <CheckCircle size={13} /> Kaydedildi
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a19] text-white rounded-lg text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Save size={13} />
                  {notesSaving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
