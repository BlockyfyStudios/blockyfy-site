const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function loadPaymentsConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(read("payments.config.js"), sandbox, {
    filename: "payments.config.js"
  });
  return sandbox.window.BLOCKYFY_PAYMENTS;
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.className = "";
    this.textContent = "";
    this.parentElement = null;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, before) {
    child.parentElement = this;
    const index = before ? this.children.indexOf(before) : -1;
    if (index >= 0) this.children.splice(index, 0, child);
    else this.children.unshift(child);
    return child;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }
}

function descendantsByTag(element, tagName) {
  const expected = tagName.toUpperCase();
  const matches = [];
  for (const child of element.children) {
    if (child.tagName === expected) matches.push(child);
    matches.push(...descendantsByTag(child, tagName));
  }
  return matches;
}

function renderProject(project, commercialReadiness = {
  providerIdentityComplete: true,
  refundPolicyApproved: true
}) {
  const mount = new FakeElement("div");
  mount.attributes["data-tiers"] = "test-project";
  const note = new FakeElement("p");
  const parent = new FakeElement("section");
  parent.querySelector = (selector) => selector === ".tiers-note" ? note : null;
  mount.parentElement = parent;

  const document = {
    createElement: (tagName) => new FakeElement(tagName),
    querySelectorAll: (selector) => selector === "[data-tiers]" ? [mount] : []
  };
  const sandbox = {
    document,
    URL,
    window: {
      BLOCKYFY_PAYMENTS: {
        commercialReadiness,
        projects: { "test-project": project }
      }
    }
  };

  vm.runInNewContext(read("assets/js/checkout.js"), sandbox, {
    filename: "assets/js/checkout.js"
  });
  return { mount, note };
}

function project(overrides = {}) {
  return {
    checkoutOpen: false,
    note: "Project note.",
    tiers: [{
      id: "supporter",
      name: "Supporter",
      price: "USD $10",
      period: "/month",
      perks: ["One perk"],
      checkoutUrl: "https://buy.stripe.com/example"
    }],
    ...overrides
  };
}

function validStripeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "buy.stripe.com" &&
      !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

test("payment configuration supports closed and open states without weakening fail-closed behavior", () => {
  const config = loadPaymentsConfig();
  assert.equal(typeof config.commercialReadiness.providerIdentityComplete, "boolean");
  assert.equal(typeof config.commercialReadiness.refundPolicyApproved, "boolean");

  for (const [projectId, configuredProject] of Object.entries(config.projects)) {
    assert.equal(typeof configuredProject.checkoutOpen, "boolean", `${projectId} needs an explicit state`);
    for (const tier of configuredProject.tiers) {
      assert.match(tier.price, /^USD \$\d+$/, `${projectId}/${tier.id} must name USD explicitly`);
      if (configuredProject.checkoutOpen) {
        assert.ok(validStripeCheckoutUrl(tier.checkoutUrl), `${projectId}/${tier.id} needs a valid Stripe URL when open`);
      } else {
        assert.equal(tier.checkoutUrl, "", `${projectId}/${tier.id} must not publish a closed URL`);
      }
    }
  }
  const commerciallyReady = config.commercialReadiness.providerIdentityComplete === true &&
    config.commercialReadiness.refundPolicyApproved === true;
  if (!commerciallyReady) {
    for (const [projectId, configuredProject] of Object.entries(config.projects)) {
      assert.equal(configuredProject.checkoutOpen, false, `${projectId} cannot open before commercial readiness`);
      for (const tier of configuredProject.tiers) assert.equal(tier.checkoutUrl, "", `${projectId}/${tier.id} cannot expose a URL before commercial readiness`);
    }
  }
  assert.equal(config.projects["blocky-studio"].checkoutOpen, false, "unreleased Blocky Studio must stay closed");
  for (const tier of config.projects["blocky-studio"].tiers) assert.equal(tier.checkoutUrl, "");
  assert.doesNotMatch(read("payments.config.js"), /README\.md/);
});

test("checkout renders only for explicit true and an exact Stripe HTTPS host", () => {
  for (const checkoutOpen of [undefined, false]) {
    const { mount } = renderProject(project({ checkoutOpen }));
    assert.equal(descendantsByTag(mount, "a").length, 0);
    assert.equal(descendantsByTag(mount, "button").length, 1);
  }

  for (const checkoutUrl of [
    "http://buy.stripe.com/example",
    "https://buy.stripe.com.evil.example/example",
    "https://evil.example/example",
    "not a URL"
  ]) {
    const { mount } = renderProject(project({ checkoutOpen: true, tiers: [{
      id: "supporter",
      name: "Supporter",
      price: "$10",
      checkoutUrl
    }] }));
    assert.equal(descendantsByTag(mount, "a").length, 0, checkoutUrl);
  }

  const { mount } = renderProject(project({ checkoutOpen: true }));
  const links = descendantsByTag(mount, "a");
  assert.equal(links.length, 1);
  assert.equal(links[0].href, "https://buy.stripe.com/example");
  assert.equal(links[0].target, "_blank");
  assert.equal(links[0].rel, "noopener");
});

