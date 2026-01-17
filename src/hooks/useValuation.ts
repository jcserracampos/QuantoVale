// Hook principal para cálculos de valuation
// Suporte completo a rodadas, métodos qualitativos e ponderação

import { useState, useEffect, useCallback } from 'react';
import type {
  ValuationFormData,
  ValuationResult,
  AuthState,
  Estagio,
  PocketBaseValuation,
} from '@/types/valuation';
import {
  calcularValuationCompleto,
  getWACCPadrao,
  MULTIPLOS_ESTAGIO,
} from '@/utils/formulas';
import {
  getAuthState,
  login,
  register,
  logout,
  salvarValuation,
  listarValuations,
  exportarJSON,
  exportarCSV,
  downloadFile,
} from '@/utils/pocketbase';

// Valores padrão realistas para SaaS BR (estágio Seed)
const DEFAULTS: ValuationFormData = {
  basic: {
    name: '',
    setor: 'SaaS/Tech',
    estagio: 'Seed',
  },
  financeiro: {
    mrr: 50000,      // R$ 50k MRR
    arr: 600000,     // Computed: mrr * 12
    receitaTTM: 600000,
    ebitda: 0,       // Early-stage geralmente sem EBITDA
    churn: 4,        // 4% mensal (típico Seed)
    clientes: 80,
    ativos: 0,
    passivos: 0,
  },
  projecoes: {
    crescimento3y: 60, // 60% ao ano (agressivo Seed)
    wacc: 25,          // WACC Seed padrão
    perpetuo: 3,
  },
  ajustes: {
    capexPct: 5,
    ltvCac: 2.5,       // LTV/CAC típico early-stage
    equipeScore: 70,
  },
  rodada: {
    preMoneyEstimado: 0,
    investimento: 0,
    postMoney: 0,
  },
  berkus: {
    equipe: 300000,    // $300k - equipe boa
    produto: 250000,   // $250k - MVP funcional
    mercado: 350000,   // $350k - mercado grande
    tracao: 250000,    // $250k - alguma tração
    ip: 100000,        // $100k - pouca IP
  },
  scorecard: {
    equipeAjuste: 10,         // +10% vs média
    tamanhoMercadoAjuste: 15, // +15%
    produtoAjuste: 5,         // +5%
    competicaoAjuste: 0,      // neutro
    marketingAjuste: -5,      // -5%
    investimentoAjuste: 0,
    outrosAjuste: 0,
  },
};

interface UseValuationReturn {
  // Estado do form
  formData: ValuationFormData;
  updateFormData: (updates: Partial<ValuationFormData>) => void;
  updateSection: <K extends keyof ValuationFormData>(
    section: K,
    updates: Partial<ValuationFormData[K]>
  ) => void;
  resetForm: () => void;
  setEstagio: (estagio: Estagio) => void;

  // Resultados
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  valorPonderado: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  postMoney: number;
  isCalculating: boolean;

  // Helpers
  isEarlyStage: boolean;
  isLateStage: boolean;

  // Auth
  authState: AuthState;
  handleLogin: (email: string, password: string) => Promise<void>;
  handleRegister: (email: string, password: string, name?: string) => Promise<void>;
  handleLogout: () => void;

  // Ações
  handleSave: () => Promise<void>;
  handleExportJSON: () => void;
  handleExportCSV: () => void;
  isSaving: boolean;
  saveError: string | null;

  // Histórico de análises salvas
  savedValuations: PocketBaseValuation[];
  isLoadingSaved: boolean;
  handleLoadSaved: () => Promise<void>;
  handleLoadValuation: (valuation: PocketBaseValuation) => void;
}

