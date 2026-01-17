// Tipos para Calculadora de Valuation SaaS/Startups BR
// Suporte completo a rodadas e múltiplos métodos

// Setores disponíveis com múltiplos de mercado BR 2026
export type Setor =
  | 'SaaS/Tech'
  | 'Fintech'
  | 'E-commerce'
  | 'Marketplace'
  | 'EdTech'
  | 'HealthTech'
  | 'LogTech'
  | 'AgTech'
  | 'Outro';

// Estágios de maturidade expandidos por rodada
export type Estagio =
  | 'Pre-seed'
  | 'Seed'
  | 'Serie-A'
  | 'Serie-B+'
  | 'Maduro';

// Métodos de valuation disponíveis
export type MetodoValuation =
  | 'Múltiplos ARR'
  | 'Múltiplos EBITDA'
  | 'DCF'
  | 'Berkus'
  | 'Scorecard'
  | 'Patrimônio Líquido';

// Estrutura do formulário expandida
export interface ValuationFormData {
  basic: {
    name?: string;
    setor: Setor;
    estagio: Estagio;
  };
  financeiro: {
    mrr: number;           // Monthly Recurring Revenue (R$)
    arr: number;           // Annual Recurring Revenue (computed: mrr * 12)
    receitaTTM: number;    // Receita últimos 12 meses
    ebitda: number;        // EBITDA anual
    churn: number;         // Churn mensal (%)
    clientes: number;      // Número de clientes ativos
    // Novos campos para Patrimônio
    ativos?: number;       // Total de ativos
    passivos?: number;     // Total de passivos
  };
  projecoes: {
    crescimento3y: number; // Taxa crescimento anual 3 anos (%)
    wacc: number;          // Weighted Average Cost of Capital (%)
    perpetuo: number;      // Taxa de crescimento perpétuo (%)
  };
  ajustes: {
    capexPct: number;      // CapEx como % da receita
    ltvCac: number;        // Ratio LTV/CAC
    equipeScore: number;   // Score da equipe (0-100) - legado
  };
  // Nova seção: Rodada atual
  rodada: {
    preMoneyEstimado: number;  // Pre-money valuation estimado
    investimento: number;      // Valor do investimento na rodada
    postMoney: number;         // Calculado: preMoneyEstimado + investimento
  };
  // Nova seção: Qualitativos Berkus (max 500k USD cada = 2.5M total)
  berkus: {
    equipe: number;        // 0-500000 USD
    produto: number;       // 0-500000 USD
    mercado: number;       // 0-500000 USD
    tracao: number;        // 0-500000 USD
    ip: number;            // 0-500000 USD (Propriedade Intelectual)
  };
  // Nova seção: Scorecard (% ajuste vs média do setor)
  scorecard: {
    equipeAjuste: number;       // -50% a +50%
    tamanhoMercadoAjuste: number;
    produtoAjuste: number;
    competicaoAjuste: number;
    marketingAjuste: number;
    investimentoAjuste: number;
    outrosAjuste: number;
  };
}

// Múltiplos por setor (dados BR 2026)
export interface MultiploSetor {
  min: number;
  max: number;
  avg: number;
  ebitdaMin?: number;
  ebitdaMax?: number;
}

// Múltiplos por estágio/rodada
export interface MultiploEstagio {
  arrMin: number;
  arrMax: number;
  ebitdaMin?: number;
  ebitdaMax?: number;
  waccDefault: number;
  metodosPreferidos: MetodoValuation[];
  pesoQualitativo: number;  // 0-1, peso para métodos qualitativos
  pesoDCF: number;          // 0-1, peso para DCF
}

// Resultado de cada método de valuation
export interface ValuationResult {
  metodo: MetodoValuation;
  valorBRL: number;
  valorUSD: number;
  confianca: 'Alta' | 'Média' | 'Baixa';
  detalhes?: string;
  assuncoes?: string[];     // Lista de premissas usadas
  aplicavel: boolean;       // Se o método é aplicável ao estágio
  peso: number;             // Peso na média ponderada
}

// Resultado completo da análise
export interface ValuationAnalysis {
  id?: string;
  userId?: string;
  inputs: ValuationFormData;
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  valorPonderado: number;   // Média ponderada por estágio
  range: {
    min: number;
    max: number;
  };
  createdAt?: Date;
  metodologiaRecomendada: string;
  estagio: Estagio;
}

// Estrutura para salvar no PocketBase
export interface PocketBaseValuation {
  id?: string;
  userId: string;
  inputs: string;    // JSON stringified
  results: string;   // JSON stringified
  estagio: Estagio;
  valorPonderado: number;
  created?: string;
  updated?: string;
}

// Estado de autenticação
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  token?: string;
}

// Props para componentes
export interface AccordionSectionProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// Dados para gráfico
export interface ChartData {
  metodo: string;
  valor: number;
  fill: string;
  aplicavel: boolean;
}

// Dados para PDF
export interface PDFReportData {
  companyName: string;
  setor: Setor;
  estagio: Estagio;
  dataGeracao: Date;
  inputs: ValuationFormData;
  results: ValuationResult[];
  valorPonderado: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
}

// Constantes de taxa de câmbio (atualizar periodicamente)
export const EXCHANGE_RATE_USD_BRL = 5.15; // Taxa média 2026

// Constantes Berkus (max por fator em USD)
export const BERKUS_MAX_POR_FATOR = 500000;
export const BERKUS_MAX_TOTAL = 2500000;

// Média de mercado para Scorecard (referência setor)
export const SCORECARD_MEDIA_SETOR: Record<Setor, number> = {
  'SaaS/Tech': 2500000,
  'Fintech': 3000000,
  'E-commerce': 1500000,
  'Marketplace': 2000000,
  'EdTech': 1800000,
  'HealthTech': 2200000,
  'LogTech': 1600000,
  'AgTech': 1400000,
  'Outro': 1500000,
};
