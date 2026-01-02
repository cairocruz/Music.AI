import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { Home, Music, Disc, PlusCircle, ShoppingBag, LogOut, User, LogIn } from 'lucide-react';
import MusicPlayer from './MusicPlayer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { signOut, profile, session } = useAuth();
  const { isPlaying } = usePlayer();

  const logoSrc = '/favicon.png';

  const [shine, setShine] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const shineRef = useRef<HTMLDivElement | null>(null);

  const shineStyle = useMemo(() => {
    if (!shine.visible) return { opacity: 0 } as React.CSSProperties;
    const size = 64;
    return {
      left: shine.x - size / 2,
      top: shine.y - size / 2,
      width: size,
      height: size,
      opacity: 1,
    } as React.CSSProperties;
  }, [shine]);

  const handleLogoMove = (e: React.MouseEvent) => {
    const rect = shineRef.current?.getBoundingClientRect();
    if (!rect) return;
    setShine({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handleLogoLeave = () => {
    setShine((prev) => ({ ...prev, visible: false }));
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Biblioteca', path: '/library', icon: Music },
    { name: 'Minhas Criações', path: '/my-creations', icon: Disc },
    { name: 'Criar', path: '/create', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Mobile Nav - Logged In Only */}
      {session && (
        <div className="md:hidden p-4 bg-surface border-b border-slate-700 flex justify-between items-center sticky top-0 z-40">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            music.ai
          </h1>
          <div className="flex gap-4">
               {profile && (
                   <Link to="/create" className="text-primary"><PlusCircle /></Link>
               )}
          </div>
        </div>
      )}

      {/* Sidebar - Desktop - Logged In Only */}
      {session && (
        <aside className="hidden md:flex w-64 flex-col bg-surface border-r border-slate-700 h-screen sticky top-0">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div
                ref={shineRef}
                onMouseMove={handleLogoMove}
                onMouseLeave={handleLogoLeave}
                className={`relative h-10 w-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/40 ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
                title="music.ai"
              >
                <img src={logoSrc} alt="music.ai" className="h-full w-full object-cover" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute rounded-full bg-white/10 blur-xl transition-opacity duration-150"
                  style={shineStyle}
                />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                music.ai
              </h1>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </nav>

          {profile && (
              <div className="p-4 border-t border-slate-700">
                  <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                          {profile.avatar_url ? (
                              <img src={profile.avatar_url} className="rounded-full" alt="avatar"/>
                          ) : (
                              <User size={16} />
                          )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate">{profile.nome_completo || profile.email}</p>
                      </div>
                  </div>
                  <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-red-400 transition text-sm"
                  >
                      <LogOut size={18} />
                      Sair
                  </button>
              </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 relative pb-32 flex flex-col">
        {/* Public Header (Logged Out) */}
        {!session && (
            <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
                <div className="px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div
                          ref={shineRef}
                          onMouseMove={handleLogoMove}
                          onMouseLeave={handleLogoLeave}
                          className="relative h-10 w-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/40"
                          title="music.ai"
                        >
                          <img src={logoSrc} alt="music.ai" className="h-full w-full object-cover" />
                          <div
                            aria-hidden
                            className="pointer-events-none absolute rounded-full bg-white/10 blur-xl transition-opacity duration-150"
                            style={shineStyle}
                          />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                          music.ai
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link to="/marketplace" className="hidden sm:block text-slate-300 hover:text-white font-medium transition">Marketplace</Link>
                      <Link to="/register" className="hidden sm:block text-slate-300 hover:text-white font-medium transition">
                        Cadastrar
                      </Link>
                        <Link to="/login" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full font-medium transition">
                            <LogIn size={18} />
                          Entrar
                        </Link>
                    </nav>
                </div>
            </header>
        )}

        {children}
      </main>

      {/* Player */}
      <MusicPlayer />
    </div>
  );
};

export default Layout;