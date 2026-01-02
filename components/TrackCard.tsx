import React from 'react';
import { Musica } from '../types';
import { usePlayer } from '../contexts/PlayerContext';
import { Play, Pause, Heart, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TrackCardProps {
  track: Musica;
  showBuyButton?: boolean;
  isPurchased?: boolean;
  playSource?: 'auto' | 'preview' | 'download';
  playlist?: Musica[];
  playlistIndex?: number;
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  showBuyButton = false,
  isPurchased = false,
  playSource = 'auto',
  playlist,
  playlistIndex,
}) => {
  const { currentTrack, isPlaying, playTrack, playFromQueue } = usePlayer();
  const { session } = useAuth();
  
  const isCurrent = currentTrack?.id === track.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    // If the caller provides a playlist + index (e.g., Library), seed the player queue
    // so next/previous follow that same order.
    if (playlist && typeof playlistIndex === 'number') {
      const normalizedQueue = playlist
        .filter(Boolean)
        .map((t) => {
          if (playSource === 'download') {
            return { ...t, url_streaming: null, url_preview: null };
          }
          if (playSource === 'preview') {
            return { ...t, url_streaming: null, url_download: '' };
          }
          return t;
        });

      playFromQueue(normalizedQueue, playlistIndex);
      return;
    }

    // Caller-enforced playback source.
    if (playSource === 'preview') {
      if (!track.url_preview) {
        alert('Prévia indisponível para esta música.');
        return;
      }

      playTrack({
        ...track,
        url_streaming: null,
        url_download: '',
      });
      return;
    }

    if (playSource === 'download') {
      if (!track.url_download) {
        alert('URL de download indisponível para esta música.');
        return;
      }

      playTrack({
        ...track,
        url_streaming: null,
        url_preview: null,
      });
      return;
    }

    // Marketplace items should only be fully playable after purchase.
    // If not purchased, allow only a 30s preview using the download URL.
    if (showBuyButton && track.em_venda && !isPurchased) {
      playTrack({
        ...track,
        url_streaming: null,
        url_preview: null,
        playback_limit_seconds: 30,
      });
      return;
    }

    playTrack(track);
  };

  const handleBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
        alert("Faça login para comprar");
        return;
    }

    if (isPurchased) {
      alert('Você já comprou esta música.');
      return;
    }
    
    try {
        // Preferred flow: ask backend to create an n8n/Stripe checkout and return the URL.
        // Backend keeps secrets and verifies the user via Supabase access token.
        const res = await fetch('/api/n8n/billing/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ musicId: track.id }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message = data?.error || 'Erro ao iniciar checkout';
          throw new Error(message);
        }

        const url = typeof data?.url === 'string' ? data.url : '';
        if (!url) throw new Error('Checkout não retornou URL.');

        window.location.href = url;
    } catch (err) {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível gerar o checkout.';

        alert(
          `${message}\n\n` +
          'Se o erro persistir, confirme que o servidor API está rodando e que o Vite está com proxy de /api para http://localhost:8787.'
        );
    }
  };

  return (
    <div 
      className="group relative bg-surface rounded-xl overflow-hidden hover:bg-slate-700/50 transition-colors cursor-pointer border border-transparent hover:border-slate-600"
      onClick={handlePlay}
    >
      <div className="aspect-square bg-slate-800 relative overflow-hidden">
        {track.capa_url ? (
          <img 
            src={track.capa_url} 
            alt={track.titulo} 
            className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Music size={40} className="text-white/20" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition">
            {isThisPlaying ? (
              <Pause fill="white" className="text-white" size={20} />
            ) : (
              <Play fill="white" className="text-white ml-1" size={20} />
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className={`font-semibold text-lg truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{track.titulo}</h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-slate-400 text-sm truncate">{track.estilo || 'Gênero desconhecido'}</p>
          {showBuyButton && track.em_venda && (
            <span className="text-emerald-400 font-bold text-sm">${track.preco}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4">
            <button className="text-slate-500 hover:text-pink-500 transition">
                <Heart size={18} />
            </button>
            
            {showBuyButton && track.em_venda && (
                <button 
                    onClick={handleBuy}
                    className="bg-white/10 hover:bg-primary hover:text-white text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition"
                >
                    <ShoppingCart size={14} />
                    {isPurchased ? 'Comprado' : 'Comprar'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper icon component for default state
const Music = ({size, className}: {size: number, className: string}) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
);

export default TrackCard;
