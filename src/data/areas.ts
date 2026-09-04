import type { GrandeArea } from '../types';

export const GRANDES_AREAS: GrandeArea[] = [
  'Clínica Médica',
  'Pediatria',
  'Cirurgia Geral',
  'Ginecologia e Obstetrícia',
  'Preventiva',
  'Flashcards',
  'Simulados',
];

export const SUB_AREAS: Record<GrandeArea, string[]> = {
  'Clínica Médica': [
    'Esquizofrenia', 'TOC', 'TEA e TDAH', 'Transtorno mental na infância',
    'Transtornos de Ansiedade', 'Transtornos de humor', 'Transtornos do uso de substâncias',
    'Transtornos alimentares', 'Transtornos do neurodesenvolvimento', 'Transtorno de personalidade',
    'RAPS / CAPS', 'SUS', 'Transtorno bipolar', 'Revisão ENAMED', 'Emergências psiquiátricas',
    'Hipertensão Arterial Sistêmica', 'DPOC', 'Derrame pleural', 'Osmolaridade e Natremia',
    'Hiponatremia', 'TEPT', 'Transtorno de somatização',
    'Insuficiência cardíaca', 'Arritmias', 'Pneumonia', 'IVAS', 'Bronquiolite',
    'Asma', 'Hepatites', 'Doença de Crohn', 'Colite ulcerativa', 'Diabetes mellitus',
    'Hipotireoidismo', 'Hipertireoidismo', 'Anemia', 'Leucemia', 'Linfoma',
    'Nefrite', 'Síndrome nefrótica', 'IRA e DRC', 'Sedativos e anticonvulsivantes',
    'Intoxicação por lítio', 'Intoxicação / abstinência',
  ],
  'Pediatria': [
    'Icterícia neonatal', 'Triagem neonatal', 'Reanimação neonatal', 'Lactente sibilante',
    'APGAR', 'Vacinação', 'Aleitamento materno', 'Avaliação neonatal', 'Neonatologia',
    'Pneumonia', 'ITU', 'Bronquiolite', 'Diarreia', 'Otite média aguda',
    'Ventilação mecânica', 'Crupe', 'Displasia broncopulmonar', 'DPOC pediátrico',
    'Convulsão febril', 'Síndrome ictérica', 'Classificação do RN',
    'Doenças exantemáticas', 'IVAS pediátrica', 'Trantornos de humor (Ped)',
    'Infecção neonatal', 'Osmolaridade e Natremia (Ped)',
  ],
  'Cirurgia Geral': [
    'Trauma abdominal', 'Abdômen agudo', 'Hérnias', 'Apendicite',
    'Colecistite', 'Pancreatite', 'Obstrução intestinal', 'Hemorragia digestiva',
    'Câncer colorretal', 'Cirurgia bariátrica', 'Queimaduras', 'Feridas e suturas',
    'Politrauma', 'TCE', 'Trauma torácico',
  ],
  'Ginecologia e Obstetrícia': [
    'TORCH', 'Pré-eclâmpsia', 'Diabetes gestacional', 'Trabalho de parto',
    'Hemorragia pós-parto', 'Aborto', 'Síndromes hipertensivas',
    'Infecções genitais', 'Patologia cervical', 'Endometriose',
    'Mioma uterino', 'Câncer de mama', 'Câncer de colo uterino',
    'Contracepção', 'Menopausa',
  ],
  'Preventiva': [
    'RAPS / CAPS', 'SUS', 'Doenças exantemáticas', 'IVAS', 'Dengue',
    'Hepatites', 'Tuberculose', 'Políticas e Programas do SUS',
    'Vacinação', 'Epidemiologia', 'Vigilância sanitária', 'Saúde da mulher',
    'Saúde da criança', 'Saúde do trabalhador', 'Hanseníase',
  ],
  'Flashcards': ['Sessão de Flashcards'],
  'Simulados': ['Simulado completo', 'Simulado por área'],
};

export const AREA_COLORS: Record<GrandeArea, string> = {
  'Clínica Médica': '#818cf8',
  'Pediatria': '#f97316',
  'Cirurgia Geral': '#22c55e',
  'Ginecologia e Obstetrícia': '#ec4899',
  'Preventiva': '#06b6d4',
  'Simulados': '#ef4444',
  'Flashcards': '#a855f7',
};
