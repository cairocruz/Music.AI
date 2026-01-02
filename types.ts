export interface Profile {
  id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  plano: 'free' | 'premium' | 'pro';
  email: string | null;
}

export interface Contexto {
  id: string;
  nome: string;
  descricao: string | null;
  prompt_sugestao: string | null;
  icone: string | null;
  cor: string;
}

export interface Musica {
  id: string;
  titulo: string;
  estilo: string | null;
  url_download: string;
  duracao_segundos: number | null;
  capa_url: string | null;
  url_streaming: string | null;
  url_preview: string | null;
  // Client-side hint for limiting playback (e.g., 30s preview in Marketplace).
  playback_limit_seconds?: number;
  preco: number;
  em_venda: boolean;
  vezes_tocada: number;
  favoritos: number;
  usuario_id: string | null; // Creator
}

export interface Criacao {
  id: string;
  titulo: string;
  tema: string;
  mode: 'inspiration' | 'lyrics';
  inspiration_prompt: string | null;
  lyrics: string | null;
  status: 'pendente' | 'pronto' | 'erro';
  error_message: string | null;
  preview_url: string | null;
  capa_url: string | null;
  musica_id: string | null;
  criado_em: string;
}

export interface Compra {
  id: string;
  musica_id: string;
  status: 'pendente' | 'concluido' | 'cancelado' | 'reembolsado';
  musicas?: Musica; // Joined data
  criado_em: string;
}

export interface SolicitacaoGeracao {
  id: string;
  prompt: string;
  status: string;
  titulo: string;
  tema: string;
  input_type: 'prompt' | 'lyrics';
}

export type Theme = {
  id: string;
  tema: string;
  categoria: string | null;
};
