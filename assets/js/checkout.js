(function () {
  "use strict";

  var cfg = window.BLOCKYFY_PAYMENTS;
  if (!cfg || !cfg.projects) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function commercialReady(config) {
    var readiness = config.commercialReadiness;
    return !!readiness &&
      readiness.providerIdentityComplete === true &&
      readiness.refundPolicyApproved === true;
  }

  function stripeCheckoutUrl(config, project, tier) {
    if (!commercialReady(config)) return "";
    if (project.checkoutOpen !== true || !tier.checkoutUrl) return "";

    try {
      var url = new URL(tier.checkoutUrl);
      if (url.protocol !== "https:" || url.hostname !== "buy.stripe.com") return "";
      if (url.username || url.password || url.port) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  document.querySelectorAll("[data-tiers]").forEach(function (mount) {
    var project = cfg.projects[mount.getAttribute("data-tiers")];
    if (!project) return;

    var hasOpenCheckout = false;

    project.tiers.forEach(function (tier) {
      var card = el("article", "tier" + (tier.featured ? " featured" : ""));

      if (tier.featured) card.appendChild(el("span", "splash", tier.splash || "Early Access!"));

      card.appendChild(el("h3", null, tier.name));
      if (tier.tagline) card.appendChild(el("p", "tagline", tier.tagline));

      var price = el("div", "price", tier.price);
      var period = el("small", null, tier.period || "");
      price.appendChild(period);
      card.appendChild(price);

      var list = el("ul");
      (tier.perks || []).forEach(function (perk) {
        list.appendChild(el("li", null, perk));
      });
      card.appendChild(list);

      var checkoutUrl = stripeCheckoutUrl(cfg, project, tier);
      if (checkoutUrl) {
        hasOpenCheckout = true;
        var link = el("a", "btn", "Subscribe");
        link.href = checkoutUrl;
        link.target = "_blank";
        link.rel = "noopener";
        card.appendChild(link);
      } else {
        var btn = el("button", "btn soon", "Opening soon");
        btn.disabled = true;
        btn.title = "Subscriptions are not open yet. Follow us to know when they are.";
        card.appendChild(btn);
      }

      mount.appendChild(card);
    });

    var note = mount.parentElement && mount.parentElement.querySelector(".tiers-note");
    if (note) {
      var status = hasOpenCheckout
        ? "Secure checkout by Stripe. Cancel anytime from the customer portal."
        : "Subscriptions are not open yet.";
      note.textContent = (project.note ? project.note + " " : "") + status;
    }
  });
})();
