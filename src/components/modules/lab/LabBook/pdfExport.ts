import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '../../../../lib/toast';
import { SUB_TYPE_DETAIL_LABEL, SUB_TYPE_LABEL, formatDateShort } from './types';
import type {
  Experiment, ExperimentCharacterization, ExperimentMaterial,
  LiteratureItem, MofCategory, ShapingVariant, Training,
} from './types';

// jsPDF default helvetica fontu bazı Türkçe karakterleri bozar — basit transliterasyon
const tr = (s: string | null | undefined): string => {
  if (!s) return '';
  return s
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
};

const todayLabel = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const drawHeader = (doc: jsPDF, title: string) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(31, 61, 46);
  doc.text('Helios ELN', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(111, 103, 73);
  doc.text(tr(`LAB NOTEBOOK · HELIOS BILIM VE TEKNOLOJI · ${todayLabel()}`), 14, 23);

  doc.setDrawColor(205, 196, 173);
  doc.line(14, 26, 196, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(31, 61, 46);
  doc.text(tr(title), 14, 34);
};

const authorLookup = (legacyId: string | null, users: { id: string; name: string }[]) =>
  legacyId ? users.find((u) => u.id === legacyId)?.name ?? legacyId : '—';

type LastAutoTable = { lastAutoTable?: { finalY?: number } };

// ── Tek deney PDF (DETAY) ───────────────────────────────────────────────────

interface ExportExperimentPayload {
  experiment:        Experiment;
  parent:            Experiment | null;
  children:          Experiment[];
  materials:         ExperimentMaterial[];
  characterizations: ExperimentCharacterization[];
  mofName:           string;
  users:             { id: string; name: string }[];
}

export const exportExperimentPdf = ({
  experiment, parent, children, materials, characterizations, mofName, users,
}: ExportExperimentPayload) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const subTypeLabel = experiment.subType ? SUB_TYPE_LABEL[experiment.subType] : '';
    drawHeader(doc, `${mofName}${subTypeLabel ? ` · ${subTypeLabel}` : ''} — ${experiment.title}`);

    let y = 42;

    // Üst meta tablosu
    const metaRows: [string, string][] = [
      ['Deney Tarihi', formatDateShort(experiment.experimentDate)],
      ['Deney Sahibi', tr(authorLookup(experiment.authorId, users))],
      ['Batch No',     experiment.batchNo],
      ['Referans',     experiment.referenceUrl ?? '—'],
      ['Verim',        experiment.yieldPct !== null ? `%${experiment.yieldPct}` : '—'],
      ['Miktar',       tr(experiment.amount ?? '—')],
    ];
    if (experiment.subType === 'repeat')    metaRows.push([tr(SUB_TYPE_DETAIL_LABEL.repeat),    tr(experiment.repeatReason    ?? '—')]);
    if (experiment.subType === 'scale_up')  metaRows.push([tr(SUB_TYPE_DETAIL_LABEL.scale_up),  tr(experiment.scaleUpDetail   ?? '—')]);
    if (experiment.subType === 'parameter') metaRows.push([tr(SUB_TYPE_DETAIL_LABEL.parameter), tr(experiment.parameterDetail ?? '—')]);
    if (parent) metaRows.push(['Kaynak', tr(`${parent.title} (${parent.batchNo})`)]);

    autoTable(doc, {
      startY: y,
      body: metaRows.map(([k, v]) => [tr(k), v]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold', fillColor: [245, 239, 224], textColor: 100 },
        1: { cellWidth: 132 },
      },
    });
    y = ((doc as unknown as LastAutoTable).lastAutoTable?.finalY ?? y) + 6;

    // Markdown bölümler
    const sections: [string, string | null][] = [
      ['Genel bakis',                          experiment.generalOverview],
      ['Neden bu deney? / Onceki deneyden farki', experiment.reasonDiff],
      ['Prosedur, Cihaz ve Teknik',            experiment.procedureEquipment],
      ['Deney Plani ve Sonuclari',             experiment.planResults],
    ];
    for (const [label, val] of sections) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 61, 46);
      doc.text(tr(label), 14, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const text = val ? tr(val) : '— (bos)';
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 14, y);
      y += lines.length * 4 + 4;
    }

    // Malzemeler
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 61, 46);
    doc.text('Malzemeler', 14, y);
    y += 3;
    if (materials.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [[tr('Malzeme'), 'Miktar']],
        body: materials.map((m) => [tr(m.name), tr(m.amount ?? '—')]),
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [31, 61, 46], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 239, 224] },
      });
      y = ((doc as unknown as LastAutoTable).lastAutoTable?.finalY ?? y) + 6;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text('  (malzeme eklenmemis)', 14, y + 3);
      y += 8;
    }

    // Karakterizasyonlar
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 61, 46);
    doc.text('Karakterizasyonlar', 14, y);
    y += 3;
    if (characterizations.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [[tr('Tur'), tr('Deger'), 'Tarih', 'Yapan', 'Notlar']],
        body: characterizations.map((c) => [
          tr(c.type), tr(c.value ?? '—'),
          c.performedAt ? formatDateShort(c.performedAt) : '—',
          tr(authorLookup(c.performedById, users)),
          tr(c.notes ?? '—'),
        ]),
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [186, 117, 23], textColor: 255 },
        alternateRowStyles: { fillColor: [250, 238, 218] },
      });
      y = ((doc as unknown as LastAutoTable).lastAutoTable?.finalY ?? y) + 6;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text('  (analiz eklenmemis)', 14, y + 3);
      y += 8;
    }

    // Alt deneyler özeti
    if (children.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 61, 46);
      doc.text('Alt Deneyler', 14, y);
      y += 3;
      autoTable(doc, {
        startY: y,
        head: [[tr('Baslik'), tr('Tur'), 'Batch No', 'Tarih']],
        body: children.map((c) => [
          tr(c.title),
          c.subType ? tr(SUB_TYPE_LABEL[c.subType]) : '—',
          c.batchNo,
          formatDateShort(c.experimentDate),
        ]),
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [15, 110, 86], textColor: 255 },
        alternateRowStyles: { fillColor: [225, 245, 238] },
      });
    }

    doc.save(`helios-eln-deney-${experiment.batchNo.replace(/[^a-z0-9-]+/gi, '-')}-${todayLabel()}.pdf`);
  } catch (err: unknown) {
    toast.error('PDF üretilemedi: ' + (err instanceof Error ? err.message : String(err)));
  }
};

