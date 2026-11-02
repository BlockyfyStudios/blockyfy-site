window.BLOCKYFY_PAYMENTS = {
  provider: "stripe",

  commercialReadiness: {
    providerIdentityComplete: true,
    refundPolicyApproved: true
  },

  projects: {
    "blockyfy": {
      accent: "green",
      checkoutOpen: true,
      note: "Early-access builds, closed betas and other protected benefits require joining the Blockyfy Discord server and completing one-time verification. A Minecraft username alone does not unlock access. The first protected Minecraft login proves the official account with Mojang and links its UUID automatically.",
      tiers: [
        {
          id: "blockyfy-global",
          name: "Blockyfy Supporter",
          price: "USD $30",
          period: "/month",
          tagline: "For players who want it all.",
          access: { included: true, label: "Includes early access to every game" },
          perks: [
            "Every perk from every Blockyfy project, current and future",
            "All-access supporter role on Discord",
            "Closed betas for every game",
            "A vote on every project roadmap",
            "Highlighted name in the studio credits"
          ],
          checkoutUrl: "https://buy.stripe.com/aFacN5bDsfu60Wv0Da53O00",
          featured: true,
          splash: "All access"
        }
      ]
    },

    "dragon-block-galactic": {
      accent: "gold",
      checkoutOpen: true,
      note: "Early-access builds, closed betas and other protected benefits require joining the Blockyfy Discord server and completing one-time verification. A Minecraft username alone does not unlock access. The first protected Minecraft login proves the official account with Mojang and links its UUID automatically.",
      tiers: [
        {
          id: "warrior",
          name: "Warrior",
          price: "USD $4",
          period: "/month",
          tagline: "Support the mod and follow its progress.",
          access: { included: false, label: "Doesn't include the game" },
          perks: [
            "Supporter role on Discord",
            "Behind-the-scenes dev logs",
            "Your name in the supporter credits"
          ],
          checkoutUrl: "https://buy.stripe.com/dRm28r9vkeq248H99G53O01",
          featured: false
        },
        {
          id: "super-warrior",
          name: "Super Warrior",
          price: "USD $12",
          period: "/month",
          tagline: "Play now and help steer the game.",
          access: { included: true, label: "Includes early access" },
          perks: [
            "Everything in Warrior",
            "Every new build, as soon as it's ready",
            "Closed beta invitations",
            "Vote on the development roadmap"
          ],
          checkoutUrl: "https://buy.stripe.com/4gM14n36W1Dg8oX3Pm53O02",
          featured: true,
          splash: "Recommended"
        },
        {
          id: "legendary",
          name: "Legendary",
          price: "USD $20",
          period: "/month",
          tagline: "Go all in on the mod.",
          access: { included: true, label: "Includes early access" },
          perks: [
            "Everything in Super Warrior",
            "Priority feature suggestions",
            "Legendary role and a highlighted name in the credits"
          ],
          checkoutUrl: "https://buy.stripe.com/8x2bJ1bDs2HkfRp2Li53O03",
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
            "Behind-the-scenes dev logs",
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
