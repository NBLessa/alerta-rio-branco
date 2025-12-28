import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Menu, X } from 'lucide-react';
import { useState } from 'react';
import logoSentinela from '@/assets/logo-sentinela.png';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logoSentinela} 
              alt="Sentinela" 
              className="h-14 w-14 object-contain"
            />
            <span className="text-xl font-bold text-foreground hidden sm:block">
              Sentinela
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mapa
            </Link>
            <Link 
              to="/meus-alertas" 
              className={`text-sm font-medium transition-colors ${
                isActive('/meus-alertas') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Meus Alertas
            </Link>
            <Link 
              to="/termos" 
              className={`text-sm font-medium transition-colors ${
                isActive('/termos') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Termos
            </Link>
          </nav>

          {/* Report Button */}
          <div className="flex items-center gap-4">
            <Link 
              to="/reportar" 
              className="btn-emergency text-sm py-2 px-4"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Reportar</span>
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-base font-medium py-2 ${
                  isActive('/') ? 'text-primary' : 'text-foreground'
                }`}
              >
                Mapa
              </Link>
              <Link 
                to="/meus-alertas" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-base font-medium py-2 ${
                  isActive('/meus-alertas') ? 'text-primary' : 'text-foreground'
                }`}
              >
                Meus Alertas
              </Link>
              <Link 
                to="/termos" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-base font-medium py-2 ${
                  isActive('/termos') ? 'text-primary' : 'text-foreground'
                }`}
              >
                Termos
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
