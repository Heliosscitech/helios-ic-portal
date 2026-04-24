import React, { useMemo, useState } from 'react';
import { Info, RotateCcw, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ModuleProps } from '../../../../types/portal';
import { PORTAL_USERS } from '../../../../types/users';
import { usePersistentState } from '../../../../lib/persistence';
import { useNotifications } from '../../../../lib/notifications';
import { ChecklistHeader } from './components/ChecklistHeader';
import { ChecklistTable } from './components/ChecklistTable';
import { INITIAL_DATA } from './data';
import { TABS } from './types';
import type {
  ChecklistHistory,
  ChecklistItem,
  ChecklistTabId,
  CustomItemsMap,
  ItemStatus,
} from './types';
import { getMonday, getWeekKey } from './utils';

const HISTORY_KEY = 'helios:lab-checklist:history';
const CUSTOM_KEY = 'helios:lab-checklist:custom';

const EMPTY_CUSTOM: CustomItemsMap = {
  haftalik: [],
  aylik: [],
  temizlik: [],
};

export const LabChecklist: React.FC<ModuleProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<ChecklistTabId>('haftalik');
  const [refDate, setRefDate] = useState(new Date());
  const [history, setHistory] = usePersistentState<ChecklistHistory>(HISTORY_KEY, {});
  const [customItems, setCustomItems] = usePersistentState<CustomItemsMap>(CUSTOM_KEY, EMPTY_CUSTOM);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', instruction: '' });

  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemData, setProblemData] = useState({ comment: '', assigneeId: '' });

  const { dispatch } = useNotifications();

  const monday = useMemo(() => getMonday(refDate), [refDate]);
  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 6);
    return d;
  }, [monday]);

  const weekKey = useMemo(() => getWeekKey(monday, activeTab), [monday, activeTab]);
  const statusMap = useMemo(() => history[weekKey] ?? {}, [history, weekKey]);

  const currentItems = useMemo(
    () => [...INITIAL_DATA[activeTab].items, ...(customItems[activeTab] ?? [])],
    [activeTab, customItems]
  );

  const completedCount = useMemo(
    () => currentItems.filter((item) => statusMap[item.id]?.type === 'ok').length,
    [currentItems, statusMap]
  );

  const progress = currentItems.length > 0 ? (completedCount / currentItems.length) * 100 : 0;

  const navigateWeek = (dir: number) => {
    const newDate = new Date(refDate);
    newDate.setDate(newDate.getDate() + dir * 7);
    setRefDate(newDate);
  };

  const handleToggle = (id: string, type: 'ok' | 'problem') => {
    const currentStatus = statusMap[id];

    if (type === 'problem') {
      if (currentStatus?.type === 'problem') {
        setEditingProblemId(id);
        setProblemData({
          comment: currentStatus.comment ?? '',
          assigneeId: currentStatus.assigneeId ?? '',
        });
      } else {
        setEditingProblemId(id);
        setProblemData({ comment: '', assigneeId: '' });
      }
      return;
    }

    setHistory((prev) => ({
      ...prev,
      [weekKey]: {
        ...(prev[weekKey] ?? {}),
        [id]: currentStatus?.type === 'ok' ? { type: null } : { type: 'ok' },
      },
    }));
    if (editingProblemId === id) setEditingProblemId(null);
  };

  const handleSaveProblem = () => {
    if (!editingProblemId) return;
    const itemId = editingProblemId;
    const item = currentItems.find((i) => i.id === itemId);

    // Bildirim: assignee varsa ve kendisi değilse
    if (item && problemData.assigneeId && problemData.assigneeId !== user.id) {
      dispatch({
        type: 'lab-problem-reported',
        source: 'lab-checklist',
        entityId: `${weekKey}:${itemId}`,
        entityTitle: item.name,
        actorId: user.id,
        targetUserIds: [problemData.assigneeId],
        message: `"${item.name}" ekipmanında sorun bildirdi ve size atadı${
          problemData.comment ? `: "${problemData.comment.slice(0, 80)}"` : ''
        }`,
      });
    }

    setHistory((prev) => ({
      ...prev,
      [weekKey]: {
        ...(prev[weekKey] ?? {}),
        [itemId]: {
          type: 'problem',
          comment: problemData.comment,
          assigneeId: problemData.assigneeId,
          timestamp: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          userInitials: user.initials,
          userName: user.name.split(' ')[0],
        } as ItemStatus,
      },
    }));
    setEditingProblemId(null);
  };

  const handleApproveAll = () => {
    const currentWeekStatus: Record<string, ItemStatus> = { ...(history[weekKey] ?? {}) };
    currentItems.forEach((item) => {
      currentWeekStatus[item.id] = { type: 'ok' };
    });
    setHistory((prev) => ({ ...prev, [weekKey]: currentWeekStatus }));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const item: ChecklistItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name.trim(),
      instruction: newItem.instruction.trim() || '—',
      isCustom: true,
    };
    setCustomItems((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] ?? []), item],
    }));
    setIsAdding(false);
    setNewItem({ name: '', instruction: '' });
  };

  // assigneeId listesi artık PORTAL_USERS'a referans için sadece render sırasında lookup yapılacak
  const assigneeName = (id: string) => PORTAL_USERS.find((u) => u.id === id)?.name ?? '';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <span className="hover:text-text cursor-pointer">Uygulamalar</span>
        <span>/</span>
        <span className="text-text font-semibold uppercase tracking-tight">Lab checklist</span>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-10 space-y-8 min-h-175 relative">
        {isAdding && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <h3 className="text-[15px] font-semibold text-text mb-6">Yeni Ekipman / Görev Ekle</h3>
              <form onSubmit={handleAddCustomItem} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12.5px] font-semibold text-text-3 uppercase tracking-wider">
                    Ekipman Adı
                  </label>
                  <input
                    autoFocus
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full p-4 bg-surface border border-border/40 rounded-xl text-[14px] outline-none focus:border-text transition-all font-medium"
                    placeholder="Örn: Laminar Flow Kabini"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12.5px] font-semibold text-text-3 uppercase tracking-wider">
                    Talimatlar
                  </label>
                  <textarea
                    value={newItem.instruction}
                    onChange={(e) => setNewItem({ ...newItem, instruction: e.target.value })}
                    className="w-full p-4 bg-surface border border-border/40 rounded-xl text-[14px] outline-none focus:border-text transition-all font-medium min-h-25 resize-none"
                    placeholder="Yapılması gerekenleri yazın..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 border border-border rounded-xl text-[13px] font-semibold text-text hover:bg-surface-2 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1a1a19] text-white rounded-xl text-[13px] font-semibold shadow-lg hover:bg-black transition-all"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-2 rounded-xl text-[13px] font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-[#1a1a19] text-white shadow-xl'
                  : 'bg-surface text-text-3 border border-border/20 hover:border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#E6F1FB] border border-[#378ADD]/20 rounded-xl p-4 flex items-center gap-3">
          <Info size={18} className="text-[#378ADD]" />
          <p className="text-[14px] text-text-2">
            Bu {activeTab === 'aylik' ? 'ayki' : 'haftaki'}{' '}
            {activeTab === 'temizlik' ? 'temizlik' : 'kontrol'}{' '}
            <span className="font-semibold text-text">{INITIAL_DATA[activeTab].sorumlu}</span> yapacak.{' '}
            {completedCount}/{currentItems.length} tamam.
          </p>
        </div>

        <ChecklistHeader
          activeTab={activeTab}
          monday={monday}
          sunday={sunday}
          sorumlu={INITIAL_DATA[activeTab].sorumlu}
          navigateWeek={navigateWeek}
          resetDate={() => setRefDate(new Date())}
          onAddEquipment={() => setIsAdding(true)}
        />

        <ChecklistTable
          items={currentItems}
          statusMap={statusMap}
          editingProblemId={editingProblemId}
          problemData={problemData}
          onToggle={handleToggle}
          onProblemDataChange={setProblemData}
          onSaveProblem={handleSaveProblem}
          onCancelProblem={() => setEditingProblemId(null)}
        />

        <div className="bg-[#f1efe8]/30 border border-border/40 rounded-2xl p-8 flex items-center justify-between mt-auto shadow-inner">
          <div className="space-y-4 flex-1 max-w-100">
            <div className="flex items-center justify-between text-[13px] font-semibold">
              <span className="text-text-2 tracking-tight">
                {completedCount} / {currentItems.length} ekipman onaylandı
              </span>
            </div>
            <div className="h-3 w-full bg-border/20 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn(
                  'h-full transition-all duration-700 ease-out',
                  progress === 100
                    ? 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]'
                    : 'bg-teal-500/30'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pl-8">
            <button
              onClick={() => setHistory((prev) => ({ ...prev, [weekKey]: {} }))}
              className="p-3 text-text-3 hover:bg-white rounded-xl transition-all group"
              title="Sıfırla"
            >
              <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={handleApproveAll}
              className={cn(
                'px-8 py-4 rounded-xl text-[14px] font-semibold shadow-xl transition-all flex items-center gap-3 active:scale-95',
                progress === 100 ? 'bg-teal-600 text-white scale-105' : 'bg-teal-500 text-white hover:bg-teal-600'
              )}
            >
              {progress === 100 ? 'Hepsi Onaylı' : 'Haftalık Onay'} <Check size={18} />
            </button>
          </div>
        </div>

        <div className="text-center opacity-30 pt-4">
          <p className="text-[11px] text-text-3 font-semibold uppercase tracking-widest">
            Prototip görünüm • Veriler tarayıcıda kalıcı tutulur • © Helios Bilim ve Teknoloji A.Ş.
          </p>
        </div>
      </div>

      {/* Açık sorun özeti: hangi sorunlar hangi kişiye atanmış — şeffaflık için ufak bir bölüm */}
      {(() => {
        const problems = Object.entries(statusMap)
          .filter(([, s]) => s?.type === 'problem')
          .map(([itemId, s]) => ({ itemId, status: s }));
        if (problems.length === 0) return null;
        return (
          <div className="bg-white border border-border/40 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[13px] font-semibold uppercase tracking-widest text-text-3 mb-4">
              Bu haftaki açık sorunlar ({problems.length})
            </h3>
            <div className="space-y-2">
              {problems.map(({ itemId, status }) => {
                const item = currentItems.find((i) => i.id === itemId);
                return (
                  <div
                    key={itemId}
                    className="flex items-center justify-between p-3 bg-red-bg/40 border border-red-border/20 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-red-text truncate">{item?.name}</p>
                      {status.comment && (
                        <p className="text-[12.5px] text-text-2 mt-0.5 truncate">{status.comment}</p>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-text-3 shrink-0 ml-4">
                      {status.assigneeId
                        ? `→ ${assigneeName(status.assigneeId) || 'atanmış'}`
                        : 'atanmamış'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default LabChecklist;
