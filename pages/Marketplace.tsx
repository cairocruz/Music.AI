import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Musica } from '../types';
import TrackCard from '../components/TrackCard';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Marketplace: React.FC = () => {
  const [tracks, setTracks] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const { session } = useAuth();

  useEffect(() => {
    fetchMarketplace();
  }, []);

  useEffect(() => {
    if (!session) {
      setPurchasedIds(new Set());
      return;
    }

    fetchPurchasedIds(session.user.id);
  }, [session]);

  const fetchPurchasedIds = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('musica_id')
        .eq('usuario_id', userId)
        .eq('status', 'concluido');

      if (error) throw error;

      const next = new Set((data ?? []).map((row: any) => String(row.musica_id)));
      setPurchasedIds(next);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchasedIds(new Set());
    }
  };

  const fetchMarketplace = async () => {
    try {
      // Fetch songs that are marked as for sale (em_venda = true)
      const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .eq('em_venda', true)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setTracks(data as Musica[] || []);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(track => 
    track.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (track.estilo && track.estilo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-slate-400 mt-1">Descubra e compre músicas geradas por IA</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar músicas ou estilos..." 
            className="bg-surface border border-slate-700 text-white pl-10 pr-4 py-2 rounded-full w-full md:w-80 focus:outline-none focus:border-primary transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {filteredTracks.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTracks.map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    showBuyButton={true}
                    isPurchased={purchasedIds.has(track.id)}
                  />
                ))}
             </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              <p>Nenhuma música encontrada para sua busca.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
