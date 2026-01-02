import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wand2, ShoppingBag, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { session } = useAuth();

  return (
    <div className="px-6 py-10 md:px-12 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-8 md:p-16 text-center md:text-left mb-16">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Crie música com <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">Inteligência Artificial</span>
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl mb-8">
            Gere faixas com qualidade de estúdio em segundos usando IA. Venda suas criações no marketplace ou monte sua biblioteca pessoal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link 
              to={session ? "/create" : "/login"} 
              className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2"
            >
              <Wand2 size={20} />
              Começar a criar
            </Link>
            <Link 
              to="/marketplace" 
              className="bg-indigo-700/50 backdrop-blur-sm border border-indigo-500/30 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700/70 transition flex items-center justify-center gap-2"
            >
              Explorar marketplace
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
        
        {/* Abstract shapes bg */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
             <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
             <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-surface p-8 rounded-2xl border border-slate-700 hover:border-primary/50 transition duration-300">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
            <Wand2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Geração com IA</h3>
          <p className="text-slate-400">
            Descreva o clima, o gênero ou a letra, e a IA compõe uma faixa única para você em minutos.
          </p>
        </div>
        
        <div className="bg-surface p-8 rounded-2xl border border-slate-700 hover:border-secondary/50 transition duration-300">
          <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary mb-4">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Marketplace</h3>
          <p className="text-slate-400">
            Compre músicas exclusivas ou coloque suas gerações à venda para um público global.
          </p>
        </div>

        <div className="bg-surface p-8 rounded-2xl border border-slate-700 hover:border-accent/50 transition duration-300">
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent mb-4">
            <Music size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Biblioteca inteligente</h3>
          <p className="text-slate-400">
            Organize suas músicas compradas e criadas. Baixe em alta qualidade ou ouça direto da nuvem.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
