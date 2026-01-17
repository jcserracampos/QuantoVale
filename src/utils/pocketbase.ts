// Configuração e utilitários do PocketBase
// Self-hosted em localhost:8090, proxy via Vite /pb

import PocketBase from 'pocketbase';
import type {
  ValuationFormData,
  ValuationResult,
  PocketBaseValuation,
  AuthState
} from '@/types/valuation';

// Instância do PocketBase usando proxy do Vite
// Em produção, configure a URL do seu PocketBase
const pbUrl = import.meta.env.PROD
  ? (import.meta.env.VITE_POCKETBASE_URL || 'https://seu-pocketbase.com')
  : '/pb';

export const pb = new PocketBase(pbUrl);

// Desabilitar auto-cancelamento de requests
pb.autoCancellation(false);

/**
 * Verifica estado de autenticação atual
 */
export function getAuthState(): AuthState {
  if (pb.authStore.isValid && pb.authStore.model) {
    return {
      isAuthenticated: true,
      user: {
        id: pb.authStore.model.id,
        email: pb.authStore.model.email,
        name: pb.authStore.model.name,
      },
      token: pb.authStore.token,
    };
  }
  return {
    isAuthenticated: false,
    user: null,
  };
}

/**
 * Login com email e senha
 */
export async function login(email: string, password: string): Promise<AuthState> {
  try {
    await pb.collection('users').authWithPassword(email, password);
    return getAuthState();
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

/**
 * Registro de novo usuário
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthState> {
  try {
    const userData = {
      email,
      password,
      passwordConfirm: password,
      name: name || email.split('@')[0],
    };

    await pb.collection('users').create(userData);
    // Auto-login após registro
    return await login(email, password);
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

/**
 * Logout
 */
export function logout(): void {
  pb.authStore.clear();
}

/**
 * Salvar análise de valuation
 */
export async function salvarValuation(
  inputs: ValuationFormData,
  results: ValuationResult[]
): Promise<PocketBaseValuation> {
  const authState = getAuthState();

  if (!authState.isAuthenticated) {
    throw new Error('Usuário não autenticado. Faça login para salvar.');
  }

  const data = {
    user: authState.user!.id,
    inputs: JSON.stringify(inputs),
    results: JSON.stringify(results),
  };

  try {
    const record = await pb.collection('valuations').create(data);
    return record as unknown as PocketBaseValuation;
  } catch (error) {
    console.error('Erro ao salvar valuation:', error);
    throw error;
  }
}

/**
 * Listar valuations do usuário
 */
export async function listarValuations(): Promise<PocketBaseValuation[]> {
  const authState = getAuthState();

  if (!authState.isAuthenticated) {
    return [];
  }

  try {
    const records = await pb.collection('valuations').getList(1, 50, {
      filter: `user = "${authState.user!.id}"`,
      sort: '-created',
    });

    return records.items as unknown as PocketBaseValuation[];
  } catch (error) {
    console.error('Erro ao listar valuations:', error);
    return [];
  }
}

/**
 * Deletar valuation
 */
export async function deletarValuation(id: string): Promise<boolean> {
  try {
    await pb.collection('valuations').delete(id);
    return true;
  } catch (error) {
    console.error('Erro ao deletar valuation:', error);
    return false;
  }
}

/**
 * Exportar análise como JSON (sem necessidade de auth)
 */
export function exportarJSON(
  inputs: ValuationFormData,
  results: ValuationResult[]
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    inputs,
    results,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Exportar como CSV
 */
export function exportarCSV(results: ValuationResult[]): string {
  const headers = ['Método', 'Valor BRL', 'Valor USD', 'Confiança', 'Detalhes'];
  const rows = results.map(r => [
    r.metodo,
    r.valorBRL.toFixed(2),
    r.valorUSD.toFixed(2),
    r.confianca,
    r.detalhes || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

/**
 * Download de arquivo
 */
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Schema para criar coleções no PocketBase (referência)
export const POCKETBASE_SCHEMA = `
// Coleção: valuations
// Campos:
// - user (relation -> users)
// - inputs (json)
// - results (json)
//
// API Rules:
// List: @request.auth.id != "" && user = @request.auth.id
// View: @request.auth.id != "" && user = @request.auth.id
// Create: @request.auth.id != ""
// Update: @request.auth.id != "" && user = @request.auth.id
// Delete: @request.auth.id != "" && user = @request.auth.id
`;
