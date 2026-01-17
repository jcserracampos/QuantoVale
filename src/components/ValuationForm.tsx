// Formulário de Valuation Premium
// Design minimalista com inputs modernos e sliders premium

import {
  ChevronDown,
  Building2,
  DollarSign,
  TrendingUp,
  Sliders,
  Rocket,
  Users,
  Scale,
  RotateCcw,
} from 'lucide-react';
import type { ValuationFormData, Setor, Estagio } from '@/types/valuation';
import { useAccordion } from '@/hooks/useValuation';
import { MULTIPLOS_SETOR, MULTIPLOS_ESTAGIO } from '@/utils/formulas';
import { BERKUS_MAX_POR_FATOR } from '@/types/valuation';

const SETORES: Setor[] = [
  'SaaS/Tech', 'Fintech', 'E-commerce', 'Marketplace',
  'EdTech', 'HealthTech', 'LogTech', 'AgTech', 'Outro',
];

const ESTAGIOS: Estagio[] = ['Pre-seed', 'Seed', 'Serie-A', 'Serie-B+', 'Maduro'];

interface Props {
  formData: ValuationFormData;
  updateSection: <K extends keyof ValuationFormData>(
    section: K,
    updates: Partial<ValuationFormData[K]>
  ) => void;
  resetForm: () => void;
  isEarlyStage: boolean;
  isLateStage: boolean;
}

