// Navbar com toggle dark mode e auth
import { Moon, Sun, LogIn, LogOut, User, Calculator } from 'lucide-react';
import type { AuthState } from '@/types/valuation';

interface Props {
  isDark: boolean;
  toggleDark: () => void;
  authState: AuthState;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Navbar({
  isDark,
  toggleDark,
  authState,
  onLoginClick,
  onLogout,
}: Props) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            Valuation
            <span className="text-primary-600 dark:text-primary-400">Calc</span>
          </span>
          <span className="hidden sm:inline text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
            SaaS BR
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Auth */}
          {authState.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{authState.user?.name || authState.user?.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
