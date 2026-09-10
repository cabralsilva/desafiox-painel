import type { SupportChat } from "@/types/supportChat";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const daysAgo = (days: number, hours = 14, minutes = 20) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const INITIAL_SUPPORT_CHATS: SupportChat[] = [
  {
    id: "c1",
    name: "Marina Costa",
    phone: "+55 11 98888-1201",
    unread: 2,
    lastMessage: "Enviei o comprovante no ticket.",
    lastAt: ago(8),
    online: true,
    contactIds: [],
    contact: {
      phone: "+55 11 98888-1201",
      email: "marina.costa@email.com",
      city: "São Paulo, SP",
      accountLabel: "Conta DESAFIOX #4821",
      tags: ["Cliente", "Pix"],
    },
    messages: [
      {
        id: "m1",
        author: "client",
        kind: "text",
        text: "Oi, meu palpite não apareceu no desafio de ontem.",
        sentAt: ago(95),
      },
      {
        id: "m2",
        author: "agent",
        kind: "text",
        text: "Olá, Marina. Vou conferir o lançamento na sua conta DESAFIOX.",
        sentAt: ago(90),
      },
      {
        id: "m3",
        author: "client",
        kind: "image",
        text: "Print da tela do app",
        attachments: [{ name: "print-palpite.jpg", sizeLabel: "1,2 MB", kind: "image" }],
        sentAt: ago(86),
      },
      {
        id: "m4",
        author: "agent",
        kind: "text",
        text: "Recebi. Abri um ticket de suporte para a análise do comprovante.",
        sentAt: ago(20),
      },
      {
        id: "m5",
        author: "client",
        kind: "file",
        text: "Enviei o comprovante no ticket.",
        attachments: [{ name: "comprovante-pix.pdf", sizeLabel: "340 KB", kind: "file" }],
        sentAt: ago(8),
      },
    ],
    tickets: [
      {
        id: "t1",
        protocol: "SUP-2026-0142",
        subject: "Palpite não creditado",
        status: "IN_REVIEW",
        openedAt: ago(20),
        artifacts: [
          { id: "a1", name: "print-palpite.jpg", kind: "image", sizeLabel: "1,2 MB" },
          { id: "a2", name: "comprovante-pix.pdf", kind: "file", sizeLabel: "340 KB" },
        ],
        history: [
          { id: "h1", at: ago(20), author: "agent", text: "Ticket aberto a partir do WhatsApp." },
          { id: "h2", at: ago(18), author: "system", text: "Artefatos anexados pelo cliente." },
          { id: "h3", at: ago(12), author: "agent", text: "Encaminhado para análise financeira." },
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "Rafael Nunes",
    phone: "+55 21 97777-4402",
    unread: 0,
    lastMessage: "Perfeito, obrigado!",
    lastAt: ago(54),
    online: false,
    contactIds: [],
    contact: {
      phone: "+55 21 97777-4402",
      email: "rafael.nunes@email.com",
      city: "Rio de Janeiro, RJ",
      accountLabel: "Conta DESAFIOX #3309",
      tags: ["Cliente"],
    },
    messages: [
      {
        id: "m6",
        author: "client",
        kind: "text",
        text: "Consigo alterar o time do meu ticket?",
        sentAt: ago(80),
      },
      {
        id: "m7",
        author: "agent",
        kind: "text",
        text: "Depois do fechamento da rodada não é possível alterar o palpite.",
        sentAt: ago(70),
      },
      {
        id: "m8",
        author: "client",
        kind: "text",
        text: "Perfeito, obrigado!",
        sentAt: ago(54),
      },
    ],
    tickets: [],
  },
  {
    id: "c3",
    name: "Ana Beatriz",
    phone: "+55 31 99665-0190",
    unread: 1,
    lastMessage: "Vídeo do erro no depósito",
    lastAt: ago(140),
    online: true,
    contactIds: [],
    contact: {
      phone: "+55 31 99665-0190",
      email: "ana.beatriz@email.com",
      city: "Belo Horizonte, MG",
      accountLabel: "Conta DESAFIOX #9012",
      tags: ["Depósito", "Prioridade"],
    },
    messages: [
      {
        id: "m9",
        author: "client",
        kind: "video",
        text: "Vídeo do erro no depósito",
        attachments: [{ name: "erro-deposito.mp4", sizeLabel: "8,4 MB", kind: "video" }],
        sentAt: ago(140),
      },
      {
        id: "m10",
        author: "agent",
        kind: "text",
        text: "Obrigada pelo vídeo. Vamos abrir um ticket de suporte com o SLA de pagamento.",
        sentAt: ago(132),
      },
    ],
    tickets: [
      {
        id: "t2",
        protocol: "SUP-2026-0148",
        subject: "Falha no depósito via Pix",
        status: "WAITING_CLIENT",
        openedAt: daysAgo(1, 9, 10),
        artifacts: [{ id: "a3", name: "erro-deposito.mp4", kind: "video", sizeLabel: "8,4 MB" }],
        history: [
          { id: "h4", at: daysAgo(1, 9, 10), author: "agent", text: "Ticket aberto." },
          {
            id: "h5",
            at: daysAgo(1, 11, 40),
            author: "system",
            text: "Aguardando novo comprovante do cliente.",
          },
        ],
      },
      {
        id: "t3",
        protocol: "SUP-2026-0091",
        subject: "Dúvida sobre premiação",
        status: "RESOLVED",
        openedAt: daysAgo(12, 16, 0),
        artifacts: [],
        history: [
          { id: "h6", at: daysAgo(12, 16, 0), author: "client", text: "Cliente perguntou sobre o prazo do prêmio." },
          { id: "h7", at: daysAgo(11, 10, 20), author: "agent", text: "Esclarecido o fluxo de pagamento." },
          { id: "h8", at: daysAgo(11, 10, 25), author: "system", text: "Ticket encerrado." },
        ],
      },
    ],
  },
  {
    id: "c4",
    name: "Lucas Ferreira",
    phone: "+55 41 98444-7760",
    unread: 0,
    lastMessage: "Você: Combinado, te retorno hoje.",
    lastAt: daysAgo(1, 18, 42),
    online: false,
    contactIds: [],
    contact: {
      phone: "+55 41 98444-7760",
      email: "lucas.ferreira@email.com",
      city: "Curitiba, PR",
      accountLabel: "Conta DESAFIOX #1150",
      tags: ["Cliente"],
    },
    messages: [
      {
        id: "m11",
        author: "client",
        kind: "text",
        text: "Quero excluir minha conta DESAFIOX.",
        sentAt: daysAgo(1, 18, 10),
      },
      {
        id: "m12",
        author: "agent",
        kind: "text",
        text: "Combinado, te retorno hoje.",
        sentAt: daysAgo(1, 18, 42),
      },
    ],
    tickets: [
      {
        id: "t4",
        protocol: "SUP-2026-0155",
        subject: "Solicitação de exclusão de dados",
        status: "OPEN",
        openedAt: daysAgo(1, 18, 45),
        artifacts: [],
        history: [
          { id: "h9", at: daysAgo(1, 18, 45), author: "agent", text: "Ticket aberto. Aguardando conferência jurídica." },
        ],
      },
    ],
  },
];
