import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wand2, Music, AlertCircle } from 'lucide-react';

const Create: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
    const [theme, setTheme] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

    useEffect(() => {
        // No-op: kept to avoid changing behavior elsewhere.
    }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
        setError("Você precisa estar logado.");
        return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
        const res = await fetch('/api/n8n/creations/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                mode: 'inspiration',
                title: title.trim(),
                theme: theme.trim(),
                inspiration_prompt: prompt.trim(),
            }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const message =
                data?.reason ||
                data?.motivo ||
                data?.error ||
                'Falha ao enviar para o webhook.';
            throw new Error(message);
        }

        navigate('/my-creations');
    } catch (err: any) {
        console.error("Submission error:", err);
        setError(err.message || 'Failed to submit request.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Wand2 className="text-primary" /> Criar nova música
        </h1>
                <p className="text-slate-400 mt-2">Descreva sua ideia e deixe a IA compor.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-slate-700 p-6 md:p-8">

                <div className="flex gap-4 mb-8 bg-slate-900/50 p-1.5 rounded-xl w-fit">
                    <div className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-white shadow-lg">
                        <Music size={18} />
                        Modo descrição
                    </div>
                </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex.: Neon Highway"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Estilo / Tema</label>
                    <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        required
                        placeholder="Ex.: Pop, Trap, Lo-fi, Sertanejo, Funk..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descreva o estilo, instrumentos e clima
                </label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    rows={4}
                    placeholder="Uma faixa synthwave cyberpunk com baixo forte, ritmo marcante e atmosfera futurista..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="pt-4 flex justify-end">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-primary/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>Processando...</>
                    ) : (
                        <>
                            <Wand2 size={18} />
                            Gerar música
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Create;
