// Fórmulas de Valuation para Startups/SaaS
// Suporte completo: DCF, Múltiplos, Berkus, Scorecard, Patrimônio
// Ajustes automáticos por estágio/rodada

import type {
  Setor,
  Estagio,
  MultiploSetor,
  MultiploEstagio,
  ValuationFormData,
  ValuationResult,
  MetodoValuation,
} from '@/types/valuation';
import {
  EXCHANGE_RATE_USD_BRL,
  BERKUS_MAX_POR_FATOR,
  SCORECARD_MEDIA_SETOR,
} from '@/types/valuation';

// Taxa de câmbio USD/BRL
const USD_BRL = EXCHANGE_RATE_USD_BRL;

// ============================================
// CONFIGURAÇÕES POR ESTÁGIO/RODADA
// ============================================

export const MULTIPLOS_ESTAGIO: Record<Estagio, MultiploEstagio> = {
  'Pre-seed': {
    arrMin: 0,      // N/A - usa qualitativos
    arrMax: 0,
    waccDefault: 30,
    metodosPreferidos: ['Berkus', 'Scorecard'],
    pesoQualitativo: 0.7,  // 70% peso qualitativos
    pesoDCF: 0.1,
  },
  'Seed': {
    arrMin: 4,
    arrMax: 6,
    waccDefault: 25,
    metodosPreferidos: ['Berkus', 'Scorecard', 'Múltiplos ARR'],
    pesoQualitativo: 0.6,
    pesoDCF: 0.15,
  },
  'Serie-A': {
    arrMin: 6,
    arrMax: 9,
    waccDefault: 18,
    metodosPreferidos: ['Múltiplos ARR', 'DCF', 'Scorecard'],
    pesoQualitativo: 0.3,
    pesoDCF: 0.35,
  },
  'Serie-B+': {
    arrMin: 8,
    arrMax: 12,
    waccDefault: 15,
    metodosPreferidos: ['Múltiplos ARR', 'Múltiplos EBITDA', 'DCF'],
    pesoQualitativo: 0.15,
    pesoDCF: 0.45,
  },
  'Maduro': {
    arrMin: 10,
    arrMax: 15,
    ebitdaMin: 10,
    ebitdaMax: 15,
    waccDefault: 12,
    metodosPreferidos: ['Múltiplos EBITDA', 'DCF', 'Múltiplos ARR', 'Patrimônio Líquido'],
    pesoQualitativo: 0.05,
    pesoDCF: 0.5,
  },
};

// Múltiplos de ARR por setor - Dados Brasil 2026
export const MULTIPLOS_SETOR: Record<Setor, MultiploSetor> = {
  'SaaS/Tech': { min: 7, max: 12, avg: 9.5, ebitdaMin: 8, ebitdaMax: 15 },
  'Fintech': { min: 8, max: 15, avg: 11, ebitdaMin: 10, ebitdaMax: 18 },
  'E-commerce': { min: 1.5, max: 4, avg: 2.5, ebitdaMin: 5, ebitdaMax: 10 },
  'Marketplace': { min: 4, max: 8, avg: 6, ebitdaMin: 8, ebitdaMax: 14 },
  'EdTech': { min: 5, max: 10, avg: 7, ebitdaMin: 6, ebitdaMax: 12 },
  'HealthTech': { min: 6, max: 12, avg: 8.5, ebitdaMin: 8, ebitdaMax: 15 },
  'LogTech': { min: 4, max: 8, avg: 5.5, ebitdaMin: 6, ebitdaMax: 11 },
  'AgTech': { min: 5, max: 9, avg: 6.5, ebitdaMin: 7, ebitdaMax: 12 },
  'Outro': { min: 3, max: 7, avg: 5, ebitdaMin: 5, ebitdaMax: 10 },
};