// Seção colapsável premium
function Section({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors -mx-2 px-2 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary-400" />
          </div>
          <span className="font-medium text-slate-200">{title}</span>
          {badge && (
            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[2000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Input premium
function Input({
  label,
  value,
  onChange,
  type = 'number',
  placeholder,
  prefix,
  suffix,
  helpText,
  disabled,
  min,
  max,
  step,
}: {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
          }
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`
            input-premium tabular-nums
            ${prefix ? 'pl-12' : ''}
            ${suffix ? 'pr-12' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}

// Select premium
function Select({
  label,
  value,
  onChange,
  options,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helpText?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}

// Slider premium
function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  formatValue,
  helpText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  formatValue?: (v: number) => string;
  helpText?: string;
}) {
  const display = formatValue ? formatValue(value) : `${value}${suffix}`;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-400">{label}</label>
        <span className="text-sm font-semibold text-primary-400 tabular-nums">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="slider-premium"
          style={{
            background: `linear-gradient(to right, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.4) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{formatValue ? formatValue(min) : `${min}${suffix}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${suffix}`}</span>
      </div>
      {helpText && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  );
}

export function ValuationForm({ formData, updateSection, resetForm, isEarlyStage, isLateStage }: Props) {
  const { isOpen, toggle } = useAccordion(['basic', 'financeiro', 'berkus']);

  const multiploInfo = MULTIPLOS_SETOR[formData.basic.setor as Setor];
  const estagioInfo = MULTIPLOS_ESTAGIO[formData.basic.estagio as Estagio];
  const formatUSD = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  return (
    <form className="space-y-0">
      {/* Básico */}
      <Section
        title="Informações Básicas"
        icon={Building2}
        isOpen={isOpen('basic')}
        onToggle={() => toggle('basic')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Nome da Empresa"
            type="text"
            value={formData.basic.name || ''}
            onChange={(v) => updateSection('basic', { name: v as string })}
            placeholder="Minha Startup"
          />
          <Select
            label="Setor"
            value={formData.basic.setor}
            onChange={(v) => updateSection('basic', { setor: v as Setor })}
            options={SETORES.map((s) => ({ value: s, label: s }))}
            helpText={`Múltiplo: ${multiploInfo.min}-${multiploInfo.max}x ARR`}
          />
          <Select
            label="Estágio"
            value={formData.basic.estagio}
            onChange={(v) => updateSection('basic', { estagio: v as Estagio })}
            options={ESTAGIOS.map((e) => ({
              value: e,
              label: e === 'Serie-A' ? 'Série A' : e === 'Serie-B+' ? 'Série B+' : e,
            }))}
            helpText={`WACC: ${estagioInfo.waccDefault}%`}
          />
        </div>
        <div className="mt-4 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
          <p className="text-sm text-slate-400">
            <span className="text-primary-400 font-medium">Métodos recomendados:</span>{' '}
            {estagioInfo.metodosPreferidos.join(' • ')}
          </p>
        </div>
      </Section>

      {/* Financeiro */}
      <Section
        title="Dados Financeiros"
        icon={DollarSign}
        isOpen={isOpen('financeiro')}
        onToggle={() => toggle('financeiro')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="MRR (Receita Mensal)"
            value={formData.financeiro.mrr}
            onChange={(v) => updateSection('financeiro', { mrr: v as number })}
            prefix="R$"
            helpText="Receita recorrente mensal"
            min={0}
            step={1000}
          />
          <Input
            label="ARR (Receita Anual)"
            value={formData.financeiro.arr}
            onChange={() => {}}
            prefix="R$"
            helpText="MRR × 12"
            disabled
          />
          <Input
            label="EBITDA Anual"
            value={formData.financeiro.ebitda}
            onChange={(v) => updateSection('financeiro', { ebitda: v as number })}
            prefix="R$"
            helpText={isEarlyStage ? 'Opcional' : 'Obrigatório'}
          />
          <Input
            label="Churn Mensal"
            value={formData.financeiro.churn}
            onChange={(v) => updateSection('financeiro', { churn: v as number })}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
          <Input
            label="Clientes Ativos"
            value={formData.financeiro.clientes}
            onChange={(v) => updateSection('financeiro', { clientes: v as number })}
            min={0}
          />
          <Input
            label="Receita TTM"
            value={formData.financeiro.receitaTTM}
            onChange={(v) => updateSection('financeiro', { receitaTTM: v as number })}
            prefix="R$"
            helpText="Últimos 12 meses"
          />
        </div>

        {isLateStage && (
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-sm text-slate-400 mb-4">Patrimônio Líquido</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Total de Ativos"
                value={formData.financeiro.ativos || 0}
                onChange={(v) => updateSection('financeiro', { ativos: v as number })}
                prefix="R$"
              />
              <Input
                label="Total de Passivos"
                value={formData.financeiro.passivos || 0}
                onChange={(v) => updateSection('financeiro', { passivos: v as number })}
                prefix="R$"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Rodada */}
      <Section
        title="Rodada Atual"
        icon={Rocket}
        isOpen={isOpen('rodada')}
        onToggle={() => toggle('rodada')}
        badge="Opcional"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Pre-Money Estimado"
            value={formData.rodada.preMoneyEstimado}
            onChange={(v) => updateSection('rodada', { preMoneyEstimado: v as number })}
            prefix="R$"
          />
          <Input
            label="Investimento"
            value={formData.rodada.investimento}
            onChange={(v) => updateSection('rodada', { investimento: v as number })}
            prefix="R$"
          />
          <Input
            label="Post-Money"
            value={formData.rodada.postMoney}
            onChange={() => {}}
            prefix="R$"
            disabled
          />
        </div>
      </Section>

      {/* Berkus (Early-Stage) */}
      {isEarlyStage && (
        <Section
          title="Método Berkus"
          icon={Users}
          isOpen={isOpen('berkus')}
          onToggle={() => toggle('berkus')}
          badge="Early"
        >
          <p className="text-sm text-slate-500 mb-6">
            Ajuste cada fator de $0 a $500k. Máximo: $2.5M USD.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <Slider
              label="Equipe"
              value={formData.berkus.equipe}
              onChange={(v) => updateSection('berkus', { equipe: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
            />
            <Slider
              label="Produto"
              value={formData.berkus.produto}
              onChange={(v) => updateSection('berkus', { produto: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
            />
            <Slider
              label="Mercado"
              value={formData.berkus.mercado}
              onChange={(v) => updateSection('berkus', { mercado: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
            />
            <Slider
              label="Tração"
              value={formData.berkus.tracao}
              onChange={(v) => updateSection('berkus', { tracao: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
            />
            <Slider
              label="IP/Barreiras"
              value={formData.berkus.ip}
              onChange={(v) => updateSection('berkus', { ip: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
            />
          </div>
          <div className="mt-6 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
            <p className="text-sm">
              <span className="text-slate-400">Total Berkus:</span>{' '}
              <span className="text-primary-400 font-semibold">
                ${((formData.berkus.equipe + formData.berkus.produto +
                  formData.berkus.mercado + formData.berkus.tracao +
                  formData.berkus.ip) / 1e6).toFixed(2)}M
              </span>
            </p>
          </div>
        </Section>
      )}

      {/* Scorecard (Early-Stage) */}
      {isEarlyStage && (
        <Section
          title="Método Scorecard"
          icon={Scale}
          isOpen={isOpen('scorecard')}
          onToggle={() => toggle('scorecard')}
          badge="Early"
        >
          <p className="text-sm text-slate-500 mb-6">
            Compare com a média do setor. Ajuste de -50% a +50%.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <Slider
              label="Equipe (30%)"
              value={formData.scorecard.equipeAjuste}
              onChange={(v) => updateSection('scorecard', { equipeAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
            <Slider
              label="Mercado (25%)"
              value={formData.scorecard.tamanhoMercadoAjuste}
              onChange={(v) => updateSection('scorecard', { tamanhoMercadoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
            <Slider
              label="Produto (15%)"
              value={formData.scorecard.produtoAjuste}
              onChange={(v) => updateSection('scorecard', { produtoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
            <Slider
              label="Competição (10%)"
              value={formData.scorecard.competicaoAjuste}
              onChange={(v) => updateSection('scorecard', { competicaoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
            <Slider
              label="Marketing (10%)"
              value={formData.scorecard.marketingAjuste}
              onChange={(v) => updateSection('scorecard', { marketingAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
            <Slider
              label="Outros (10%)"
              value={formData.scorecard.outrosAjuste}
              onChange={(v) => updateSection('scorecard', { outrosAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
            />
          </div>
        </Section>
      )}

      {/* Projeções DCF */}
      <Section
        title="Projeções DCF"
        icon={TrendingUp}
        isOpen={isOpen('projecoes')}
        onToggle={() => toggle('projecoes')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-8">
          <Slider
            label="Crescimento (3 anos)"
            value={formData.projecoes.crescimento3y}
            onChange={(v) => updateSection('projecoes', { crescimento3y: v })}
            min={-20}
            max={100}
            suffix="%"
          />
          <Slider
            label="WACC"
            value={formData.projecoes.wacc}
            onChange={(v) => updateSection('projecoes', { wacc: v })}
            min={10}
            max={35}
            suffix="%"
            helpText={`Padrão: ${estagioInfo.waccDefault}%`}
          />
          <Slider
            label="Taxa Perpétua"
            value={formData.projecoes.perpetuo}
            onChange={(v) => updateSection('projecoes', { perpetuo: v })}
            min={0}
            max={6}
            step={0.5}
            suffix="%"
          />
        </div>
      </Section>

      {/* Ajustes */}
      <Section
        title="Ajustes"
        icon={Sliders}
        isOpen={isOpen('ajustes')}
        onToggle={() => toggle('ajustes')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-8">
          <Slider
            label="CapEx"
            value={formData.ajustes.capexPct}
            onChange={(v) => updateSection('ajustes', { capexPct: v })}
            min={0}
            max={30}
            suffix="%"
          />
          <Slider
            label="LTV/CAC"
            value={formData.ajustes.ltvCac}
            onChange={(v) => updateSection('ajustes', { ltvCac: v })}
            min={0}
            max={10}
            step={0.5}
            suffix="x"
            helpText="Ideal: > 3x"
          />
          <Slider
            label="Score Equipe"
            value={formData.ajustes.equipeScore}
            onChange={(v) => updateSection('ajustes', { equipeScore: v })}
            min={0}
            max={100}
            suffix="/100"
          />
        </div>
      </Section>

      {/* Reset */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Resetar
        </button>
      </div>
    </form>
  );
}
