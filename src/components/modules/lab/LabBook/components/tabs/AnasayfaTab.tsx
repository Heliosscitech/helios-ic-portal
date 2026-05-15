import React from 'react';
import { FlaskConical, ImageIcon, BookOpen, GraduationCap, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useLabBook } from '../../context';
import { StatCard } from '../StatCard';
import { formatDateShort } from '../../types';

export const AnasayfaTab: React.FC = () => {
  const { mof, literature, training, setActiveTab, setMofTabSelectedCategoryId } = useLabBook();

  // Sadece MOF sentez deneyleri (şekillendirme değil)
  const synthesisExperiments = mof.experiments.filter((e) => e.shapingVariantId === null);
  const totalExperiments = synthesisExperiments.length;
  const characterizationCount = mof.characterizations.length;
  const literatureCount = literature.items.length;
  const trainingCount = training.items.length;

  // Son 5 sentez deneyi
  const recentExperiments = [...synthesisExperiments]
    .sort((a, b) => (b.experimentDate ?? '').localeCompare(a.experimentDate ?? ''))
    .slice(0, 5);

  // Son 5 karakterizasyon (tablodan)
  const recentCharacterizations = [...mof.characterizations]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5);

  // MOF başına sentez deney sayıları
  const mofCounts = mof.categories.map((c) => ({
    category: c,
    count: synthesisExperiments.filter((e) => e.mofCategoryId === c.id).length,
  }));
  const maxCount = Math.max(1, ...mofCounts.map((m) => m.count));

  const goToMof = (catId: string) => {
    setMofTabSelectedCategoryId(catId);
    setActiveTab('mof-uretimi');
  };

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Stat kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Deney"  value={totalExperiments}      icon={FlaskConical}    accentBar="green" />
        <StatCard label="Karakterizasyon" value={characterizationCount} icon={ImageIcon}     accentBar="amber" />
        <StatCard label="Literatür"     value={literatureCount}       icon={BookOpen}        accentBar="teal"  />
        <StatCard label="Eğitim"        value={trainingCount}         icon={GraduationCap}   accentBar="blue"  />
      </div>

      {/* Son Deneyler & MOF Sayılar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Son Deneyler */}
        <section className="bg-white/70 border border-[#cdc4ad] rounded-xl p-5">
          <h2 className="helios-eln-title text-[18px] font-bold flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#1F3D2E]" /> Son Deneyler
          </h2>
          {recentExperiments.length === 0 ? (
            <p className="text-[12.5px] italic text-[#6f6749]">Henüz deney yok.</p>
          ) : (
            <div className="space-y-1.5">
              {recentExperiments.map((e) => {
                const cat = mof.categories.find((c) => c.id === e.mofCategoryId);
                return (
                  <button
                    key={e.id}
                    onClick={() => goToMof(e.mofCategoryId)}
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg border border-[#e6dfc8] hover:bg-[#f5efe0] transition-colors group"
                  >
                    <FlaskConical size={14} className="text-[#6f6749] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#1F3D2E] truncate">{e.title}</div>
                      <div className="text-[11px] text-[#6f6749] font-mono">
                        {cat?.name ?? '—'} · {formatDateShort(e.experimentDate)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* MOF Üretimi · Sayılar */}
        <section className="bg-white/70 border border-[#cdc4ad] rounded-xl p-5">
          <h2 className="helios-eln-title text-[18px] font-bold flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#1F3D2E]" /> MOF Üretimi · Sayılar
          </h2>
          {mofCounts.length === 0 ? (
            <p className="text-[12.5px] italic text-[#6f6749]">Henüz MOF kategorisi yok.</p>
          ) : (
            <div className="space-y-2.5">
              {mofCounts.map(({ category, count }) => (
                <div key={category.id} className="flex items-center gap-3">
                  <span className="w-24 text-[12px] font-semibold text-[#1F3D2E] shrink-0 truncate">{category.name}</span>
                  <div className="flex-1 h-2.5 bg-[#ece4cf] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1F3D2E] rounded-full transition-all"
                      style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-14 text-right text-[11px] font-mono text-[#6f6749] shrink-0">
                    {count} deney
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setActiveTab('mof-uretimi')}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf] transition-colors"
          >
            MOF Üretimine Git <ArrowRight size={12} />
          </button>
        </section>
      </div>

      {/* Son Karakterizasyonlar */}
      <section className="bg-white/70 border border-[#cdc4ad] rounded-xl p-5">
        <h2 className="helios-eln-title text-[18px] font-bold flex items-center gap-2 mb-4">
          <ImageIcon size={16} className="text-[#BA7517]" /> Son Karakterizasyonlar
        </h2>
        {recentCharacterizations.length === 0 ? (
          <p className="text-[12.5px] italic text-[#6f6749]">Henüz karakterizasyon eklenmemiş.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {recentCharacterizations.map((c) => {
              const exp = mof.experiments.find((e) => e.id === c.experimentId);
              const cat = exp ? mof.categories.find((cc) => cc.id === exp.mofCategoryId) : null;
              return (
                <button
                  key={c.id}
                  onClick={() => exp && goToMof(exp.mofCategoryId)}
                  className="text-left px-3 py-2.5 rounded-lg border border-[#e6dfc8] hover:bg-[#f5efe0] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[1px] text-[#1F3D2E] bg-[#ece4cf] rounded">
                      {c.type}
                    </span>
                    {c.value && <span className="text-[12px] font-mono font-semibold text-[#1F3D2E]">{c.value}</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-[#6f6749] font-mono truncate">
                    {cat?.name ?? '—'} · {exp?.title ?? '—'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
