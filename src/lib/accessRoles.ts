export const ROLE_ACTIONS = ["read", "create", "edit", "delete"] as const;
export type RoleAction = (typeof ROLE_ACTIONS)[number];

export const ROLE_ACTION_LABELS: Record<RoleAction, string> = {
  read: "Ler",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
};

export interface AccessRoleResource {
  prefix: string;
  label: string;
}

export interface AccessRoleGroup {
  id: string;
  label: string;
  resources: AccessRoleResource[];
}

export const ACCESS_ROLE_GROUPS: AccessRoleGroup[] = [
  {
    id: "admin",
    label: "Painel",
    resources: [
      { prefix: "admin-access-profile", label: "Perfis de acesso" },
      { prefix: "admin-account", label: "Usuários" },
      { prefix: "admin-comunication", label: "Comunicações" },
      { prefix: "admin-template-email", label: "Templates de e-mail" },
      { prefix: "admin-template-push", label: "Templates de push" },
      { prefix: "admin-event-communication", label: "Comunicações de evento" },
      { prefix: "admin-account-deletion-request", label: "Exclusão de dados" },
      { prefix: "admin-chat-contact", label: "Contatos do chat" },
      { prefix: "admin-chat-chat", label: "Conversas" },
      { prefix: "admin-chat-chat-message", label: "Mensagens do chat" },
      { prefix: "admin-chat-realtime", label: "Realtime do chat" },
    ],
  },
  {
    id: "championships",
    label: "Campeonatos",
    resources: [
      { prefix: "championship", label: "Campeonatos" },
      { prefix: "championship-phase", label: "Fases" },
      { prefix: "championship-round", label: "Rodadas" },
      { prefix: "championship-match", label: "Jogos" },
      { prefix: "team", label: "Times" },
    ],
  },
  {
    id: "challenges",
    label: "Desafios",
    resources: [
      { prefix: "challenge", label: "Desafios" },
      { prefix: "challenge-round", label: "Rodadas de desafio" },
      { prefix: "ticket", label: "Tickets" },
      { prefix: "ticket-guess", label: "Palpites" },
      { prefix: "ticket-order", label: "Pedidos" },
    ],
  },
  {
    id: "accounts",
    label: "Contas e financeiro",
    resources: [
      { prefix: "account", label: "Contas" },
      { prefix: "account-deletion-request", label: "Solicitações de exclusão" },
      { prefix: "wallet-moviment", label: "Movimentações de carteira" },
      { prefix: "event-communication", label: "Comunicações do app" },
    ],
  },
];

export function roleKey(prefix: string, action: RoleAction): string {
  return `${prefix}:${action}`;
}

export function allRoleKeys(): string[] {
  return ACCESS_ROLE_GROUPS.flatMap((group) =>
    group.resources.flatMap((resource) => ROLE_ACTIONS.map((action) => roleKey(resource.prefix, action)))
  );
}

export function groupRoleKeys(group: AccessRoleGroup): string[] {
  return group.resources.flatMap((resource) => ROLE_ACTIONS.map((action) => roleKey(resource.prefix, action)));
}

export function resourceRoleKeys(prefix: string): string[] {
  return ROLE_ACTIONS.map((action) => roleKey(prefix, action));
}

export function roleLabel(role: string): string {
  const [prefix, action] = role.split(":");
  const resource = ACCESS_ROLE_GROUPS.flatMap((g) => g.resources).find((r) => r.prefix === prefix);
  const actionLabel = ROLE_ACTION_LABELS[action as RoleAction] ?? action;
  return resource ? `${resource.label} · ${actionLabel}` : role;
}
