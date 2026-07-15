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
    "dragon-block-galactic": {
      accent: "gold",
      /* Pagamentos PAUSADOS enquanto o CNPJ da Blockyfy esta em criacao.
         Pra reabrir, troque checkoutOpen pra true (as URLs continuam abaixo). */
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
          checkoutUrl: "https://buy.stripe.com/6oU8wO6dpdQV4D11np1Jm00",
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
          checkoutUrl: "https://buy.stripe.com/8x2fZg9pBeUZ1qPd671Jm01",
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
          checkoutUrl: "https://buy.stripe.com/bJe8wO0T59AF5H56HJ1Jm02",
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