// ── MOF kategorisi için tablo PDF ───────────────────────────────────────────

export const exportCategoryPdf = (
  category: MofCategory,
  experiments: Experiment[],
  users: { id: string; name: string }[],
) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    drawHeader(doc, `${category.name} — Deneyler`);

    const body = experiments.map((e, idx) => [
      (idx + 1).toString(),
      tr(e.title),
      e.batchNo,
      e.yieldPct !== null ? `%${e.yieldPct}` : '—',
      tr(e.amount ?? '—'),
      formatDateShort(e.experimentDate),
      tr(authorLookup(e.authorId, users)),
      e.subType ? tr(SUB_TYPE_LABEL[e.subType]) : '—',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', tr('Deney'), 'Batch No', 'Verim', 'Miktar', 'Tarih', 'Yapan', tr('Tur')]],
      body,
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [31, 61, 46], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 239, 224] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 42 },
        2: { cellWidth: 26 },
        3: { cellWidth: 14 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 26 },
        7: { cellWidth: 26 },
      },
    });

    doc.save(`helios-eln-${category.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${todayLabel()}.pdf`);
  } catch (err: unknown) {
    toast.error('PDF üretilemedi: ' + (err instanceof Error ? err.message : String(err)));
  }
};

// ── Tüm Lab Book yedeği ─────────────────────────────────────────────────────

interface ExportAllPayload {
  categories:        MofCategory[];
  experiments:       Experiment[];     // tüm deneyler (sentez + şekillendirme)
  materials:         ExperimentMaterial[];
  characterizations: ExperimentCharacterization[];
  variants:          ShapingVariant[];
  literature:        LiteratureItem[];
  trainings:         Training[];
  users:             { id: string; name: string }[];
}

// ── Yardımcılar (tüm-yedek için) ────────────────────────────────────────────
// Her şey autoTable üzerinden çizilir; otomatik sayfa kırılması autoTable'a
// bırakılır. Böylece manuel Y takibinden kaynaklanan üstüste binme olmaz.

