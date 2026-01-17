// Componente de Análises Salvas - Premium Design
import { useState } from 'react';
import { History, Loader2, ChevronDown, Trash2, FileInput } from 'lucide-react';
import type { PocketBaseValuation } from '@/types/valuation';
import { formatarNumeroGrande } from '@/utils/formulas';
import { deletarValuation } from '@/utils/pocketbase';

interface Props {
  savedValuations: PocketBaseValuation[];
  isLoading: boolean;
  onLoad: (valuation: PocketBaseValuation) => void;
  onRefresh: () => Promise<void>;
}

export function SavedValuations({ savedValuations, isLoading, onLoad, onRefresh }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta análise?')) return;

    setDeletingId(id);
    try {
      await deletarValuation(id);
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (savedValuations.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <History className="w-4 h-4 text-primary-400" />
          </div>
          <span className="font-medium text-slate-200">Análises Salvas</span>
          <span className="text-xs text-slate-500">({savedValuations.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* List */}
      {isOpen && (
        <div className="border-t border-white/[0.06] max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-500">Carregando...</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {savedValuations.map((valuation) => {
                const inputs = typeof valuation.inputs === 'string'
                  ? JSON.parse(valuation.inputs)
                  : valuation.inputs;
                const created = valuation.created
                  ? new Date(valuation.created).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <li
                    key={valuation.id}
                    className="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => onLoad(valuation)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">
                          {inputs.basic?.name || 'Sem nome'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20">
                            {inputs.basic?.estagio || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500">{inputs.basic?.setor}</span>
                          {valuation.valorPonderado && (
                            <span className="text-xs font-medium text-primary-400 tabular-nums">
                              {formatarNumeroGrande(valuation.valorPonderado)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">{created}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoad(valuation);
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-white/[0.05] transition-colors"
                          title="Carregar análise"
                        >
                          <FileInput className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(valuation.id!, e)}
                          disabled={deletingId === valuation.id}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
                          title="Excluir análise"
                        >
                          {deletingId === valuation.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
