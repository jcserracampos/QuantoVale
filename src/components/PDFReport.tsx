// Componente para geração de relatório PDF
// Usa jsPDF para criar documento A4 com disclaimer legal

import { jsPDF } from 'jspdf';
import type { ValuationFormData, ValuationResult } from '@/types/valuation';
import { formatarBRL, formatarUSD, formatarNumeroGrande } from '@/utils/formulas';
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

// Disclaimer legal obrigatório
const DISCLAIMER = `AVISO LEGAL: Esta é uma APROXIMAÇÃO de valuation baseada nos dados fornecidos pelo usuário. Não constitui assessoria financeira, auditoria ou garantia de valor real. Não nos responsabilizamos por decisões baseadas nisso. Consulte profissionais qualificados.`;

// Função para gerar o PDF
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
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper para adicionar texto com quebra de linha
  const addText = (text: string, x: number, yPos: number, options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  }) => {
    const opts = {
      fontSize: 10,
      fontStyle: 'normal' as const,
      color: [0, 0, 0] as [number, number, number],
      maxWidth: contentWidth,
      align: 'left' as const,
      ...options,
    };

    doc.setFontSize(opts.fontSize);
    doc.setFont('helvetica', opts.fontStyle);
    doc.setTextColor(opts.color[0], opts.color[1], opts.color[2]);

    if (opts.align === 'center') {
      doc.text(text, pageWidth / 2, yPos, { align: 'center', maxWidth: opts.maxWidth });
    } else if (opts.align === 'right') {
      doc.text(text, pageWidth - margin, yPos, { align: 'right', maxWidth: opts.maxWidth });
    } else {
      doc.text(text, x, yPos, { maxWidth: opts.maxWidth });
    }
  };

  // ========== HEADER ==========
  addText('RELATÓRIO DE VALUATION', margin, y, {
    fontSize: 18,
    fontStyle: 'bold',
    align: 'center',
  });
  y += 8;

  const companyName = formData.basic.name || 'Empresa não informada';
  addText(companyName, margin, y, {
    fontSize: 14,
    fontStyle: 'bold',
    color: [59, 130, 246], // blue-500
    align: 'center',
  });
  y += 6;

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  addText(`Gerado em: ${dataGeracao}`, margin, y, {
    fontSize: 9,
    color: [100, 100, 100],
    align: 'center',
  });
  y += 10;

  // ========== DISCLAIMER (MUITO IMPORTANTE) ==========
  // Fundo vermelho claro
  doc.setFillColor(254, 226, 226); // red-100
  doc.rect(margin, y - 2, contentWidth, 22, 'F');

  // Borda vermelha
  doc.setDrawColor(239, 68, 68); // red-500
  doc.setLineWidth(0.5);
  doc.rect(margin, y - 2, contentWidth, 22, 'S');

  y += 3;
  addText('⚠️ AVISO LEGAL IMPORTANTE', margin + 3, y, {
    fontSize: 11,
    fontStyle: 'bold',
    color: [185, 28, 28], // red-700
  });
  y += 5;

  // Texto do disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29); // red-900
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, contentWidth - 6);
  doc.text(disclaimerLines, margin + 3, y);
  y += disclaimerLines.length * 3.5 + 8;

  // ========== DADOS DA EMPRESA ==========
  y += 3;
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  addText('DADOS DA EMPRESA', margin + 2, y, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  y += 8;

  const dadosEmpresa = [
    ['Setor:', formData.basic.setor],
    ['Estágio:', formData.basic.estagio],
    ['MRR:', formatarBRL(formData.financeiro.mrr)],
    ['ARR:', formatarBRL(formData.financeiro.arr)],
    ['EBITDA:', formatarBRL(formData.financeiro.ebitda)],
    ['Churn Mensal:', `${formData.financeiro.churn}%`],
    ['Clientes:', formData.financeiro.clientes.toString()],
    ['Crescimento (3y):', `${formData.projecoes.crescimento3y}%`],
    ['WACC:', `${formData.projecoes.wacc}%`],
  ];

  // Grid 2 colunas
  const colWidth = contentWidth / 2;
  dadosEmpresa.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = margin + (col * colWidth);
    const yPos = y + (row * 5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(item[0], xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39); // gray-900
    doc.text(item[1], xPos + 30, yPos);
  });

  y += Math.ceil(dadosEmpresa.length / 2) * 5 + 8;

  // ========== RESULTADOS POR MÉTODO ==========
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  addText('RESULTADOS POR METODOLOGIA', margin + 2, y, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  y += 8;

  // Cabeçalho da tabela
  doc.setFillColor(229, 231, 235); // gray-200
  doc.rect(margin, y - 3, contentWidth, 6, 'F');

  const colWidths = [45, 35, 35, 25, contentWidth - 140];
  const headers = ['Método', 'Valor (BRL)', 'Valor (USD)', 'Confiança', 'Premissas'];

  let xPos = margin;
  headers.forEach((header, i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(header, xPos + 1, y);
    xPos += colWidths[i];
  });
  y += 5;

  // Linhas da tabela
  results.forEach((result, index) => {
    // Verificar se precisa nova página
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Cor de fundo alternada
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(margin, y - 3, contentWidth, 5, 'F');
    }

    xPos = margin;
    doc.setFontSize(8);

    // Método
    doc.setFont('helvetica', result.aplicavel ? 'bold' : 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(result.metodo.substring(0, 18), xPos + 1, y);
    xPos += colWidths[0];

    // Valor BRL
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(result.aplicavel ? 17 : 156, result.aplicavel ? 24 : 163, result.aplicavel ? 39 : 175);
    doc.text(result.valorBRL > 0 ? formatarBRL(result.valorBRL) : 'N/A', xPos + 1, y);
    xPos += colWidths[1];

    // Valor USD
    doc.text(result.valorUSD > 0 ? formatarUSD(result.valorUSD) : '-', xPos + 1, y);
    xPos += colWidths[2];

    // Confiança
    const confColor: Record<string, [number, number, number]> = {
      'Alta': [22, 163, 74],    // green-600
      'Média': [202, 138, 4],   // yellow-600
      'Baixa': [220, 38, 38],   // red-600
    };
    doc.setTextColor(...(confColor[result.confianca] || [100, 100, 100]));
    doc.text(result.confianca, xPos + 1, y);
    xPos += colWidths[3];

    // Premissas (resumido)
    doc.setTextColor(107, 114, 128); // gray-500
    doc.setFontSize(7);
    const premissa = result.assuncoes?.[0]?.substring(0, 35) || result.detalhes?.substring(0, 35) || '';
    doc.text(premissa, xPos + 1, y);

    y += 5;
  });

  y += 8;

  // ========== RESUMO FINAL ==========
  // Verificar se precisa nova página
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(219, 234, 254); // blue-100
  doc.rect(margin, y - 4, contentWidth, 35, 'F');
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 4, contentWidth, 35, 'S');

  addText('RESUMO DA AVALIAÇÃO', margin + 2, y, {
    fontSize: 11,
    fontStyle: 'bold',
    color: [30, 64, 175], // blue-800
  });
  y += 7;

  // Valor ponderado (destaque)
  addText('Valuation Ponderado (Pre-Money):', margin + 2, y, {
    fontSize: 10,
    fontStyle: 'bold',
  });
  addText(formatarNumeroGrande(valorPonderado), margin + 75, y, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [30, 64, 175],
  });
  y += 5;

  // Post-money
  if (formData.rodada.investimento > 0) {
    addText('Post-Money (com investimento):', margin + 2, y, {
      fontSize: 9,
    });
    addText(formatarNumeroGrande(postMoney), margin + 75, y, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [22, 163, 74], // green-600
    });
    y += 5;
  }

  // Range
  addText('Range de Valores:', margin + 2, y, {
    fontSize: 9,
  });
  addText(`${formatarNumeroGrande(range.min)} - ${formatarNumeroGrande(range.max)}`, margin + 75, y, {
    fontSize: 9,
  });
  y += 5;

  // Metodologia recomendada
  addText('Metodologia Recomendada:', margin + 2, y, {
    fontSize: 9,
  });
  addText(metodologiaRecomendada, margin + 75, y, {
    fontSize: 9,
    fontStyle: 'bold',
  });
  y += 5;

  // Valor em USD
  addText('Equivalente USD:', margin + 2, y, {
    fontSize: 8,
    color: [107, 114, 128],
  });
  addText(`${formatarUSD(valorPonderado / EXCHANGE_RATE_USD_BRL)} (taxa: ${EXCHANGE_RATE_USD_BRL})`, margin + 75, y, {
    fontSize: 8,
    color: [107, 114, 128],
  });

  // ========== RODAPÉ ==========
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Página ${i} de ${pageCount} | ValuationCalc SaaS BR | ${dataGeracao}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Lembrete do disclaimer no rodapé
    doc.setFontSize(6);
    doc.setTextColor(239, 68, 68);
    doc.text(
      'Este documento não constitui assessoria financeira. Consulte profissionais qualificados.',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  // Download do arquivo
  const fileName = `valuation-${companyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Componente de botão para gerar PDF
export function PDFReportButton(props: PDFReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Pequeno delay para feedback visual
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
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Gerar PDF
        </>
      )}
    </button>
  );
}
