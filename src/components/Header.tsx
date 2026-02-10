import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Menu, X, Map, Bell, FileText } from 'lucide-react';
import { useState } from 'react';
import { SentinelaLogo } from '@/components/SentinelaLogo';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Mapa', icon: Map },
    { path: '/meus-alertas', label: 'Meus Alertas', icon: Bell },
    { path: '/termos', label: 'Termos', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 safe-area-top"
      style={{ boxShadow: '0 1px 3px 0 hsl(220 25% 12% / 0.06)' }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative transition-transform duration-300 group-hover:scale-105">
              <SentinelaLogo size={44} />
            </div>
            <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wider uppercase transition-all duration-300">
              SENTINELA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`
                  relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(path)
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
                {isActive(path) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Reportar + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/reportar"
              className="relative inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-3 sm:px-4 rounded-xl bg-primary text-primary-foreground shadow-md hover:shadow-glow hover:brightness-110 active:scale-[0.97] transition-all duration-200"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Reportar</span>
              {/* Subtle glow pulse */}
              <span className="absolute inset-0 rounded-xl bg-primary/20 animate-glow-pulse pointer-events-none" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-manipulation"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-3 border-t border-border/50 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-all duration-200
                    ${isActive(path)
                      ? 'text-primary bg-primary/8'
                      : 'text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}