type Ctx = { doc: jsPDF; y: number };

const getFinalY = (doc: jsPDF): number =>
  (doc as unknown as LastAutoTable).lastAutoTable?.finalY ?? 20;

const push = (
  ctx: Ctx,
  opts: Parameters<typeof autoTable>[1],
  gapAfter = 2,
) => {
  autoTable(ctx.doc, { ...opts, startY: ctx.y });
  ctx.y = getFinalY(ctx.doc) + gapAfter;
};

const sectionBar = (ctx: Ctx, title: string, fill: [number, number, number] = [31, 61, 46]) => {
  push(ctx, {
    body: [[{
      content: tr(title),
      styles: {
        fontStyle: 'bold', fontSize: 12,
        textColor: [255, 255, 255], fillColor: fill,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      },
    }]],
    styles: { font: 'helvetica' },
    margin: { left: 14, right: 14 },
  }, 3);
};

const subBar = (ctx: Ctx, title: string, indent = 14, fill: [number, number, number] = [245, 239, 224]) => {
  push(ctx, {
    body: [[{
      content: tr(title),
      styles: {
        fontStyle: 'bold', fontSize: 10,
        textColor: [31, 61, 46], fillColor: fill,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
    }]],
    styles: { font: 'helvetica' },
    margin: { left: indent, right: 14 },
  }, 2);
};

const textBlock = (
  ctx: Ctx,
  label: string,
  value: string | null,
  indent = 14,
) => {
  if (!value || !value.trim()) return;
  push(ctx, {
    body: [
      [{
        content: tr(label),
        styles: {
          fontStyle: 'bold', fontSize: 9,
          textColor: [31, 61, 46], fillColor: [250, 245, 232],
          cellPadding: { top: 1.5, bottom: 1.5, left: 2.5, right: 2.5 },
        },
      }],
      [{
        content: tr(value),
        styles: {
          fontSize: 8.5, textColor: [60, 60, 60],
          cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
          overflow: 'linebreak',
        },
      }],
    ],
    styles: { font: 'helvetica' },
    margin: { left: indent, right: 14 },
  }, 2);
};

const metaTable = (
  ctx: Ctx,
  rows: [string, string][],
  indent = 14,
  keyFill: [number, number, number] = [250, 245, 232],
) => {
  if (rows.length === 0) return;
  push(ctx, {
    body: rows.map(([k, v]) => [tr(k), v]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', fillColor: keyFill, textColor: 90 },
    },
    margin: { left: indent, right: 14 },
  }, 2);
};

const renderExperiment = (
  ctx:    Ctx,
  exp:    Experiment,
  data:   ExportAllPayload,
  depth:  number,
  parent: Experiment | null,
) => {
  const indent = 14 + depth * 5;
  const mats   = data.materials.filter((m) => m.experimentId === exp.id).sort((a, b) => a.position - b.position);
  const chars  = data.characterizations.filter((c) => c.experimentId === exp.id).sort((a, b) => a.position - b.position);

  // Başlık çubuğu
  const subTypeLabel = exp.subType ? `  ·  ${SUB_TYPE_LABEL[exp.subType]}` : '';
  subBar(ctx, `${exp.title}${subTypeLabel}`, indent);

  // Meta
  const meta: [string, string][] = [
    ['Batch No',     exp.batchNo],
    ['Tarih',        formatDateShort(exp.experimentDate)],
    ['Deney Sahibi', tr(authorLookup(exp.authorId, data.users))],
    ['Verim',        exp.yieldPct !== null ? `%${exp.yieldPct}` : '—'],
    ['Miktar',       tr(exp.amount ?? '—')],
  ];
  if (exp.referenceUrl) meta.push(['Referans', exp.referenceUrl]);
  if (exp.subType === 'repeat'    && exp.repeatReason)    meta.push([tr(SUB_TYPE_DETAIL_LABEL.repeat),    tr(exp.repeatReason)]);
  if (exp.subType === 'scale_up'  && exp.scaleUpDetail)   meta.push([tr(SUB_TYPE_DETAIL_LABEL.scale_up),  tr(exp.scaleUpDetail)]);
  if (exp.subType === 'parameter' && exp.parameterDetail) meta.push([tr(SUB_TYPE_DETAIL_LABEL.parameter), tr(exp.parameterDetail)]);
  if (parent) meta.push(['Kaynak Deney', tr(`${parent.title} (${parent.batchNo})`)]);
  metaTable(ctx, meta, indent);

  // Markdown bölümler
  textBlock(ctx, 'Genel Bakis',                              exp.generalOverview,    indent);
  textBlock(ctx, 'Neden Bu Deney / Onceki Deneyden Farki',   exp.reasonDiff,         indent);
  textBlock(ctx, 'Prosedur, Cihaz ve Teknik',                exp.procedureEquipment, indent);
  textBlock(ctx, 'Deney Plani ve Sonuclari',                 exp.planResults,        indent);

  // Malzemeler
  if (mats.length > 0) {
    push(ctx, {
      head: [[tr('Malzeme'), 'Miktar']],
      body: mats.map((m) => [tr(m.name), tr(m.amount ?? '—')]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [31, 61, 46], textColor: 255, fontSize: 8.5 },
      alternateRowStyles: { fillColor: [245, 239, 224] },
      margin: { left: indent, right: 14 },
    }, 2);
  }

  // Karakterizasyonlar
  if (chars.length > 0) {
    push(ctx, {
      head: [[tr('Tur'), tr('Deger'), 'Tarih', 'Yapan', 'Notlar']],
      body: chars.map((c) => [
        tr(c.type),
        tr(c.value ?? '—'),
        c.performedAt ? formatDateShort(c.performedAt) : '—',
        tr(authorLookup(c.performedById, data.users)),
        tr(c.notes ?? '—'),
      ]),
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [186, 117, 23], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 238, 218] },
      margin: { left: indent, right: 14 },
    }, 3);
  }

  // Alt deneyler — recursive
  const children = data.experiments
    .filter((e) => e.parentId === exp.id)
    .sort((a, b) => a.experimentDate.localeCompare(b.experimentDate));
  for (const child of children) {
    renderExperiment(ctx, child, data, depth + 1, exp);
  }

  ctx.y += 2; // deney sonu boşluğu
};

