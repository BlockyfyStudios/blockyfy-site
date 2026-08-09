/* =========================================================================
   BLOCKYFY - CONFIGURACAO DE PAGAMENTOS
   =========================================================================
   Este arquivo e a fonte dos cards interativos dos planos de assinatura.
   Os fallbacks <noscript> espelham nome/preco/estado, e os testes impedem
   que eles saiam de sincronia com esta configuracao.

   COMO ATIVAR OS PAGAMENTOS (Stripe):
   1. Confirme produtos, precos recorrentes em USD e campos do checkout.
   2. Confirme que o nome comercial Blockyfy, contact@blockyfy.net e a politica
      de reembolso aprovada continuam publicados.
   3. Cole cada Payment Link no "checkoutUrl" correspondente.
   4. Atualize os fallbacks <noscript> das paginas de venda: troque cada
      botao "Opening soon" por um link "Subscribe" para a mesma URL.
   5. Atualize o texto estatico de status para "Secure checkout by Stripe".
   6. Troque "checkoutOpen" para true e rode `npm test`.
   O teste valida os dois estados e falha se config, fallback ou texto de
   status divergirem. Enquanto checkoutOpen for false, as URLs ficam vazias.

   ESTADO EM 2026-08-06: checkoutOpen continua FALSE e os links ficam fora
   desta configuracao publica. O worker que concede os cargos (repo
   blockyfy-gate) ja esta publicado, e o endpoint Stripe ouve os cinco eventos
   esperados. Cole as URLs e ligue checkoutOpen somente depois de um teste
   controlado do fluxo completo passar.
   ========================================================================= */

window.BLOCKYFY_PAYMENTS = {
  provider: "stripe",

  /* Trava comercial independente do flag de cada projeto. A identificacao
     publica minima usa o nome comercial Blockyfy e contact@blockyfy.net. Mesmo
     com URL valida e checkoutOpen=true, checkout.js nao publica o link enquanto
     a politica de reembolso nao tiver aprovacao explicita. */
  commercialReadiness: {
    providerIdentityComplete: true,
    refundPolicyApproved: true
  },

  projects: {
    /* Studio-wide membership: one price unlocks the perks of every
       Blockyfy project, current and future. Rendered on the home page. */
    "blockyfy": {
      accent: "green",
      checkoutOpen: false,
      note: "One membership for the whole studio. Every current and future project is included. Discord perks require joining our server and completing one-time verification.",
      tiers: [
        {
          id: "blockyfy-global",
          name: "Blockyfy Supporter",
          price: "USD $30",
          period: "/month",
          tagline: "Back the whole studio, not just one game.",
          perks: [
            "Every perk from every Blockyfy project, current and future",
            "All-access supporter role on Discord",
            "Early access builds and closed betas across all games",
            "A vote on every project roadmap",
            "Highlighted name in the studio credits"
          ],
          checkoutUrl: "",
          featured: true,
          splash: "All Access!"
        }
      ]
    },

    "dragon-block-galactic": {
      accent: "gold",
      /* URLs ficam vazias enquanto o checkout estiver fechado. Ver a nota
         no topo do arquivo antes de reabrir. */
      checkoutOpen: false,
      note: "The mod is free and will remain free. Supporting funds development and unlocks only the perks listed for the selected plan. Discord perks require joining our server and completing one-time verification.",
      tiers: [
        {
          id: "warrior",
          name: "Warrior",
          price: "USD $4",
          period: "/month",
          tagline: "Stand with the project.",
          perks: [
            "Supporter role on Discord",
            "Behind the scenes dev logs",
            "Your name in the supporter credits"
          ],
          checkoutUrl: "",
          featured: false
        },
        {
          id: "super-warrior",
          name: "Super Warrior",
          price: "USD $12",
          period: "/month",
          tagline: "Fight on the front line.",
          perks: [
            "Everything in Warrior",
            "Early access builds before public release",
            "Closed beta invitations",
            "Vote on the development roadmap"
          ],
          checkoutUrl: "",
          featured: true
        },
        {
          id: "legendary",
          name: "Legendary",
          price: "USD $20",
          period: "/month",
          tagline: "Legends fund legends.",
          perks: [
            "Everything in Super Warrior",
            "Priority feature suggestions",
            "Legendary role and highlighted credits"
          ],
          checkoutUrl: "",
          featured: false
        }
      ]
    },

    "blocky-studio": {
      accent: "green",
      checkoutOpen: false,
      note: "Supporting funds development. Selected plans include early builds only when that benefit is listed.",
      tiers: [
        {
          id: "builder",
          name: "Builder",
          price: "USD $4",
          period: "/month",
          tagline: "Help us build the builder.",
          perks: [
            "Supporter role on Discord",
            "Behind the scenes dev logs",
            "Your name in the credits"
          ],
          checkoutUrl: "",
          featured: false
        },
        {
          id: "architect",
          name: "Architect",
          price: "USD $9",
          period: "/month",
          tagline: "Shape the tool you build with.",
          perks: [
            "Everything in Builder",
            "Early builds of every release",
            "Vote on the feature roadmap",
            "Priority support"
          ],
          checkoutUrl: "",
          featured: true
        }
      ]
    }
  }
};
