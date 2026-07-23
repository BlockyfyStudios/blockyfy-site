/* =========================================================================
   BLOCKYFY - CONFIGURACAO DE PAGAMENTOS
   =========================================================================
   Este arquivo e a UNICA fonte de verdade dos planos de assinatura.
   As paginas dos projetos leem daqui e montam os cards sozinhas.

   COMO ATIVAR OS PAGAMENTOS (Stripe):
   1. Crie os produtos/precos no Stripe Dashboard (veja o README.md).
   2. Gere um Payment Link para cada tier.
   3. Cole a URL no campo "checkoutUrl" do tier correspondente.
   Enquanto checkoutUrl estiver vazio, o botao aparece como "Em breve".
   ========================================================================= */

window.BLOCKYFY_PAYMENTS = {
  provider: "stripe",

  projects: {
    /* Studio-wide membership: one price unlocks the perks of every
       Blockyfy project, current and future. Rendered on the home page. */
    "blockyfy": {
      accent: "green",
      checkoutOpen: false,
      note: "One membership for the whole studio. Every current and future project is included.",
      tiers: [
        {
          id: "blockyfy-global",
          name: "Blockyfy Supporter",
          price: "$30",
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
      /* Pagamentos PAUSADOS enquanto o CNPJ da Blockyfy esta em criacao.
         Pra reabrir: troque checkoutOpen pra true e cole as URLs dos
         Payment Links nos campos checkoutUrl (guardadas fora do repo). */
      checkoutOpen: false,
      note: "The mod is free and will remain free. Supporting funds development and unlocks perks.",
      tiers: [
        {
          id: "warrior",
          name: "Warrior",
          price: "$4",
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
          price: "$12",
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
          price: "$20",
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
      note: "Supporting funds development and gets you builds ahead of everyone else.",
      tiers: [
        {
          id: "builder",
          name: "Builder",
          price: "$4",
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
          price: "$9",
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
