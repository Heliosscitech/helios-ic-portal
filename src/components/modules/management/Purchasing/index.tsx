import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePortalUsers } from '../../../../lib/users';
import { useNotifications } from '../../../../lib/notifications';
import { useActiveEntity } from '../../../../lib/active-entity';
import type { ModuleProps } from '../../../../types/portal';
import { BreadcrumbHome } from '../../../BreadcrumbHome';
import { confirmAction } from '../../../../lib/confirm';
import { STATUS_META, STATUS_TABS } from './constants';
import { PurchaseForm, type NewPurchaseInput } from './PurchaseForm';
import { PurchaseCard } from './PurchaseCard';
import type { PurchaseAuthor, PurchaseRequest, PurchaseStatus, StatusTab } from './types';
import { usePurchases } from './hooks';

const ACTIVE_STATUSES: PurchaseStatus[] = ['yeni', 'siparis-verildi'];

export const Purchasing: React.FC<ModuleProps> = ({ user }) => {
  const { purchases, addPurchase: addPurchaseRow, updateStatus: updateStatusRow, deletePurchase: deletePurchaseRow } = usePurchases();
  const { users } = usePortalUsers();
  const { dispatch } = useNotifications();
  const { active, clear } = useActiveEntity();

  const [activeTab, setActiveTab] = useState<StatusTab>('aktif');
  const [showForm, setShowForm] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.userRole === 'yonetici';

  const assigneeCandidates: PurchaseAuthor[] = useMemo(
    () => users.map((u) => ({ id: u.id, name: u.name, initials: u.initials, color: u.color })),
    [users]
  );

  const counts = useMemo(() => {
    const c: Record<StatusTab, number> = {
      aktif: 0,
      'yeni': 0,
      'siparis-verildi': 0,
      'geldi': 0,
      'iptal-iade': 0,
    };
    for (const p of purchases) {
      c[p.status] += 1;
      if (ACTIVE_STATUSES.includes(p.status)) c.aktif += 1;
    }
    return c;
  }, [purchases]);

  const filtered = useMemo(() => {
    if (activeTab === 'aktif') return purchases.filter((p) => ACTIVE_STATUSES.includes(p.status));
    return purchases.filter((p) => p.status === activeTab);
  }, [purchases, activeTab]);

  // Bildirim tıklanınca: ilgili talebin sekmesine geç, scroll, highlight
  useEffect(() => {
    if (active?.source !== 'satin-alma') return;
    const target = purchases.find((p) => p.id === active.entityId);
    if (!target) {
      clear();
      return;
    }
    const targetTab: StatusTab = ACTIVE_STATUSES.includes(target.status) ? 'aktif' : target.status;
    setActiveTab(targetTab);
    setHighlightId(target.id);
    clear();
    const t = window.setTimeout(() => {
      const el = listRef.current?.querySelector<HTMLDivElement>(
        `[data-purchase-id="${target.id}"]`
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    const t2 = window.setTimeout(() => setHighlightId(null), 2400);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [active, purchases, clear]);

  const addPurchase = async (input: NewPurchaseInput) => {
    const next = await addPurchaseRow(input, user.id);
    setShowForm(false);
    if (!next) return;
    if (next.assignedTo && next.assignedTo.id !== user.id) {
      dispatch({
        type: 'purchase-assigned',
        source: 'satin-alma',
        entityId: next.id,
        entityTitle: next.title,
        actorId: user.id,
        targetUserIds: [next.assignedTo.id],
        message: `size yeni bir satın alma talebi atadı: "${next.title}"`,
      });
    }
  };

  const canManage = (p: PurchaseRequest): boolean => {
    if (isAdmin) return true;
    if (user.responsibilities.includes('purchasing')) return true;
    return p.assignedTo?.id === user.id;
  };

  const updateStatus = async (id: string, status: PurchaseStatus) => {
    const target = purchases.find((p) => p.id === id);
    if (!target || !canManage(target)) return;
    if (target.status === status) return;
    const ok = await updateStatusRow(id, status);
    if (!ok) return;

    if (target.createdBy.id !== user.id) {
      dispatch({
        type: 'purchase-status-changed',
        source: 'satin-alma',
        entityId: id,
        entityTitle: target.title,
        actorId: user.id,
        targetUserIds: [target.createdBy.id],
        message: `talebinizin durumunu "${STATUS_META[status].label}" olarak güncelledi: "${target.title}"`,
      });
    }
  };

  const deletePurchase = async (id: string) => {
    const target = purchases.find((p) => p.id === id);
    if (!target || !canManage(target)) return;
    const ok = await confirmAction({
      title: 'Talebi sil?',
      message: 'Bu satın alma talebi kalıcı olarak silinecek.',
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    await deletePurchaseRow(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 pb-10 space-y-5">
      {/* Breadcrumb */}
      <div className="bg-white px-5 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <BreadcrumbHome />
        <span>/</span>
        <span className="text-text font-semibold">Satın alma</span>
      </div>

      {/* Module card */}
      <div className="bg-surface border border-border/40 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ShoppingCart size={20} className="text-text" />
              <h1 className="text-[20px] font-bold text-text tracking-tight">Satın alma talepleri</h1>
              <span className="bg-surface-2 px-2.5 py-0.5 rounded-full text-[12px] font-bold text-text-3">
                {purchases.length}
              </span>
            </div>
            <p className="text-[13px] text-text-3 mt-1.5">
              Kimyasal, sarf, ekipman, arıza — hepsi tek yerde
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-text text-white px-4 py-2.5 rounded-xl font-semibold text-[13px] hover:bg-black/85 transition-all shadow-sm active:scale-95 self-start"
          >
            <Plus size={16} /> Yeni talep
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_TABS.map((tab) => {
            const tabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all border',
                  tabActive
                    ? 'bg-text text-white border-text'
                    : 'bg-surface text-text-2 border-border hover:border-text/30 hover:text-text'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'text-[11px] font-bold px-1.5 rounded-full min-w-5 text-center',
                    tabActive ? 'bg-white/20 text-white' : 'bg-surface-2 text-text-3'
                  )}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              key="form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <PurchaseForm
                onSubmit={addPurchase}
                onCancel={() => setShowForm(false)}
                assigneeCandidates={assigneeCandidates}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div ref={listRef} className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-surface-2/40 border border-dashed border-border rounded-2xl p-10 text-center">
              <p className="text-[13px] text-text-3">Bu sekmede talep bulunamadı.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <PurchaseCard
                key={p.id}
                purchase={p}
                canManage={canManage(p)}
                highlighted={highlightId === p.id}
                onStatusChange={updateStatus}
                onDelete={deletePurchase}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