test("commercial readiness blocks checkout even when a project and URL are open", () => {
  const openProject = project({ checkoutOpen: true });
  for (const readiness of [
    null,
    {},
    { providerIdentityComplete: true, refundPolicyApproved: false },
    { providerIdentityComplete: false, refundPolicyApproved: true }
  ]) {
    const { mount } = renderProject(openProject, readiness);
    assert.equal(descendantsByTag(mount, "a").length, 0);
    assert.equal(descendantsByTag(mount, "button").length, 1);
  }

  const ready = renderProject(openProject, {
    providerIdentityComplete: true,
    refundPolicyApproved: true
  });
  assert.equal(descendantsByTag(ready.mount, "a").length, 1);
});

test("checkout note reflects the effective open or closed state", () => {
  const closed = renderProject(project());
  assert.equal(closed.note.textContent, "Project note. Subscriptions are not open yet.");

  const invalid = renderProject(project({
    checkoutOpen: true,
    tiers: [{ name: "Supporter", price: "$10", checkoutUrl: "https://evil.example" }]
  }));
  assert.equal(invalid.note.textContent, "Project note. Subscriptions are not open yet.");

  const open = renderProject(project({ checkoutOpen: true }));
  assert.equal(open.note.textContent, "Project note. Secure checkout by Stripe. Cancel anytime from the customer portal.");
});