export function useValuation(): UseValuationReturn {
  // Estado do formulário
  const [formData, setFormData] = useState<ValuationFormData>(DEFAULTS);

  // Estado dos resultados
  const [results, setResults] = useState<ValuationResult[]>([]);
  const [valorMedio, setValorMedio] = useState(0);
  const [valorMediano, setValorMediano] = useState(0);
  const [valorPonderado, setValorPonderado] = useState(0);
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [metodologiaRecomendada, setMetodologiaRecomendada] = useState('');
  const [postMoney, setPostMoney] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Estado de autenticação
  const [authState, setAuthState] = useState<AuthState>(getAuthState());

  // Estado de salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Estado de histórico salvo
  const [savedValuations, setSavedValuations] = useState<PocketBaseValuation[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Helpers para estágio
  const isEarlyStage = ['Pre-seed', 'Seed', 'Serie-A'].includes(formData.basic.estagio);
  const isLateStage = ['Serie-B+', 'Maduro'].includes(formData.basic.estagio);

  // Atualiza ARR automaticamente quando MRR muda
  useEffect(() => {
    const newArr = formData.financeiro.mrr * 12;
    if (formData.financeiro.arr !== newArr) {
      setFormData(prev => ({
        ...prev,
        financeiro: {
          ...prev.financeiro,
          arr: newArr,
        },
      }));
    }
  }, [formData.financeiro.mrr]);

  // Atualiza Post-Money quando Pre-Money ou Investimento mudam
  useEffect(() => {
    const newPostMoney = formData.rodada.preMoneyEstimado + formData.rodada.investimento;
    if (formData.rodada.postMoney !== newPostMoney) {
      setFormData(prev => ({
        ...prev,
        rodada: {
          ...prev.rodada,
          postMoney: newPostMoney,
        },
      }));
    }
  }, [formData.rodada.preMoneyEstimado, formData.rodada.investimento]);

  // Atualiza WACC padrão quando estágio muda
  useEffect(() => {
    const waccPadrao = getWACCPadrao(formData.basic.estagio, formData.basic.setor);
    // Só atualiza se WACC atual for o padrão do estágio anterior
    // para não sobrescrever valores customizados
    const estagioAnterior = MULTIPLOS_ESTAGIO[formData.basic.estagio];
    if (estagioAnterior && formData.projecoes.wacc !== waccPadrao) {
      // Verifica se está usando um valor padrão de algum estágio
      const valoresPadrao = Object.values(MULTIPLOS_ESTAGIO).map(e => e.waccDefault);
      if (valoresPadrao.includes(formData.projecoes.wacc)) {
        setFormData(prev => ({
          ...prev,
          projecoes: {
            ...prev.projecoes,
            wacc: waccPadrao,
          },
        }));
      }
    }
  }, [formData.basic.estagio, formData.basic.setor]);

  // Calcular valuation quando dados mudam
  useEffect(() => {
    setIsCalculating(true);

    // Debounce para evitar recálculos excessivos
    const timer = setTimeout(() => {
      const analysis = calcularValuationCompleto(formData);
      setResults(analysis.results);
      setValorMedio(analysis.valorMedio);
      setValorMediano(analysis.valorMediano);
      setValorPonderado(analysis.valorPonderado);
      setRange(analysis.range);
      setMetodologiaRecomendada(analysis.metodologiaRecomendada);
      setPostMoney(analysis.postMoney);
      setIsCalculating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData]);

  // Atualizar todo o formData
  const updateFormData = useCallback((updates: Partial<ValuationFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Atualizar seção específica do form
  const updateSection = useCallback(<K extends keyof ValuationFormData>(
    section: K,
    updates: Partial<ValuationFormData[K]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
  }, []);

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData(DEFAULTS);
  }, []);

  // Mudar estágio (com ajustes automáticos)
  const setEstagio = useCallback((estagio: Estagio) => {
    setFormData(prev => {
      const config = MULTIPLOS_ESTAGIO[estagio];
      return {
        ...prev,
        basic: {
          ...prev.basic,
          estagio,
        },
        projecoes: {
          ...prev.projecoes,
          wacc: config.waccDefault,
        },
      };
    });
  }, []);

  // Auth handlers
  const handleLogin = useCallback(async (email: string, password: string) => {
    const newAuthState = await login(email, password);
    setAuthState(newAuthState);
  }, []);

  const handleRegister = useCallback(async (
    email: string,
    password: string,
    name?: string
  ) => {
    const newAuthState = await register(email, password, name);
    setAuthState(newAuthState);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setAuthState(getAuthState());
  }, []);

  // Salvar análise
  const handleSave = useCallback(async () => {
    if (!authState.isAuthenticated) {
      setSaveError('Faça login para salvar a análise');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await salvarValuation(formData, results);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  }, [authState, formData, results]);

  // Exportar JSON
  const handleExportJSON = useCallback(() => {
    const json = exportarJSON(formData, results);
    const filename = `valuation-${formData.basic.name || 'analise'}-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(json, filename, 'application/json');
  }, [formData, results]);

  // Exportar CSV
  const handleExportCSV = useCallback(() => {
    const csv = exportarCSV(results);
    const filename = `valuation-${formData.basic.name || 'analise'}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename, 'text/csv');
  }, [formData.basic.name, results]);

  // Carregar histórico de valuations salvas
  const handleLoadSaved = useCallback(async () => {
    if (!authState.isAuthenticated) {
      setSavedValuations([]);
      return;
    }

    setIsLoadingSaved(true);
    try {
      const valuations = await listarValuations();
      setSavedValuations(valuations);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setSavedValuations([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [authState.isAuthenticated]);

  // Carregar uma valuation específica no formulário
  const handleLoadValuation = useCallback((valuation: PocketBaseValuation) => {
    try {
      const inputs = typeof valuation.inputs === 'string'
        ? JSON.parse(valuation.inputs) as ValuationFormData
        : valuation.inputs as unknown as ValuationFormData;
      setFormData(inputs);
    } catch (error) {
      console.error('Erro ao carregar valuation:', error);
    }
  }, []);

  // Carregar histórico quando usuário loga
  useEffect(() => {
    if (authState.isAuthenticated) {
      handleLoadSaved();
    } else {
      setSavedValuations([]);
    }
  }, [authState.isAuthenticated, handleLoadSaved]);

  return {
    formData,
    updateFormData,
    updateSection,
    resetForm,
    setEstagio,
    results,
    valorMedio,
    valorMediano,
    valorPonderado,
    range,
    metodologiaRecomendada,
    postMoney,
    isCalculating,
    isEarlyStage,
    isLateStage,
    authState,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSave,
    handleExportJSON,
    handleExportCSV,
    isSaving,
    saveError,
    savedValuations,
    isLoadingSaved,
    handleLoadSaved,
    handleLoadValuation,
  };
}

// Hook para gerenciar seções colapsáveis
export function useAccordion(initialOpen: string[] = []) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(initialOpen));

  const toggle = useCallback((section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const isOpen = useCallback((section: string) => openSections.has(section), [openSections]);

  const openAll = useCallback(() => {
    setOpenSections(new Set(['basic', 'financeiro', 'projecoes', 'ajustes', 'rodada', 'berkus', 'scorecard']));
  }, []);

  const closeAll = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  return { isOpen, toggle, openAll, closeAll };
}

// Hook para dark mode
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);

  return { isDark, toggle };
}
