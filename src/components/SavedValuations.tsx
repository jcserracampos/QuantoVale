// Componente para listar e carregar análises salvas
// Mostra histórico do usuário logado

import { useState } from 'react';
import { History, Loader2, ChevronDown, ChevronUp, Trash2, FileInput } from 'lucide-react';
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header colapsável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            Análises Salvas
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({savedValuations.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Lista de análises */}
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
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
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => onLoad(valuation)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {inputs.basic?.name || 'Sem nome'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            {inputs.basic?.estagio || 'N/A'}
                          </span>
                          <span>{inputs.basic?.setor}</span>
                          {valuation.valorPonderado && (
                            <span className="font-medium text-primary-600 dark:text-primary-400">
                              {formatarNumeroGrande(valuation.valorPonderado)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{created}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoad(valuation);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Carregar análise"
                        >
                          <FileInput className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(valuation.id!, e)}
                          disabled={deletingId === valuation.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
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
