// Hook principal para cálculos de valuation
// Gerencia estado do formulário e resultados em tempo real

import { useState, useEffect, useCallback } from 'react';
import type {
  ValuationFormData,
  ValuationResult,
  AuthState,
} from '@/types/valuation';
import {
  calcularValuationCompleto,
  WACC_PADRAO,
} from '@/utils/formulas';
import {
  getAuthState,
  login,
  register,
  logout,
  salvarValuation,
  exportarJSON,
  exportarCSV,
  downloadFile,
} from '@/utils/pocketbase';

// Valores padrão realistas para SaaS BR
const DEFAULTS: ValuationFormData = {
  basic: {
    name: '',
    setor: 'SaaS/Tech',
    estagio: 'Growth',
  },
  financeiro: {
    mrr: 50000,      // R$ 50k MRR
    arr: 600000,     // Computed: mrr * 12
    receitaTTM: 600000,
    ebitda: 120000,  // 20% margem
    churn: 3,        // 3% mensal
    clientes: 150,
  },
  projecoes: {
    crescimento3y: 40, // 40% ao ano
    wacc: 18,          // WACC padrão SaaS BR
    perpetuo: 3,       // 3% perpétuo
  },
  ajustes: {
    capexPct: 5,       // 5% da receita
    ltvCac: 3,         // LTV/CAC de 3x
    equipeScore: 70,   // Score médio-alto
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

  // Resultados
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  isCalculating: boolean;

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
}

export function useValuation(): UseValuationReturn {
  // Estado do formulário
  const [formData, setFormData] = useState<ValuationFormData>(DEFAULTS);

  // Estado dos resultados
  const [results, setResults] = useState<ValuationResult[]>([]);
  const [valorMedio, setValorMedio] = useState(0);
  const [valorMediano, setValorMediano] = useState(0);
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [metodologiaRecomendada, setMetodologiaRecomendada] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Estado de autenticação
  const [authState, setAuthState] = useState<AuthState>(getAuthState());

  // Estado de salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  // Atualiza WACC padrão quando setor muda
  useEffect(() => {
    const waccPadrao = WACC_PADRAO[formData.basic.setor];
    if (waccPadrao && formData.projecoes.wacc !== waccPadrao) {
      setFormData(prev => ({
        ...prev,
        projecoes: {
          ...prev.projecoes,
          wacc: waccPadrao,
        },
      }));
    }
  }, [formData.basic.setor]);

  // Calcular valuation quando dados mudam
  useEffect(() => {
    setIsCalculating(true);

    // Debounce para evitar recálculos excessivos
    const timer = setTimeout(() => {
      const analysis = calcularValuationCompleto(formData);
      setResults(analysis.results);
      setValorMedio(analysis.valorMedio);
      setValorMediano(analysis.valorMediano);
      setRange(analysis.range);
      setMetodologiaRecomendada(analysis.metodologiaRecomendada);
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

  return {
    formData,
    updateFormData,
    updateSection,
    resetForm,
    results,
    valorMedio,
    valorMediano,
    range,
    metodologiaRecomendada,
    isCalculating,
    authState,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSave,
    handleExportJSON,
    handleExportCSV,
    isSaving,
    saveError,
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
    setOpenSections(new Set(['basic', 'financeiro', 'projecoes', 'ajustes']));
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