// WACC padrão por setor (fallback se não definido por estágio)
export const WACC_PADRAO: Record<Setor, number> = {
  'SaaS/Tech': 18,
  'Fintech': 20,
  'E-commerce': 22,
  'Marketplace': 19,
  'EdTech': 17,
  'HealthTech': 16,
  'LogTech': 21,
  'AgTech': 19,
  'Outro': 20,
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Retorna WACC padrão baseado no estágio (prioridade) ou setor
 */
export function getWACCPadrao(estagio: Estagio, setor: Setor): number {
  return MULTIPLOS_ESTAGIO[estagio].waccDefault || WACC_PADRAO[setor];
}

/**
 * Verifica se método é aplicável ao estágio
 */
export function isMetodoAplicavel(metodo: MetodoValuation, estagio: Estagio, data: ValuationFormData): boolean {
  const { arr, ebitda } = data.financeiro;

  switch (metodo) {
    case 'Múltiplos ARR':
      // N/A para Pre-seed, precisa de ARR > 0 para outros
      return estagio !== 'Pre-seed' && arr > 0;

    case 'Múltiplos EBITDA':
      // Apenas para Series B+ e Maduro com EBITDA positivo
      return ['Serie-B+', 'Maduro'].includes(estagio) && ebitda > 0;

    case 'DCF':
      // Não recomendado para Pre-seed, precisa de dados financeiros
      return estagio !== 'Pre-seed' && (arr > 0 || ebitda !== 0);

    case 'Berkus':
      // Ideal para early-stage
      return ['Pre-seed', 'Seed', 'Serie-A'].includes(estagio);

    case 'Scorecard':
      // Ideal para early-stage
      return ['Pre-seed', 'Seed', 'Serie-A'].includes(estagio);

    case 'Patrimônio Líquido':
      // Apenas para Maduro com dados de ativos/passivos
      return estagio === 'Maduro' &&
        (data.financeiro.ativos !== undefined && data.financeiro.ativos > 0);

    default:
      return false;
  }
}

/**
 * Calcula peso do método na média ponderada baseado no estágio
 */
export function getPesoMetodo(metodo: MetodoValuation, estagio: Estagio): number {
  const config = MULTIPLOS_ESTAGIO[estagio];

  // Métodos qualitativos
  if (['Berkus', 'Scorecard'].includes(metodo)) {
    return config.pesoQualitativo / 2; // Dividido entre os dois
  }

  // DCF
  if (metodo === 'DCF') {
    return config.pesoDCF;
  }

  // Múltiplos e Patrimônio dividem o resto
  const restante = 1 - config.pesoQualitativo - config.pesoDCF;
  return restante / 2;
}

/**
 * Calcula múltiplo ajustado baseado em crescimento, churn e estágio
 */
export function calcularMultiploAjustado(
  setor: Setor,
  estagio: Estagio,
  crescimento3y: number,
  churn: number
): number {
  const multiploSetor = MULTIPLOS_SETOR[setor];
  const multiploEstagio = MULTIPLOS_ESTAGIO[estagio];

  // Base: média entre setor e estágio
  let multiplo = (multiploSetor.avg + (multiploEstagio.arrMin + multiploEstagio.arrMax) / 2) / 2;

  // Se estágio não tem ARR múltiplo, usar só setor
  if (multiploEstagio.arrMin === 0) {
    multiplo = multiploSetor.avg;
  }

  // Ajuste por crescimento (cada 10% acima de 20% aumenta 0.5x)
  if (crescimento3y > 20) {
    multiplo += ((crescimento3y - 20) / 10) * 0.5;
  } else if (crescimento3y < 20) {
    multiplo -= ((20 - crescimento3y) / 10) * 0.3;
  }

  // Ajuste por churn (churn abaixo de 3% é excelente)
  if (churn < 3) {
    multiplo += 1;
  } else if (churn > 5) {
    multiplo -= (churn - 5) * 0.2;
  }

  // Limitar ao range combinado
  const min = Math.min(multiploSetor.min, multiploEstagio.arrMin || multiploSetor.min);
  const max = Math.max(multiploSetor.max, multiploEstagio.arrMax || multiploSetor.max);

  return Math.max(min, Math.min(max * 1.2, multiplo));
}

// ============================================
// MÉTODOS DE VALUATION
// ============================================

/**
 * Valuation por Múltiplos de ARR
 */
export function calcularMultiplosARR(data: ValuationFormData): ValuationResult {
  const { setor, estagio } = data.basic;
  const { arr } = data.financeiro;
  const { crescimento3y } = data.projecoes;
  const { churn } = data.financeiro;
  const { equipeScore } = data.ajustes;

  const aplicavel = isMetodoAplicavel('Múltiplos ARR', estagio, data);
  const peso = aplicavel ? getPesoMetodo('Múltiplos ARR', estagio) : 0;

  if (!aplicavel || arr <= 0) {
    return {
      metodo: 'Múltiplos ARR',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: estagio === 'Pre-seed' ? 'N/A para Pre-seed' : 'ARR insuficiente',
      assuncoes: ['Requer ARR > 0'],
      aplicavel: false,
      peso: 0,
    };
  }

  const multiplo = calcularMultiploAjustado(setor, estagio, crescimento3y, churn);
  const fatorEquipe = 0.7 + (equipeScore / 100) * 0.6;
  const valorBRL = arr * multiplo * fatorEquipe;
  const valorUSD = valorBRL / USD_BRL;

  let confianca: 'Alta' | 'Média' | 'Baixa' = 'Média';
  if (arr > 1000000 && crescimento3y > 30) confianca = 'Alta';
  else if (arr < 500000) confianca = 'Baixa';

  return {
    metodo: 'Múltiplos ARR',
    valorBRL,
    valorUSD,
    confianca,
    detalhes: `Múltiplo: ${multiplo.toFixed(1)}x | Ajuste equipe: ${fatorEquipe.toFixed(2)}`,
    assuncoes: [
      `ARR: R$ ${arr.toLocaleString('pt-BR')}`,
      `Múltiplo ajustado por crescimento (${crescimento3y}%) e churn (${churn}%)`,
      `Fator equipe: ${(equipeScore)}%`,
    ],
    aplicavel,
    peso,
  };
}

/**
 * Valuation por Múltiplos de EBITDA
 */
export function calcularMultiplosEBITDA(data: ValuationFormData): ValuationResult {
  const { setor, estagio } = data.basic;
  const { ebitda } = data.financeiro;

  const aplicavel = isMetodoAplicavel('Múltiplos EBITDA', estagio, data);
  const peso = aplicavel ? getPesoMetodo('Múltiplos EBITDA', estagio) : 0;

  if (!aplicavel || ebitda <= 0) {
    return {
      metodo: 'Múltiplos EBITDA',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: ebitda <= 0 ? 'EBITDA negativo/zero' : 'N/A para este estágio',
      assuncoes: ['Requer EBITDA positivo', 'Recomendado para Series B+ e Maduro'],
      aplicavel: false,
      peso: 0,
    };
  }

  const multiplosSetor = MULTIPLOS_SETOR[setor];
  const multiplosEstagio = MULTIPLOS_ESTAGIO[estagio];

  const multiplo = multiplosEstagio.ebitdaMin && multiplosEstagio.ebitdaMax
    ? (multiplosEstagio.ebitdaMin + multiplosEstagio.ebitdaMax) / 2
    : (multiplosSetor.ebitdaMin! + multiplosSetor.ebitdaMax!) / 2;

  const valorBRL = ebitda * multiplo;
  const valorUSD = valorBRL / USD_BRL;

  return {
    metodo: 'Múltiplos EBITDA',
    valorBRL,
    valorUSD,
    confianca: 'Alta',
    detalhes: `Múltiplo EBITDA: ${multiplo.toFixed(1)}x`,
    assuncoes: [
      `EBITDA: R$ ${ebitda.toLocaleString('pt-BR')}`,
      `Múltiplo médio do setor ${setor}`,
      `Estágio: ${estagio}`,
    ],
    aplicavel,
    peso,
  };
}

/**
 * DCF Simplificado (Discounted Cash Flow)
 */
export function calcularDCF(data: ValuationFormData): ValuationResult {
  const { estagio } = data.basic;
  const { ebitda, arr } = data.financeiro;
  const { crescimento3y, wacc, perpetuo } = data.projecoes;
  const { capexPct } = data.ajustes;

  const aplicavel = isMetodoAplicavel('DCF', estagio, data);
  const peso = aplicavel ? getPesoMetodo('DCF', estagio) : 0;

  if (!aplicavel) {
    return {
      metodo: 'DCF',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'N/A para Pre-seed (dados insuficientes)',
      assuncoes: ['Requer projeções financeiras'],
      aplicavel: false,
      peso: 0,
    };
  }

  const aliquotaIR = 0.34;
  const fcf1 = ebitda * (1 - aliquotaIR) - (arr * capexPct / 100);
  const fcfBase = fcf1 > 0 ? fcf1 : Math.max(ebitda * 0.1, arr * 0.05);

  const taxaCrescimento = crescimento3y / 100;
  const fcf2 = fcfBase * (1 + taxaCrescimento);
  const fcf3 = fcf2 * (1 + taxaCrescimento);
  const fcf4 = fcf3 * (1 + taxaCrescimento * 0.7);

  const waccDecimal = wacc / 100;
  const perpetuoDecimal = perpetuo / 100;
  const denominador = waccDecimal - perpetuoDecimal;

  if (denominador <= 0.01) {
    return {
      metodo: 'DCF',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'WACC deve ser > taxa perpétua',
      assuncoes: ['Erro: WACC ≤ taxa perpétua'],
      aplicavel: false,
      peso: 0,
    };
  }

  const valorTerminal = fcf4 * (1 + perpetuoDecimal) / denominador;
  const pv1 = fcfBase / Math.pow(1 + waccDecimal, 1);
  const pv2 = fcf2 / Math.pow(1 + waccDecimal, 2);
  const pv3 = fcf3 / Math.pow(1 + waccDecimal, 3);
  const pvTerminal = valorTerminal / Math.pow(1 + waccDecimal, 3);

  const valorBRL = Math.max(0, pv1 + pv2 + pv3 + pvTerminal);
  const valorUSD = valorBRL / USD_BRL;

  return {
    metodo: 'DCF',
    valorBRL,
    valorUSD,
    confianca: fcf1 > 0 ? 'Média' : 'Baixa',
    detalhes: `WACC: ${wacc}% | Perpétuo: ${perpetuo}% | TV: R$ ${(valorTerminal/1e6).toFixed(1)}M`,
    assuncoes: [
      `FCF Ano 1: R$ ${fcfBase.toLocaleString('pt-BR')}`,
      `Crescimento projetado: ${crescimento3y}% a.a.`,
      `WACC: ${wacc}% (${estagio})`,
      `Taxa perpétua: ${perpetuo}%`,
      `IR: 34%`,
    ],
    aplicavel,
    peso,
  };
}

/**
 * Método Berkus (para early-stage)
 * 5 fatores, max USD 500k cada = USD 2.5M total
 */
export function calcularBerkus(data: ValuationFormData): ValuationResult {
  const { estagio } = data.basic;
  const { berkus } = data;

  const aplicavel = isMetodoAplicavel('Berkus', estagio, data);
  const peso = aplicavel ? getPesoMetodo('Berkus', estagio) : 0;

  if (!aplicavel) {
    return {
      metodo: 'Berkus',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'N/A para estágios avançados',
      assuncoes: ['Método para Pre-seed, Seed e Série A'],
      aplicavel: false,
      peso: 0,
    };
  }

  // Soma dos fatores Berkus (já em USD)
  const valorUSD = Math.min(
    berkus.equipe + berkus.produto + berkus.mercado + berkus.tracao + berkus.ip,
    BERKUS_MAX_POR_FATOR * 5 // Max 2.5M
  );
  const valorBRL = valorUSD * USD_BRL;

  // Confiança baseada no estágio
  let confianca: 'Alta' | 'Média' | 'Baixa' = 'Média';
  if (estagio === 'Pre-seed' || estagio === 'Seed') confianca = 'Alta';
  else if (estagio === 'Serie-A') confianca = 'Média';

  return {
    metodo: 'Berkus',
    valorBRL,
    valorUSD,
    confianca,
    detalhes: `Equipe: $${(berkus.equipe/1000).toFixed(0)}k | Produto: $${(berkus.produto/1000).toFixed(0)}k | Mercado: $${(berkus.mercado/1000).toFixed(0)}k`,
    assuncoes: [
      `Equipe: $${berkus.equipe.toLocaleString('en-US')}`,
      `Produto/Protótipo: $${berkus.produto.toLocaleString('en-US')}`,
      `Tamanho Mercado: $${berkus.mercado.toLocaleString('en-US')}`,
      `Tração: $${berkus.tracao.toLocaleString('en-US')}`,
      `IP/Barreiras: $${berkus.ip.toLocaleString('en-US')}`,
      `Max por fator: $500k | Max total: $2.5M`,
    ],
    aplicavel,
    peso,
  };
}

/**
 * Método Scorecard (comparativo ao setor)
 */
export function calcularScorecard(data: ValuationFormData): ValuationResult {
  const { setor, estagio } = data.basic;
  const { scorecard, rodada } = data;

  const aplicavel = isMetodoAplicavel('Scorecard', estagio, data);
  const peso = aplicavel ? getPesoMetodo('Scorecard', estagio) : 0;

  if (!aplicavel) {
    return {
      metodo: 'Scorecard',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'N/A para estágios avançados',
      assuncoes: ['Método para Pre-seed, Seed e Série A'],
      aplicavel: false,
      peso: 0,
    };
  }

  // Média do setor como base
  const mediaSetorUSD = SCORECARD_MEDIA_SETOR[setor];

  // Pesos para cada fator do Scorecard
  const pesos = {
    equipe: 0.30,
    tamanhoMercado: 0.25,
    produto: 0.15,
    competicao: 0.10,
    marketing: 0.10,
    investimento: 0.05,
    outros: 0.05,
  };

  // Calcular fator de ajuste total
  const fatorAjuste = 1 + (
    (scorecard.equipeAjuste / 100) * pesos.equipe +
    (scorecard.tamanhoMercadoAjuste / 100) * pesos.tamanhoMercado +
    (scorecard.produtoAjuste / 100) * pesos.produto +
    (scorecard.competicaoAjuste / 100) * pesos.competicao +
    (scorecard.marketingAjuste / 100) * pesos.marketing +
    (scorecard.investimentoAjuste / 100) * pesos.investimento +
    (scorecard.outrosAjuste / 100) * pesos.outros
  );

  // Se tem pre-money estimado, usar como base
  const baseValor = rodada.preMoneyEstimado > 0
    ? rodada.preMoneyEstimado / USD_BRL
    : mediaSetorUSD;

  const valorUSD = baseValor * fatorAjuste;
  const valorBRL = valorUSD * USD_BRL;

  // Confiança
  let confianca: 'Alta' | 'Média' | 'Baixa' = 'Média';
  if (estagio === 'Pre-seed' || estagio === 'Seed') confianca = 'Alta';

  return {
    metodo: 'Scorecard',
    valorBRL,
    valorUSD,
    confianca,
    detalhes: `Fator ajuste: ${(fatorAjuste * 100).toFixed(0)}% | Base: $${(baseValor/1e6).toFixed(2)}M`,
    assuncoes: [
      `Média do setor ${setor}: $${(mediaSetorUSD/1e6).toFixed(2)}M`,
      `Ajuste Equipe: ${scorecard.equipeAjuste > 0 ? '+' : ''}${scorecard.equipeAjuste}%`,
      `Ajuste Mercado: ${scorecard.tamanhoMercadoAjuste > 0 ? '+' : ''}${scorecard.tamanhoMercadoAjuste}%`,
      `Ajuste Produto: ${scorecard.produtoAjuste > 0 ? '+' : ''}${scorecard.produtoAjuste}%`,
      `Fator total: ${(fatorAjuste).toFixed(2)}x`,
    ],
    aplicavel,
    peso,
  };
}

/**
 * Método Patrimônio Líquido (para empresas maduras)
 */
export function calcularPatrimonio(data: ValuationFormData): ValuationResult {
  const { estagio } = data.basic;
  const { ativos, passivos } = data.financeiro;

  const aplicavel = isMetodoAplicavel('Patrimônio Líquido', estagio, data);
  const peso = aplicavel ? getPesoMetodo('Patrimônio Líquido', estagio) : 0;

  if (!aplicavel || !ativos || ativos <= 0) {
    return {
      metodo: 'Patrimônio Líquido',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'N/A (requer dados de ativos/passivos)',
      assuncoes: ['Método para empresas maduras com balanço'],
      aplicavel: false,
      peso: 0,
    };
  }

  const patrimonioLiquido = ativos - (passivos || 0);
  const valorBRL = Math.max(0, patrimonioLiquido);
  const valorUSD = valorBRL / USD_BRL;

  return {
    metodo: 'Patrimônio Líquido',
    valorBRL,
    valorUSD,
    confianca: 'Alta',
    detalhes: `Ativos - Passivos = R$ ${valorBRL.toLocaleString('pt-BR')}`,
    assuncoes: [
      `Ativos: R$ ${ativos.toLocaleString('pt-BR')}`,
      `Passivos: R$ ${(passivos || 0).toLocaleString('pt-BR')}`,
      `Patrimônio Líquido contábil`,
    ],
    aplicavel,
    peso,
  };
}

// ============================================
// CÁLCULO COMPLETO
// ============================================

/**
 * Calcula todos os métodos aplicáveis e retorna análise completa
 */
export function calcularValuationCompleto(data: ValuationFormData): {
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  valorPonderado: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  postMoney: number;
} {
  const { estagio } = data.basic;

  // Calcular todos os métodos
  const results: ValuationResult[] = [
    calcularMultiplosARR(data),
    calcularMultiplosEBITDA(data),
    calcularDCF(data),
    calcularBerkus(data),
    calcularScorecard(data),
    calcularPatrimonio(data),
  ];

  // Filtrar resultados aplicáveis com valor > 0
  const resultadosValidos = results.filter(r => r.aplicavel && r.valorBRL > 0);
  const valores = resultadosValidos.map(r => r.valorBRL);

  if (valores.length === 0) {
    return {
      results,
      valorMedio: 0,
      valorMediano: 0,
      valorPonderado: 0,
      range: { min: 0, max: 0 },
      metodologiaRecomendada: 'Dados insuficientes',
      postMoney: data.rodada.investimento,
    };
  }

  // Média simples
  const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length;

  // Mediana
  const sorted = [...valores].sort((a, b) => a - b);
  const valorMediano = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // Média ponderada por estágio
  let somaPesos = 0;
  let somaValoresPonderados = 0;

  for (const resultado of resultadosValidos) {
    somaPesos += resultado.peso;
    somaValoresPonderados += resultado.valorBRL * resultado.peso;
  }

  const valorPonderado = somaPesos > 0 ? somaValoresPonderados / somaPesos : valorMedio;

  // Range
  const range = {
    min: Math.min(...valores),
    max: Math.max(...valores),
  };

  // Post-money
  const postMoney = valorPonderado + data.rodada.investimento;

  // Metodologia recomendada
  const config = MULTIPLOS_ESTAGIO[estagio];
  const metodosRecomendados = config.metodosPreferidos
    .filter(m => results.find(r => r.metodo === m && r.aplicavel))
    .slice(0, 2)
    .join(' + ');

  return {
    results,
    valorMedio,
    valorMediano,
    valorPonderado,
    range,
    metodologiaRecomendada: metodosRecomendados || 'Análise qualitativa',
    postMoney,
  };
}

// ============================================
// FORMATADORES
// ============================================

export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatarUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatarNumeroGrande(valor: number): string {
  if (valor >= 1e9) return `R$ ${(valor / 1e9).toFixed(2)}B`;
  if (valor >= 1e6) return `R$ ${(valor / 1e6).toFixed(2)}M`;
  if (valor >= 1e3) return `R$ ${(valor / 1e3).toFixed(0)}K`;
  return formatarBRL(valor);
}

export function formatarUSDGrande(valor: number): string {
  if (valor >= 1e9) return `$${(valor / 1e9).toFixed(2)}B`;
  if (valor >= 1e6) return `$${(valor / 1e6).toFixed(2)}M`;
  if (valor >= 1e3) return `$${(valor / 1e3).toFixed(0)}K`;
  return formatarUSD(valor);
}
