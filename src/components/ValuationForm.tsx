// Formulário de Valuation com seções colapsáveis
// Usa react-hook-form + zod para validação

// Imports para futura integração com react-hook-form + zod
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
import {
  ChevronDown,
  ChevronUp,
  Building2,
  DollarSign,
  TrendingUp,
  Sliders,
  Info,
} from 'lucide-react';
import type { ValuationFormData, Setor, Estagio } from '@/types/valuation';
import { useAccordion } from '@/hooks/useValuation';
import { MULTIPLOS_SETOR, WACC_PADRAO } from '@/utils/formulas';

// Opções de setores
const SETORES: Setor[] = [
  'SaaS/Tech',
  'Fintech',
  'E-commerce',
  'Marketplace',
  'EdTech',
  'HealthTech',
  'LogTech',
  'AgTech',
  'Outro',
];

// Opções de estágios
const ESTAGIOS: Estagio[] = [
  'Pre-seed',
  'Seed',
  'Early-stage',
  'Growth',
  'Scale-up',
  'Late-stage',
];

interface Props {
  formData: ValuationFormData;
  updateSection: <K extends keyof ValuationFormData>(
    section: K,
    updates: Partial<ValuationFormData[K]>
  ) => void;
  resetForm: () => void;
}

// Componente de seção colapsável
function AccordionSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  description,
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div className="text-left">
            <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}

// Input com label
function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'number',
  placeholder,
  helpText,
  prefix,
  suffix,
  min,
  max,
  step,
  disabled,
}: {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  helpText?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
          }
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-12' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {helpText}
        </p>
      )}
    </div>
  );
}

// Select com label
function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  helpText,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helpText?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

