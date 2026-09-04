export interface BigNumberItem {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "accent" | "highlight" | "success";
}

export const DASHBOARD_BIG_NUMBERS: BigNumberItem[] = [
  {
    id: "championships",
    label: "Campeonatos ativos",
    value: "12",
    hint: "3 começam nesta semana",
    tone: "primary",
  },
  {
    id: "challenges",
    label: "Desafios em andamento",
    value: "28",
    hint: "7 com janela de palpites aberta",
    tone: "accent",
  },
  {
    id: "tickets",
    label: "Tickets vendidos",
    value: "4.182",
    hint: "+18% vs. semana anterior",
    tone: "highlight",
  },
  {
    id: "users",
    label: "Usuários cadastrados",
    value: "9.640",
    hint: "214 novos nos últimos 7 dias",
    tone: "success",
  },
  {
    id: "guesses",
    label: "Palpites hoje",
    value: "1.305",
    hint: "Média de 3,2 por ticket ativo",
    tone: "accent",
  },
  {
    id: "revenue",
    label: "Receita do mês",
    value: "R$ 86,4 mil",
    hint: "Valores ilustrativos (mock)",
    tone: "highlight",
  },
];
