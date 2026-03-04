import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CharacterSheet } from '../Gamification/CharacterSheet';
import { FloatingDecorations } from '../UI/FloatingDecorations';
import type { View, Client } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  onSelectClient: (client: Client) => void;
}

export function Layout({ children, currentView, onViewChange, onSelectClient }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [characterSheetOpen, setCharacterSheetOpen] = useState(false);

  const handleViewChange = (view: View) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-yellow-50 dark:bg-zinc-900">
      <FloatingDecorations />

      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-zinc-900 focus:rounded-[4px] focus:border-2 focus:border-zinc-900 focus:shadow-[3px_3px_0_0_#18181b] focus:text-sm focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={`lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          onSelectClient={handleSelectClient}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(v => !v)}
        />
      </div>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } ml-0`}
      >
        <Header
          onSelectClient={onSelectClient}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          showMenuButton
          onOpenCharacterSheet={() => setCharacterSheetOpen(true)}
        />
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav currentView={currentView} onViewChange={handleViewChange} />

      {characterSheetOpen && (
        <CharacterSheet onClose={() => setCharacterSheetOpen(false)} />
      )}
    </div>
  );
}

interface MobileNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  const navItems = [
    { view: 'dashboard' as View, label: 'Home', icon: '🏠' },
    { view: 'clients' as View, label: 'Clients', icon: '👥' },
    { view: 'tasks' as View, label: 'Tasks', icon: '✓' },
    { view: 'ai' as View, label: 'AI', icon: '🤖' },
    { view: 'hall-of-heroes' as View, label: 'Heroes', icon: '⭐' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-yellow-50 dark:bg-zinc-900 border-t-2 border-zinc-900 dark:border-white z-30 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            aria-label={item.label}
            aria-current={currentView === item.view ? 'page' : undefined}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors font-bold ${
              currentView === item.view
                ? 'text-zinc-900 dark:text-yellow-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="text-xl mb-0.5" aria-hidden="true">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
