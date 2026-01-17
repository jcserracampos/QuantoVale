// Investment Memo Banking Style PDF Report
// Professional financial document layout with jsPDF

import { jsPDF } from 'jspdf';
import type { ValuationFormData, ValuationResult } from '@/types/valuation';
import { formatarBRL, formatarUSD, formatarNumeroGrande, formatarUSDGrande } from '@/utils/formulas';
import { EXCHANGE_RATE_USD_BRL } from '@/types/valuation';
import { FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PDFReportProps {
  formData: ValuationFormData;
  results: ValuationResult[];
  valorPonderado: number;
  valorMedio: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  postMoney: number;
}

// Disclaimer legal (moved to footer)
const DISCLAIMER = `Este documento não constitui assessoria financeira, auditoria ou garantia de valor. Consulte profissionais qualificados antes de tomar decisões.`;

// Investment Memo Banking Colors
const COLORS = {
  primary: [16, 185, 129] as [number, number, number],      // Emerald-500
  primaryDark: [5, 150, 105] as [number, number, number],   // Emerald-600
  textDark: [17, 24, 39] as [number, number, number],       // Gray-900
  textMedium: [75, 85, 99] as [number, number, number],     // Gray-600
  textLight: [156, 163, 175] as [number, number, number],   // Gray-400
  bgLight: [249, 250, 251] as [number, number, number],     // #F9FAFB
  bgZebra: [250, 250, 250] as [number, number, number],     // #FAFAFA
  warning: [245, 158, 11] as [number, number, number],      // Amber-500
  success: [22, 163, 74] as [number, number, number],       // Green-600
  error: [220, 38, 38] as [number, number, number],         // Red-600
};

// Threshold for outlier detection (1 trillion BRL)
const OUTLIER_THRESHOLD = 1_000_000_000_000;

// Stage-based maximum valuations for sanity check
const STAGE_MAX_VALUATIONS: Record<string, number> = {
  'pre-seed': 50_000_000,      // R$ 50M max
  'seed': 200_000_000,         // R$ 200M max
  'serie-a': 1_000_000_000,    // R$ 1B max
  'serie-b': 5_000_000_000,    // R$ 5B max
  'maduro': 50_000_000_000,    // R$ 50B max
};

function isOutlierValue(value: number, stage: string): boolean {
  if (value <= 0 || !isFinite(value)) return true;
  if (value > OUTLIER_THRESHOLD) return true;
  const maxForStage = STAGE_MAX_VALUATIONS[stage] || OUTLIER_THRESHOLD;
  return value > maxForStage * 5; // 5x the expected max is considered outlier
}

function generateDocumentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VM-${timestamp.slice(-4)}-${random}`;
}

export function gerarPDF(props: PDFReportProps): void {
  const {
    formData,
    results,
    valorPonderado,
    range,
    metodologiaRecomendada,
    postMoney,
  } = props;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const documentId = generateDocumentId();
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const companyName = formData.basic.name || 'Empresa';
  const stage = formData.basic.estagio || 'seed';

  // Filter results and mark outliers
  const processedResults = results.map(result => ({
    ...result,
    isOutlier: isOutlierValue(result.valorBRL, stage),
  }));

  // Helper: Add text with options
  const addText = (text: string, x: number, yPos: number, options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
    font?: 'helvetica' | 'courier';
  }) => {
    const opts = {
      fontSize: 10,
      fontStyle: 'normal' as const,
      color: COLORS.textDark,
      maxWidth: contentWidth,
      align: 'left' as const,
      font: 'helvetica' as const,
      ...options,
    };

    doc.setFontSize(opts.fontSize);
    doc.setFont(opts.font, opts.fontStyle);
    doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);

    if (opts.align === 'center') {
      doc.text(text, pageWidth / 2, yPos, { align: 'center', maxWidth: opts.maxWidth });
    } else if (opts.align === 'right') {
      doc.text(text, pageWidth - margin, yPos, { align: 'right', maxWidth: opts.maxWidth });
    } else {
      doc.text(text, x, yPos, { maxWidth: opts.maxWidth });
    }
  };

  // Helper: Draw rounded rectangle
  const drawRoundedRect = (x: number, yPos: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean) => {
    doc.roundedRect(x, yPos, width, height, radius, radius, fill ? (stroke ? 'FD' : 'F') : 'S');
  };

  // ========== HEADER (Investment Memo Style) ==========
  // Logo/Brand left
  addText('ValuationCalc', margin, y + 2, {
    fontSize: 16,
    fontStyle: 'bold',
    color: COLORS.primary,
  });
  addText('SaaS BR', margin, y + 7, {
    fontSize: 9,
    fontStyle: 'normal',
    color: COLORS.textMedium,
  });

  // Date and Document ID right
  addText(dataGeracao, margin, y + 2, {
    fontSize: 10,
    align: 'right',
    color: COLORS.textMedium,
  });
  addText(`ID: ${documentId}`, margin, y + 7, {
    fontSize: 8,
    align: 'right',
    color: COLORS.textLight,
  });

  y += 12;

  // Thick horizontal line in primary color
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Company name subtitle
  addText(companyName.toUpperCase(), margin, y, {
    fontSize: 12,
    fontStyle: 'bold',
    color: COLORS.textDark,
  });
  addText(`${formData.basic.setor} • ${formData.basic.estagio.toUpperCase()}`, margin, y + 5, {
    fontSize: 9,
    color: COLORS.textMedium,
  });
  y += 14;

  // ========== EXECUTIVE SUMMARY (Top Section) ==========
  doc.setFillColor(COLORS.bgLight[0], COLORS.bgLight[1], COLORS.bgLight[2]);
  doc.setDrawColor(229, 231, 235); // Gray-200 border
  doc.setLineWidth(0.3);
  drawRoundedRect(margin, y - 2, contentWidth, 38, 3, true, true);

  y += 4;
  addText('EXECUTIVE SUMMARY', margin + 8, y, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.textMedium,
  });
  y += 8;

  // Large Valuation Display (32pt+)
  addText('Valuation Ponderado', margin + 8, y, {
    fontSize: 9,
    color: COLORS.textMedium,
  });
  y += 10;
  addText(formatarNumeroGrande(valorPonderado), margin + 8, y, {
    fontSize: 32,
    fontStyle: 'bold',
    color: COLORS.primaryDark,
  });

  // USD equivalent inline
  const usdValue = formatarUSDGrande(valorPonderado / EXCHANGE_RATE_USD_BRL);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text(`(${usdValue})`, margin + 75, y);

  y += 8;

  // Range below
  addText(`Range: ${formatarNumeroGrande(range.min)} – ${formatarNumeroGrande(range.max)}`, margin + 8, y, {
    fontSize: 10,
    color: COLORS.textMedium,
  });

  y += 16;

  // ========== 3-COLUMN METRICS GRID ==========
  const metricsColWidth = contentWidth / 3;
  const metrics = [
    { label: 'MRR', value: formatarBRL(formData.financeiro.mrr) },
    { label: 'ARR', value: formatarBRL(formData.financeiro.arr) },
    { label: 'Churn Mensal', value: `${formData.financeiro.churn}%` },
  ];

  metrics.forEach((metric, index) => {
    const xPos = margin + (index * metricsColWidth) + 8;

    // Label (small, gray, above)
    addText(metric.label.toUpperCase(), xPos, y, {
      fontSize: 8,
      color: COLORS.textLight,
    });

    // Value (large, black, below)
    addText(metric.value, xPos, y + 6, {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.textDark,
    });
  });

  y += 16;

  // Secondary metrics grid
  const secondaryMetrics = [
    { label: 'EBITDA', value: formatarBRL(formData.financeiro.ebitda) },
    { label: 'Clientes', value: formData.financeiro.clientes.toLocaleString('pt-BR') },
    { label: 'Crescimento 3y', value: `${formData.projecoes.crescimento3y}%` },
  ];

  secondaryMetrics.forEach((metric, index) => {
    const xPos = margin + (index * metricsColWidth) + 8;

    addText(metric.label.toUpperCase(), xPos, y, {
      fontSize: 8,
      color: COLORS.textLight,
    });

    addText(metric.value, xPos, y + 6, {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.textDark,
    });
  });

  y += 18;

  // ========== METHODS TABLE (Investment Memo Style) ==========
  // Section header
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 50, y);
  y += 5;

  addText('METODOLOGIAS DE VALUATION', margin, y, {
    fontSize: 10,
    fontStyle: 'bold',
    color: COLORS.textDark,
  });
  y += 8;

  // Table header (no vertical borders, clean style)
  const tableColWidths = [50, 38, 38, 28, contentWidth - 154];
  const tableHeaders = ['Método', 'Valor (BRL)', 'Valor (USD)', 'Confiança', 'Premissas'];

  // Header background
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y - 3, contentWidth, 7, 'F');

  let xPos = margin;
  tableHeaders.forEach((header, i) => {
    const align = (i === 1 || i === 2) ? 'right' : 'left';
    const textX = align === 'right' ? xPos + tableColWidths[i] - 2 : xPos + 2;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.textMedium[0], COLORS.textMedium[1], COLORS.textMedium[2]);

    if (align === 'right') {
      doc.text(header, textX, y, { align: 'right' });
    } else {
      doc.text(header, textX, y);
    }
    xPos += tableColWidths[i];
  });
  y += 6;

  // Table rows with zebra striping
  processedResults.forEach((result, index) => {
    if (y > 255) {
      doc.addPage();
      y = margin;
    }

    // Zebra striping (subtle #FAFAFA on even rows)
    if (index % 2 === 0) {
      doc.setFillColor(COLORS.bgZebra[0], COLORS.bgZebra[1], COLORS.bgZebra[2]);
      doc.rect(margin, y - 3, contentWidth, 6, 'F');
    }

    // Outlier warning background
    if (result.isOutlier && result.valorBRL > 0) {
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.rect(margin, y - 3, contentWidth, 6, 'F');
    }

    xPos = margin;

    // Method name
    doc.setFontSize(8);
    doc.setFont('helvetica', result.aplicavel ? 'bold' : 'normal');
    doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);

    let methodName = result.metodo.length > 20 ? result.metodo.substring(0, 18) + '...' : result.metodo;
    if (result.isOutlier && result.valorBRL > 0) {
      methodName = '⚠ ' + methodName;
    }
    doc.text(methodName, xPos + 2, y);
    xPos += tableColWidths[0];

    // Value BRL (right-aligned, monospace)
    doc.setFont('courier', 'normal');
    if (!result.aplicavel || result.valorBRL <= 0) {
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.text('N/A', xPos + tableColWidths[1] - 2, y, { align: 'right' });
    } else if (result.isOutlier) {
      doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
      doc.text(formatarBRL(result.valorBRL), xPos + tableColWidths[1] - 2, y, { align: 'right' });
    } else {
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      doc.text(formatarBRL(result.valorBRL), xPos + tableColWidths[1] - 2, y, { align: 'right' });
    }
    xPos += tableColWidths[1];

    // Value USD (right-aligned, monospace)
    if (!result.aplicavel || result.valorUSD <= 0) {
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.text('-', xPos + tableColWidths[2] - 2, y, { align: 'right' });
    } else if (result.isOutlier) {
      doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
      doc.text(formatarUSD(result.valorUSD), xPos + tableColWidths[2] - 2, y, { align: 'right' });
    } else {
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      doc.text(formatarUSD(result.valorUSD), xPos + tableColWidths[2] - 2, y, { align: 'right' });
    }
    xPos += tableColWidths[2];

    // Confidence (color-coded)
    doc.setFont('helvetica', 'normal');
    const confColor: Record<string, [number, number, number]> = {
      'Alta': COLORS.success,
      'Média': COLORS.warning,
      'Baixa': COLORS.error,
    };
    doc.setTextColor(...(confColor[result.confianca] || COLORS.textMedium));
    doc.text(result.confianca, xPos + 2, y);
    xPos += tableColWidths[3];

    // Assumptions (truncated)
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.setFontSize(7);
    const premissa = result.assuncoes?.[0]?.substring(0, 40) || result.detalhes?.substring(0, 40) || '-';
    doc.text(premissa, xPos + 2, y);

    y += 6;
  });

  // Outlier note if any exist
  const outlierCount = processedResults.filter(r => r.isOutlier && r.valorBRL > 0).length;
  if (outlierCount > 0) {
    y += 3;
    addText(`⚠ ${outlierCount} método(s) com valores atípicos foram destacados e podem ter sido excluídos da média ponderada.`, margin, y, {
      fontSize: 7,
      color: COLORS.warning,
    });
    y += 6;
  }

  y += 8;

  // ========== POST-MONEY & ADDITIONAL INFO ==========
  if (formData.rodada.investimento > 0) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 30, y);
    y += 5;

    addText('PROJEÇÃO POST-MONEY', margin, y, {
      fontSize: 10,
      fontStyle: 'bold',
      color: COLORS.textDark,
    });
    y += 8;

    addText('Investimento:', margin, y, {
      fontSize: 9,
      color: COLORS.textMedium,
    });
    addText(formatarBRL(formData.rodada.investimento), margin + 50, y, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.textDark,
    });
    y += 5;

    addText('Post-Money:', margin, y, {
      fontSize: 9,
      color: COLORS.textMedium,
    });
    addText(formatarNumeroGrande(postMoney), margin + 50, y, {
      fontSize: 11,
      fontStyle: 'bold',
      color: COLORS.success,
    });
    y += 5;

    const diluicao = ((formData.rodada.investimento / postMoney) * 100).toFixed(1);
    addText('Diluição:', margin, y, {
      fontSize: 9,
      color: COLORS.textMedium,
    });
    addText(`${diluicao}%`, margin + 50, y, {
      fontSize: 9,
      fontStyle: 'bold',
      color: COLORS.textDark,
    });
    y += 8;
  }

  // Methodology recommendation
  if (y > 265) {
    doc.addPage();
    y = margin;
  }

  addText('Metodologia Recomendada:', margin, y, {
    fontSize: 9,
    color: COLORS.textMedium,
  });
  addText(metodologiaRecomendada, margin + 50, y, {
    fontSize: 9,
    fontStyle: 'bold',
    color: COLORS.primary,
  });

  // ========== FOOTER (All Pages) ==========
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    // Page number and branding
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text(
      `Página ${i} de ${pageCount}`,
      margin,
      pageHeight - 12
    );
    doc.text(
      `${documentId} • ${dataGeracao}`,
      pageWidth - margin,
      pageHeight - 12,
      { align: 'right' }
    );

    // Disclaimer (8pt, gray #9CA3AF)
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // #9CA3AF
    const disclaimerLines = doc.splitTextToSize(DISCLAIMER, contentWidth);
    doc.text(
      disclaimerLines,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `valuation-${companyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Button component
export function PDFReportButton(props: PDFReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      gerarPDF(props);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="btn-secondary flex items-center justify-center gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          PDF
        </>
      )}
    </button>
  );
}
