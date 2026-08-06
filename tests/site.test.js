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

function renderProject(project) {
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
      BLOCKYFY_PAYMENTS: { projects: { "test-project": project } }
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
      price: "$10",
      period: "/month",
      perks: ["One perk"],
      checkoutUrl: "https://buy.stripe.com/example"
    }],
    ...overrides
  };
}

test("payment configuration is explicitly closed and publishes no checkout URLs", () => {
  const config = loadPaymentsConfig();
  for (const [projectId, configuredProject] of Object.entries(config.projects)) {
    assert.equal(configuredProject.checkoutOpen, false, `${projectId} must fail closed`);
    for (const tier of configuredProject.tiers) {
      assert.equal(tier.checkoutUrl, "", `${projectId}/${tier.id} must not publish a closed URL`);
    }
  }
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
  assert.match(homeFallback[1], /Opening soon/);

  const projectFallback = projectPage.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(projectFallback);
  for (const tier of config.projects["dragon-block-galactic"].tiers) {
    assert.ok(projectFallback[1].includes(tier.name), tier.name);
    assert.ok(projectFallback[1].includes(tier.price), tier.price);
  }
  assert.match(projectFallback[1], /Opening soon/);

  assert.match(home, /Subscriptions are not open yet\./);
  assert.match(projectPage, /Subscriptions are not open yet\./);
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
  const htmlFiles = ["index.html", "projects/dragon-block-galactic.html", "404.html"];
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
