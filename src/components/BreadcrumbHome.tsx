import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../lib/navigation';

// Breadcrumb'ın "Uygulamalar" parçası — tıklanınca ana panoya döner.
// Tüm modüllerde aynı şekilde davransın diye tek noktada tanımlandı.
export const BreadcrumbHome: React.FC = () => {
  const { goHome } = useNavigation();
  return (
    <button
      onClick={goHome}
      className="flex items-center gap-1.5 hover:text-text cursor-pointer transition-colors group"
    >
      <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
      Uygulamalar
    </button>
  );
};

// Standart breadcrumb kutusu: [← Uygulamalar] / Modül Adı
// Modül başlığı yerine ya da üstüne konabilir.
export const Breadcrumb: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
    <BreadcrumbHome />
    <span>/</span>
    <span className="text-text font-semibold">{title}</span>
  </div>
);
