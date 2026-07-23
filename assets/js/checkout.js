/* Blockyfy site - renders supporter tiers from payments.config.js.
   A container declares which project it wants:
     <div class="tiers" data-tiers="dragon-block-galactic"></div>
   Tiers with a checkoutUrl become live "Subscribe" links (Stripe Payment
   Links). Tiers without one render a disabled "Opening soon" button.
   A project with checkoutOpen: false renders every tier as disabled,
   keeping the URLs in the config for when payments reopen. */
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

  document.querySelectorAll("[data-tiers]").forEach(function (mount) {
    var project = cfg.projects[mount.getAttribute("data-tiers")];
    if (!project) return;

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

      if (project.checkoutOpen !== false && tier.checkoutUrl) {
        var link = el("a", "btn", "Subscribe");
        link.href = tier.checkoutUrl;
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
    if (note && project.note) {
      var msg = el("span", null, project.note + " ");
      note.insertBefore(msg, note.firstChild);
    }
  });
})();
