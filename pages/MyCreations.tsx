import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Criacao, Musica } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Cog } from 'lucide-react';
import TrackCard from '../components/TrackCard';

const MyCreations: React.FC = () => {
  const [creations, setCreations] = useState<(Criacao & { musicas?: Musica })[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      fetchCreations();
    }
  }, [session]);

  const fetchCreations = async () => {
    if (!session) return;
    try {
      // Fetch creations and join with linked music if available
      const { data, error } = await supabase
        .from('criacoes')
        .select(`
          *,
          musicas (*)
        `)
        .eq('usuario_id', session.user.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      // @ts-ignore
      setCreations((data || []).filter((c: any) => c?.status !== 'pronto'));
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <span className="flex items-center gap-1 text-yellow-500 text-sm"><Clock size={16} /> Processando</span>;
      case 'erro':
        return <span className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle size={16} /> Falhou</span>;
      case 'pronto':
        return <span className="flex items-center gap-1 text-green-500 text-sm"><CheckCircle size={16} /> Pronta</span>;
      default:
        return <span className="text-slate-400 text-sm">{status}</span>;
    }
  };

  if (!session) return null; // Or redirect logic handled by ProtectedRoute wrapper

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">Minhas Criações</h1>
            <p className="text-slate-400 mt-1">Músicas geradas pelos seus prompts</p>
        </div>
          <Link to="/create" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition">
            Nova criação
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {creations.length === 0 && (
             <div className="text-center py-20 bg-surface rounded-xl border border-slate-700">
               <p className="text-slate-400">Você não tem criações em processamento no momento.</p>
             </div>
          )}

          {creations.map((creation) => (
            <div key={creation.id} className="bg-surface rounded-xl p-4 border border-slate-700 flex flex-col md:flex-row gap-4 items-center">
                {/* Visual Status */}
                <div className="w-full md:w-24 h-24 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {creation.capa_url ? (
                        <img src={creation.capa_url} alt={creation.titulo} className="w-full h-full object-cover" />
                    ) : (
                    <Cog className="text-slate-600 animate-spin" size={28} />
                    )}
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                    <h3 className="text-lg font-bold text-white truncate">{creation.titulo}</h3>
                    <p className="text-slate-400 text-sm mb-1">Tema: <span className="text-slate-300">{creation.tema}</span></p>
                    <div className="flex justify-center md:justify-start">
                        {getStatusBadge(creation.status)}
                    </div>
                    {creation.status === 'erro' && creation.error_message && (
                        <p className="text-red-400 text-xs mt-1">{creation.error_message}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {creation.status === 'pronto' && creation.musicas && (
                        // If it's ready and linked to a music track, show the playable card logic or a simple play button
                        // We can reuse logic or just render the TrackCard if we want a full grid, 
                        // but here we are in a list view. Let's make it simple.
                        <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition">
                          Baixar
                        </button>
                    )}
                    {creation.status === 'pronto' && creation.musicas && (
                         <div className="w-64 hidden lg:block">
                             {/* Small embed of track card for immediate play */}
                             <TrackCard track={creation.musicas} />
                         </div>
                    )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCreations;