const newSection = (ctx: Ctx, title: string) => {
  ctx.doc.addPage();
  drawHeader(ctx.doc, title);
  ctx.y = 42;
};

const italicNote = (ctx: Ctx, text: string, indent = 14) => {
  push(ctx, {
    body: [[{
      content: tr(text),
      styles: {
        fontStyle: 'italic', fontSize: 9,
        textColor: [140, 140, 140], fillColor: [255, 255, 255],
        cellPadding: 2,
      },
    }]],
    styles: { font: 'helvetica' },
    margin: { left: indent, right: 14 },
  }, 2);
};

export const exportAllPdf = (data: ExportAllPayload) => {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ctx: Ctx = { doc, y: 42 };

    // ── Kapak / Özet ─────────────────────────────────────────────────────
    drawHeader(doc, 'Yedek — Tum Veriler');
    const synthCount   = data.experiments.filter((e) => e.shapingVariantId === null).length;
    const shapingCount = data.experiments.filter((e) => e.shapingVariantId !== null).length;
    push(ctx, {
      head: [['Bolum', 'Adet']],
      body: [
        ['MOF Kategorileri',            data.categories.length.toString()],
        ['Sentez Deneyleri',            synthCount.toString()],
        ['Sekillendirme Varyantlari',   data.variants.length.toString()],
        ['Sekillendirme Deneyleri',     shapingCount.toString()],
        ['Karakterizasyonlar',          data.characterizations.length.toString()],
        [tr('Malzeme Kayitlari'),       data.materials.length.toString()],
        ['Literatur',                   data.literature.length.toString()],
        ['Egitim / Tutorial',           data.trainings.length.toString()],
      ],
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [31, 61, 46], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 239, 224] },
      margin: { left: 14, right: 14 },
    });

    // ── MOF Üretimi ──────────────────────────────────────────────────────
    newSection(ctx, 'MOF Uretimi');
    for (const cat of data.categories) {
      const topLevelSentez = data.experiments
        .filter((e) => e.mofCategoryId === cat.id && e.shapingVariantId === null && e.parentId === null)
        .sort((a, b) => b.experimentDate.localeCompare(a.experimentDate));
      const totalForCat = data.experiments.filter((e) => e.mofCategoryId === cat.id && e.shapingVariantId === null).length;

      sectionBar(ctx, `${cat.name}  (${totalForCat} deney)`);

      if (topLevelSentez.length === 0) {
        italicNote(ctx, '(deney yok)');
        continue;
      }
      for (const exp of topLevelSentez) {
        renderExperiment(ctx, exp, data, 0, null);
      }
    }

    // ── Şekillendirme ────────────────────────────────────────────────────
    newSection(ctx, 'Sekillendirme');
    if (data.variants.length === 0) {
      italicNote(ctx, '(sekillendirme varyanti tanimlanmamis)');
    } else {
      for (const cat of data.categories) {
        const catVariants = data.variants
          .filter((v) => v.mofCategoryId === cat.id)
          .sort((a, b) => a.position - b.position);
        if (catVariants.length === 0) continue;

        sectionBar(ctx, cat.name, [186, 117, 23]);

        for (const v of catVariants) {
          const topLevelShaping = data.experiments
            .filter((e) => e.shapingVariantId === v.id && e.parentId === null)
            .sort((a, b) => b.experimentDate.localeCompare(a.experimentDate));
          const totalForVar = data.experiments.filter((e) => e.shapingVariantId === v.id).length;

          subBar(ctx, `${v.name}  (${totalForVar} deney)`, 14, [250, 238, 218]);

          if (topLevelShaping.length === 0) {
            italicNote(ctx, '(deney yok)', 18);
            continue;
          }
          for (const exp of topLevelShaping) {
            renderExperiment(ctx, exp, data, 0, null);
          }
        }
      }
    }

    // ── Literatür ────────────────────────────────────────────────────────
    newSection(ctx, 'Literatur');
    if (data.literature.length === 0) {
      italicNote(ctx, '(literatur kaydi yok)');
    } else {
      for (const l of data.literature) {
        subBar(ctx, l.title, 14, [225, 245, 238]);

        const meta: [string, string][] = [];
        if (l.authors) meta.push(['Yazarlar',   tr(l.authors)]);
        if (l.journal) meta.push(['Dergi',      tr(l.journal)]);
        if (l.year)    meta.push(['Yil',        l.year.toString()]);
        if (l.subject) meta.push(['Konu / MOF', tr(l.subject)]);
        if (l.doi)     meta.push(['DOI',        tr(l.doi)]);
        if (l.url)     meta.push(['URL',        tr(l.url)]);
        meta.push(['Ekleyen', tr(authorLookup(l.addedBy, data.users))]);
        meta.push(['Eklenme', formatDateShort(l.createdAt)]);
        metaTable(ctx, meta, 14, [240, 250, 246]);

        textBlock(ctx, 'Ozet',               l.summary,     14);
        textBlock(ctx, 'Helios icin Notlar', l.heliosNotes, 14);
        ctx.y += 2;
      }
    }

    // ── Eğitim ───────────────────────────────────────────────────────────
    newSection(ctx, 'Egitim / Tutorial');
    if (data.trainings.length === 0) {
      italicNote(ctx, '(egitim kaydi yok)');
    } else {
      for (const t of data.trainings) {
        subBar(ctx, t.title, 14, [230, 241, 251]);

        const meta: [string, string][] = [];
        if (t.category) meta.push(['Kategori', tr(t.category)]);
        if (t.level)    meta.push(['Seviye',   tr(t.level)]);
        if (t.url)      meta.push(['URL',      tr(t.url)]);
        meta.push(['Hazirlayan', tr(authorLookup(t.addedBy, data.users))]);
        meta.push(['Eklenme',    formatDateShort(t.createdAt)]);
        metaTable(ctx, meta, 14, [240, 247, 253]);

        textBlock(ctx, 'Amac',                t.purpose,     14);
        textBlock(ctx, 'Adimlar',             t.steps,       14);
        textBlock(ctx, 'Uyarilar / Guvenlik', t.safetyNotes, 14);
        ctx.y += 2;
      }
    }

    doc.save(`helios-eln-yedek-${todayLabel()}.pdf`);
  } catch (err: unknown) {
    toast.error('PDF üretilemedi: ' + (err instanceof Error ? err.message : String(err)));
  }
};