// Slider com label
function FormSlider({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  helpText,
  showValue = true,
  suffix = '',
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  helpText?: string;
  showValue?: boolean;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        {showValue && (
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {value}{suffix}
          </span>
        )}
      </div>
      <input
        id={name}
        name={name}
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

export function ValuationForm({ formData, updateSection, resetForm }: Props) {
  const { isOpen, toggle } = useAccordion(['basic', 'financeiro']);

  // Info do múltiplo atual
  const multiploInfo = MULTIPLOS_SETOR[formData.basic.setor as Setor];
  const waccPadrao = WACC_PADRAO[formData.basic.setor as Setor];

  return (
    <form className="space-y-4">
      {/* Seção Básica */}
      <AccordionSection
        title="Informações Básicas"
        icon={Building2}
        isOpen={isOpen('basic')}
        onToggle={() => toggle('basic')}
        description="Identificação e categoria da empresa"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Nome da Empresa"
            name="name"
            type="text"
            value={formData.basic.name || ''}
            onChange={(v) => updateSection('basic', { name: v as string })}
            placeholder="Ex: Minha Startup"
          />
          <FormSelect
            label="Setor"
            name="setor"
            value={formData.basic.setor}
            onChange={(v) => updateSection('basic', { setor: v as Setor })}
            options={SETORES.map((s) => ({ value: s, label: s }))}
            helpText={`Múltiplo: ${multiploInfo.min}-${multiploInfo.max}x ARR`}
          />
          <FormSelect
            label="Estágio"
            name="estagio"
            value={formData.basic.estagio}
            onChange={(v) => updateSection('basic', { estagio: v as Estagio })}
            options={ESTAGIOS.map((e) => ({ value: e, label: e }))}
          />
        </div>
      </AccordionSection>

      {/* Seção Financeira */}
      <AccordionSection
        title="Dados Financeiros"
        icon={DollarSign}
        isOpen={isOpen('financeiro')}
        onToggle={() => toggle('financeiro')}
        description="Receitas, EBITDA e métricas"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput
            label="MRR (Receita Mensal Recorrente)"
            name="mrr"
            value={formData.financeiro.mrr}
            onChange={(v) => updateSection('financeiro', { mrr: v as number })}
            prefix="R$"
            helpText="Receita recorrente mensal"
            min={0}
            step={1000}
          />
          <FormInput
            label="ARR (Receita Anual Recorrente)"
            name="arr"
            value={formData.financeiro.arr}
            onChange={() => {}}
            prefix="R$"
            helpText="Calculado: MRR × 12"
            disabled
          />
          <FormInput
            label="Receita TTM"
            name="receitaTTM"
            value={formData.financeiro.receitaTTM}
            onChange={(v) => updateSection('financeiro', { receitaTTM: v as number })}
            prefix="R$"
            helpText="Receita últimos 12 meses"
            min={0}
          />
          <FormInput
            label="EBITDA Anual"
            name="ebitda"
            value={formData.financeiro.ebitda}
            onChange={(v) => updateSection('financeiro', { ebitda: v as number })}
            prefix="R$"
            helpText="Pode ser negativo"
          />
          <FormInput
            label="Churn Mensal"
            name="churn"
            value={formData.financeiro.churn}
            onChange={(v) => updateSection('financeiro', { churn: v as number })}
            suffix="%"
            helpText="Taxa de cancelamento mensal"
            min={0}
            max={100}
            step={0.1}
          />
          <FormInput
            label="Número de Clientes"
            name="clientes"
            value={formData.financeiro.clientes}
            onChange={(v) => updateSection('financeiro', { clientes: v as number })}
            helpText="Clientes ativos pagantes"
            min={0}
            step={1}
          />
        </div>
      </AccordionSection>

      {/* Seção Projeções */}
      <AccordionSection
        title="Projeções"
        icon={TrendingUp}
        isOpen={isOpen('projecoes')}
        onToggle={() => toggle('projecoes')}
        description="Crescimento e taxas de desconto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSlider
            label="Crescimento Anual (3 anos)"
            name="crescimento3y"
            value={formData.projecoes.crescimento3y}
            onChange={(v) => updateSection('projecoes', { crescimento3y: v })}
            min={-20}
            max={100}
            suffix="%"
            helpText="Taxa de crescimento projetada"
          />
          <FormSlider
            label="WACC (Custo de Capital)"
            name="wacc"
            value={formData.projecoes.wacc}
            onChange={(v) => updateSection('projecoes', { wacc: v })}
            min={10}
            max={35}
            suffix="%"
            helpText={`Padrão ${formData.basic.setor}: ${waccPadrao}%`}
          />
          <FormSlider
            label="Taxa Perpétua"
            name="perpetuo"
            value={formData.projecoes.perpetuo}
            onChange={(v) => updateSection('projecoes', { perpetuo: v })}
            min={0}
            max={6}
            step={0.5}
            suffix="%"
            helpText="Crescimento perpétuo (DCF)"
          />
        </div>
      </AccordionSection>

      {/* Seção Ajustes */}
      <AccordionSection
        title="Ajustes e Qualificadores"
        icon={Sliders}
        isOpen={isOpen('ajustes')}
        onToggle={() => toggle('ajustes')}
        description="Fatores qualitativos"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSlider
            label="CapEx (% da Receita)"
            name="capexPct"
            value={formData.ajustes.capexPct}
            onChange={(v) => updateSection('ajustes', { capexPct: v })}
            min={0}
            max={30}
            suffix="%"
            helpText="Investimento em capital"
          />
          <FormSlider
            label="LTV/CAC Ratio"
            name="ltvCac"
            value={formData.ajustes.ltvCac}
            onChange={(v) => updateSection('ajustes', { ltvCac: v })}
            min={0}
            max={10}
            step={0.5}
            suffix="x"
            helpText="Ideal: > 3x"
          />
          <FormSlider
            label="Score da Equipe"
            name="equipeScore"
            value={formData.ajustes.equipeScore}
            onChange={(v) => updateSection('ajustes', { equipeScore: v })}
            min={0}
            max={100}
            suffix="/100"
            helpText="Qualidade e experiência"
          />
        </div>
      </AccordionSection>

      {/* Botão Reset */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Resetar para padrões
        </button>
      </div>
    </form>
  );
}
