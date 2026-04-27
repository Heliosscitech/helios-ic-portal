import { MAX_FILE_SIZE } from './constants';
import type { PurchaseAttachment } from './types';

export const generateId = (): string =>
  `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export const formatShortDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
};

export const formatDateInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const fileToAttachment = (file: File): Promise<PurchaseAttachment> =>
  new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Dosya 5MB sınırını aşıyor.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: String(reader.result ?? ''),
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
