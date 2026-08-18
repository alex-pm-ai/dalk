export type TipoAtividade = 'Questoes' | 'Flashcards' | 'Aula' | 'Simulado';

export type GrandeArea =
  | 'Clínica Médica'
  | 'Pediatria'
  | 'Cirurgia Geral'
  | 'Ginecologia e Obstetrícia'
  | 'Preventiva'
  | 'Flashcards'
  | 'Simulados';

export type StatusRevisao = 'Pendente' | 'Concluída' | 'Atrasada';

export interface Revisao {
  id: string;
  tipo: TipoAtividade;
  grandeArea: GrandeArea;
  subArea: string;
  dataRevisao: string;       // YYYY-MM-DD
  tempoEstudo: number;       // minutos
  questoesFeitas: number;
  questoesAcertadas: number;
  aproveitamento: number;    // 0-100
  status: StatusRevisao;
  proximaRevisao: string | null;
  gerarRevisaoInteligente: boolean;
  createdAt: string;
}

export interface DetalheAreaSimulado {
  area: GrandeArea;
  acertos: number;
  total: number;
}

export interface Simulado {
  id: string;
  titulo: string;
  ano: string;
  dataRealizacao: string;
  tempoGasto: number;   // minutos
  questoesTotal: number;
  questoesAcertadas: number;
  nota: number;         // 0-100
  detalhePorArea: DetalheAreaSimulado[];
}

export interface Tarefa {
  id: string;
  texto: string;
  concluida: boolean;
  createdAt: string;
}

/** Conteúdo cadastrado pelo próprio usuário (soma-se às sugestões de data/areas.ts). */
export interface Conteudo {
  id: string;
  grandeArea: GrandeArea;
  subArea: string;
  createdAt: string;
}

export interface FaixaAlgoritmo {
  min: number;
  max: number;
  dias: number;
  label: 'Atenção' | 'Bom' | 'Excelente';
}

export interface ConfigAlgoritmo {
  faixas: FaixaAlgoritmo[];
}
