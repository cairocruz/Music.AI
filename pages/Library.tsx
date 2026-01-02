import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Musica } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Library: React.FC = () => {
  const [tracks, setTracks] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      setLoading(true);
      setErrorMessage('');
      fetchLibrary();
    }
  }, [session]);

  const fetchLibrary = async () => {
    if (!session) return;

    try {
      // Fetch purchased IDs first. This avoids relying on implicit relationship joins,
      // which can be misconfigured and return `undefined` for `musicas`.
      const { data: purchases, error: purchasesError } = await supabase
        .from('compras')
        .select('musica_id')
        .eq('usuario_id', session.user.id)
        .eq('status', 'concluido');

      if (purchasesError) throw purchasesError;

      // IMPORTANT: don't coerce null/undefined to strings like "null" / "undefined".
      // If `id` is a UUID column, those values will cause Postgres to error.
      const rawIds = (purchases ?? [])
        .map((row: any) => row?.musica_id)
        .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);

      const musicIds = Array.from(new Set(rawIds));

      if (musicIds.length === 0) {
        setTracks([]);
        return;
      }

      const { data: musicRows, error: musicError } = await supabase
        .from('musicas')
        .select('*')
        .in('id', musicIds);

      if (musicError) throw musicError;

      const byId = new Map<string, Musica>((musicRows ?? []).map((m: any) => [String(m.id), m as Musica]));
      const ordered = musicIds.map((id) => byId.get(id)).filter(Boolean) as Musica[];
      setTracks(ordered);
    } catch (error: any) {
      console.error('Error fetching library:', error);
      setErrorMessage(error?.message || 'Failed to load your library.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Faça login</h2>
        <p className="text-slate-400 mb-6">Você precisa estar logado para ver sua biblioteca.</p>
        <Link to="/login" className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Minha Biblioteca</h1>
        <p className="text-slate-400 mt-1">Músicas que você comprou</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 mb-6">
              {errorMessage}
            </div>
          )}
          {tracks.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    playSource="download"
                    playlist={tracks}
                    playlistIndex={index}
                  />
                ))}
             </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-slate-700 p-12 text-center">
              <p className="text-slate-400 mb-6">Você ainda não comprou nenhuma música.</p>
              <Link to="/marketplace" className="text-primary hover:underline font-medium">
                Ver marketplace
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Library;