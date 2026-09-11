export type BlogPost = {
  slug: string;
  date: string;
  en: { title: string; excerpt: string; body: string[] };
  pt: { title: string; excerpt: string; body: string[] };
};

export const POSTS: BlogPost[] = [
  {
    slug: "multi-tenant-billing",
    date: "2026-09-01",
    en: {
      title: "Per-organization billing, done right",
      excerpt: "Why the subscription belongs to the workspace — not the user — and how webhooks stay in sync.",
      body: [
        "In B2B SaaS the paying entity is the company, not the individual. This boilerplate attaches the Stripe customer and subscription to the organization, so plan changes, seats and invoices follow the workspace when people join or leave.",
        "Stripe webhooks are verified, deduplicated by event id and processed per event type: checkout completion, subscription updates, cancellations and failed payments — the last one triggering in-app and email dunning to owners.",
      ],
    },
    pt: {
      title: "Cobrança por organização, do jeito certo",
      excerpt: "Por que a assinatura pertence ao workspace — não ao usuário — e como os webhooks ficam sincronizados.",
      body: [
        "Em SaaS B2B quem paga é a empresa, não o indivíduo. Este boilerplate anexa o customer e a subscription do Stripe à organização, então plano, seats e faturas acompanham o workspace quando pessoas entram ou saem.",
        "Os webhooks do Stripe são verificados, deduplicados por event id e processados por tipo de evento: conclusão de checkout, atualizações, cancelamentos e falhas de pagamento — este último disparando cobrança in-app e por e-mail aos owners.",
      ],
    },
  },
  {
    slug: "cookie-sessions",
    date: "2026-08-15",
    en: {
      title: "Cookie sessions that survive the real world",
      excerpt: "Short-lived access tokens, rotating refresh families and instant revocation on password change.",
      body: [
        "Access tokens live 15 minutes; refresh tokens rotate on every use and reuse of an old token revokes the whole family — the standard defense against token theft.",
        "Changing a password revokes every session immediately, and deactivated users are rejected on the next request, not at the next login.",
      ],
    },
    pt: {
      title: "Sessões em cookie que sobrevivem ao mundo real",
      excerpt: "Access tokens curtos, refresh rotativo em família e revogação imediata na troca de senha.",
      body: [
        "Access tokens vivem 15 minutos; refresh tokens rotacionam a cada uso e o reuso de um token antigo revoga a família inteira — a defesa padrão contra roubo de token.",
        "Trocar a senha revoga todas as sessões na hora, e usuários desativados são rejeitados no próximo request, não no próximo login.",
      ],
    },
  },
  {
    slug: "shipping-with-ai",
    date: "2026-08-01",
    en: {
      title: "Shipping SaaS features with AI agents",
      excerpt: "How AGENTS.md keeps generated code inside the layer chain: route, controller, service, repository.",
      body: [
        "Every HTTP request in this codebase follows one chain: route parses, controller delegates, service validates and orchestrates, repository persists. AI agents read AGENTS.md first, so generated features land in the right layer with tests.",
        "The result: agent-written code that a human reviewer can approve without restructuring.",
      ],
    },
    pt: {
      title: "Lançando features SaaS com agentes de IA",
      excerpt: "Como o AGENTS.md mantém o código gerado dentro da cadeia de camadas: rota, controller, service, repository.",
      body: [
        "Todo request HTTP neste código segue uma cadeia: rota faz parse, controller delega, service valida e orquestra, repository persiste. Agentes de IA leem o AGENTS.md primeiro, então features geradas caem na camada certa, com testes.",
        "O resultado: código escrito por agente que um revisor humano aprova sem reestruturar.",
      ],
    },
  },
];