test("pages retain plan information and navigation without JavaScript", () => {
  const config = loadPaymentsConfig();
  const home = read("index.html");
  const projectPage = read("projects/dragon-block-galactic.html");

  assert.equal((home.match(/<h1\b/g) || []).length, 1);
  assert.match(home, /<h1 class="sr-only">Blockyfy \| Independent Game Studio<\/h1>/);
  assert.doesNotMatch(home, /document\.documentElement\.className/);
  assert.doesNotMatch(projectPage, /document\.documentElement\.className/);

  const homeFallback = home.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(homeFallback);
  for (const tier of config.projects.blockyfy.tiers) {
    assert.ok(homeFallback[1].includes(tier.name), tier.name);
    assert.ok(homeFallback[1].includes(tier.price), tier.price);
  }
  const commerciallyReady = config.commercialReadiness.providerIdentityComplete === true &&
    config.commercialReadiness.refundPolicyApproved === true;
  const homeOpen = commerciallyReady && config.projects.blockyfy.checkoutOpen;
  if (homeOpen) {
    assert.doesNotMatch(homeFallback[1], /Opening soon/);
    for (const tier of config.projects.blockyfy.tiers) assert.ok(homeFallback[1].includes(`href="${tier.checkoutUrl}"`));
    assert.match(home, /Secure checkout by Stripe/);
  } else {
    assert.equal((homeFallback[1].match(/data-checkout-state="closed"/g) || []).length, config.projects.blockyfy.tiers.length);
    assert.doesNotMatch(homeFallback[1], /href="https:\/\/buy\.stripe\.com/);
    assert.match(home, /Subscriptions are not open yet\./);
  }

  const projectFallback = projectPage.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(projectFallback);
  for (const tier of config.projects["dragon-block-galactic"].tiers) {
    assert.ok(projectFallback[1].includes(tier.name), tier.name);
    assert.ok(projectFallback[1].includes(tier.price), tier.price);
  }
  const projectOpen = commerciallyReady && config.projects["dragon-block-galactic"].checkoutOpen;
  if (projectOpen) {
    assert.doesNotMatch(projectFallback[1], /Opening soon/);
    for (const tier of config.projects["dragon-block-galactic"].tiers) assert.ok(projectFallback[1].includes(`href="${tier.checkoutUrl}"`));
    assert.match(projectPage, /Secure checkout by Stripe/);
  } else {
    assert.equal((projectFallback[1].match(/data-checkout-state="closed"/g) || []).length, config.projects["dragon-block-galactic"].tiers.length);
    assert.doesNotMatch(projectFallback[1], /href="https:\/\/buy\.stripe\.com/);
    assert.match(projectPage, /Subscriptions are not open yet\./);
  }
});

test("sales pages disclose currency, fulfillment steps and every commercial policy", () => {
  const pages = [read("index.html"), read("projects/dragon-block-galactic.html")];
  for (const page of pages) {
    assert.match(page, /recurring monthly charges in USD/);
    assert.match(page, /actual Discord username \(not your display name\)/);
    assert.match(page, /allow direct messages from server members/);
    assert.match(page, /one-time verification link/);
    for (const policy of ["terms", "privacy", "refunds", "fulfillment"]) {
      assert.match(page, new RegExp(`href="/legal/${policy}"`));
    }
  }
  assert.match(pages[0], /Every public release is free to play/);
  assert.doesNotMatch(pages[0], /Everything we release is free to play/);
  const projectPage = pages[1];
  assert.doesNotMatch(projectPage, /granted automatically/i);
  assert.doesNotMatch(projectPage, /Supporters follow progress from the inside and try builds first/i);
  assert.match(projectPage, /trying builds before public release is limited to plans that explicitly include early access/i);
  assert.match(projectPage, /Minecraft username field is optional/);

  const config = loadPaymentsConfig();
  const warrior = config.projects["dragon-block-galactic"].tiers.find((tier) => tier.id === "warrior");
  assert.ok(warrior);
  assert.doesNotMatch(warrior.perks.join(" "), /beta|early access/i);
  assert.match(config.projects["blocky-studio"].note, /Selected plans include early builds only when that benefit is listed/);
});

test("commercial readiness matches the published provider identity and approved refund policy", () => {
  const config = loadPaymentsConfig();
  const terms = read("legal/terms.html");
  const refunds = read("legal/refunds.html");
  assert.equal(config.commercialReadiness.providerIdentityComplete, true);
  assert.match(terms, /<strong>Commercial name:<\/strong> Blockyfy/);
  assert.match(terms, /contact@blockyfy\.net/);
  assert.doesNotMatch(terms, /data-provider-identity-pending|legal operator name|business postal address|tax registration number/i);
  assert.equal(config.commercialReadiness.refundPolicyApproved, !refunds.includes("data-refund-policy-pending"));
  assert.equal(config.commercialReadiness.refundPolicyApproved, true);
  assert.doesNotMatch(refunds, /Draft — owner approval required before sales open/);
});

test("legal page footers use the three-column desktop grid with responsive overrides", () => {
  const legalPages = ["terms", "privacy", "refunds", "fulfillment"].map((name) => read(`legal/${name}.html`));
  for (const page of legalPages) assert.match(page, /class="wrap foot-grid legal-foot-grid"/);

  const css = read("assets/css/landing.css");
  assert.match(css, /\.foot-grid\.legal-foot-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1\.6fr\) repeat\(2,/);
  assert.match(css, /\.foot-grid, \.foot-grid\.legal-foot-grid\s*\{\s*grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.foot-grid, \.foot-grid\.legal-foot-grid\s*\{\s*grid-template-columns:\s*1fr;/);
});

test("customer portal is public, consistent and restricted to Stripe Billing", () => {
  const pages = [read("index.html"), read("projects/dragon-block-galactic.html")];
  const portalUrls = [];

  for (const page of pages) {
    const links = [...page.matchAll(/<a\s+([^>]*href="([^"]+)"[^>]*)>/g)]
      .filter((match) => match[2].includes("billing.stripe.com"));
    assert.ok(links.length >= 1, "each sales page must expose the customer portal without JavaScript");

    for (const [, attributes, href] of links) {
      const url = new URL(href);
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, "billing.stripe.com");
      assert.match(url.pathname, /^\/p\/login\/[A-Za-z0-9]+$/);
      assert.match(attributes, /target="_blank"/);
      assert.match(attributes, /rel="noopener noreferrer"/);
      portalUrls.push(url.href);
    }
  }

  assert.equal(new Set(portalUrls).size, 1, "all portal links must use the same Stripe configuration");
});

test("progressive enhancement classes cannot hide content before initialization", () => {
  const css = read("assets/css/landing.css");
  const javascript = read("assets/js/landing.js");

  assert.doesNotMatch(css, /\.js \.rise/);
  assert.match(css, /\.reveal-ready \.rise/);
  assert.match(css, /\.nav-ready \.head-nav/);
  assert.match(css, /\.nav-ready \.burger/);
  assert.match(css, /scroll-padding-top:\s*80px/);
  assert.match(javascript, /classList\.add\("nav-ready"\)/);
  assert.match(javascript, /classList\.add\("reveal-ready"\)/);
});

test("all local HTML references resolve", () => {
  const htmlFiles = [
    "index.html",
    "projects/dragon-block-galactic.html",
    "legal/terms.html",
    "legal/privacy.html",
    "legal/refunds.html",
    "legal/fulfillment.html",
    "404.html"
  ];
  const missing = [];

  for (const htmlFile of htmlFiles) {
    const html = read(htmlFile);
    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
      references.push(...match[1].split(",").map((candidate) => candidate.trim().split(/\s+/)[0]));
    }

    for (const reference of references) {
      if (/^(?:https?:|mailto:|data:|#)/.test(reference)) continue;
      const clean = reference.split(/[?#]/)[0];
      let candidate;
      if (clean === "/") candidate = path.join(root, "index.html");
      else if (clean.startsWith("/")) candidate = path.join(root, clean.slice(1));
      else candidate = path.resolve(path.dirname(path.join(root, htmlFile)), clean);

      const exists = fs.existsSync(candidate) ||
        (!path.extname(candidate) && fs.existsSync(`${candidate}.html`));
      if (!exists) missing.push(`${htmlFile} -> ${reference}`);
    }
  }

  assert.deepEqual(missing, []);
});
