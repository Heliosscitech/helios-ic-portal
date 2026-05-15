import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLabBook } from '../context';
import type { ExperimentMaterial } from '../types';

interface Props {
  experimentId: string;
  /** Parent edit moduna girdiğinde silme butonları her zaman görünür */
  editing?:     boolean;
}

export const MaterialsTable: React.FC<Props> = ({ experimentId, editing }) => {
  const { mof: { materials, addMaterial, updateMaterial, deleteMaterial } } = useLabBook();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const expMaterials = materials
    .filter((m) => m.experimentId === experimentId)
    .sort((a, b) => a.position - b.position);

  const commitAdd = async () => {
    if (!newName.trim()) { setAdding(false); setNewName(''); setNewAmount(''); return; }
    await addMaterial(experimentId, newName.trim(), newAmount.trim() || null);
    setNewName(''); setNewAmount(''); setAdding(false);
  };

  return (
    <section className="border-b border-[#cdc4ad]/60 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="helios-eln-title text-[15px] font-bold flex items-center gap-2">
          <span className="text-[#BA7517]">✱</span>
          Malzemeler
        </h3>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
        >
          <Plus size={11} /> Satır
        </button>
      </div>

      <div className="border border-[#cdc4ad] rounded-lg overflow-hidden bg-white/70">
        <table className="w-full">
          <thead>
            <tr className="text-[10.5px] font-semibold tracking-[1.2px] uppercase text-[#6f6749] border-b border-[#cdc4ad] bg-[#ece4cf]/40">
              <th className="px-3 py-2 text-left w-3/5">Malzeme</th>
              <th className="px-3 py-2 text-left">Miktar</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {expMaterials.length === 0 && !adding && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-[12px] italic text-[#9b9275]">
                  Malzeme eklenmemiş
                </td>
              </tr>
            )}
            {expMaterials.map((m) => (
              <MaterialRow
                key={m.id}
                material={m}
                editing={editing}
                onUpdate={(patch) => updateMaterial(m.id, patch)}
                onDelete={() => deleteMaterial(m.id)}
              />
            ))}
            {adding && (
              <tr className="border-t border-[#cdc4ad] bg-[#f5efe0]/40">
                <td className="px-2 py-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitAdd();
                      if (e.key === 'Escape') { setAdding(false); setNewName(''); setNewAmount(''); }
                    }}
                    placeholder="Örn. ZrOCl₂"
                    className="w-full px-2 py-1 text-[12.5px] bg-white border border-[#cdc4ad] rounded outline-none focus:border-[#1F3D2E]"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitAdd();
                      if (e.key === 'Escape') { setAdding(false); setNewName(''); setNewAmount(''); }
                    }}
                    placeholder="Örn. 0.5 g"
                    className="w-full px-2 py-1 text-[12.5px] bg-white border border-[#cdc4ad] rounded outline-none focus:border-[#1F3D2E]"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={commitAdd}
                    className="px-2 py-1 text-[10.5px] font-semibold text-white bg-[#1F3D2E] rounded hover:bg-[#163022]"
                  >
                    Ekle
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

interface RowProps {
  material: ExperimentMaterial;
  editing?: boolean;
  onUpdate: (patch: { name?: string; amount?: string | null }) => void;
  onDelete: () => void;
}

const MaterialRow: React.FC<RowProps> = ({ material, editing, onUpdate, onDelete }) => {
  const [name, setName] = useState(material.name);
  const [amount, setAmount] = useState(material.amount ?? '');

  const commitName = () => {
    if (name.trim() && name.trim() !== material.name) onUpdate({ name: name.trim() });
  };
  const commitAmount = () => {
    const next = amount.trim() || null;
    if (next !== material.amount) onUpdate({ amount: next });
  };

  return (
    <tr className="border-t border-[#e6dfc8] group/row hover:bg-[#f5efe0]/40">
      <td className="px-2 py-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="w-full px-2 py-1 text-[12.5px] bg-transparent border border-transparent rounded outline-none focus:bg-white focus:border-[#1F3D2E]"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={commitAmount}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="—"
          className="w-full px-2 py-1 text-[12.5px] bg-transparent border border-transparent rounded outline-none focus:bg-white focus:border-[#1F3D2E] font-mono"
        />
      </td>
      <td className="px-2 py-1.5 text-right">
        <button
          type="button"
          onClick={onDelete}
          className={`${editing ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'} p-1 text-[#791F1F] hover:bg-white rounded transition-all`}
          title="Sil"
        >
          <X size={11} />
        </button>
      </td>
    </tr>
  );
};
