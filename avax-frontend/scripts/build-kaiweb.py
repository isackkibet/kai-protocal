#!/usr/bin/env python3
"""
Builds the KAI website (public/kaiweb/*.html) from the short content below.

Every page uses the same layout: menu, top section, a few short blocks,
a call to action and the footer. To change words, edit PAGES and run:

    python3 scripts/build-kaiweb.py

Styles: public/kaiweb/css/kai.css   Menu script: public/kaiweb/js/site.js
Block types: cards, steps, compare, stats, table, list, note.
"""
import html
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "kaiweb")
APP = "/"  # "Open the app" goes back to the KAI app

LEARN = [
    ("index.html", "Home", "Start here"),
    ("problems.html", "The problem", "Why finance must change"),
    ("solution.html", "Our solution", "How KAI fixes it"),
    ("DAO.html", "DAO", "How the community decides"),
    ("bizcanvas.html", "Business model", "How KAI works as a business"),
]
PRODUCTS = [
    ("products.html", "All products", "Everything KAI offers"),
    ("insurance.html", "Insurance", "Savings that pay your cover"),
    ("pension.html", "Pension", "Save for later, your way"),
    ("trust.html", "Trust", "Pass wealth on by clear rules"),
    ("tokens.html", "Tokens", "Six tokens, one job each"),
    ("ecosystem.html", "Ecosystem", "How it all fits together"),
]

E = html.escape

# ─────────────────────────── content ───────────────────────────
PAGES = {
    "index.html": {
        "title": "KAI — Banking for everyone, on Avalanche",
        "desc": "Save, invest, insure and pass on wealth from your phone, with low fees.",
        "eyebrow": "KAI · Built on Avalanche",
        "h1": "Banking for everyone, built on Avalanche.",
        "lead": "Save, invest, insure and pass on wealth from your phone, with tiny fees.",
        "cta2": ("solution.html", "See how it works"),
        "blocks": [
            {"type": "stats", "title": "Why KAI is needed", "items": [
                ("57%", "of adults in Sub-Saharan Africa have no bank account"),
                ("$330B+", "yearly funding gap for small businesses"),
                ("8%+", "average fee to send money within Africa"),
                ("<3%", "have any insurance at all"),
            ]},
            {"type": "cards", "title": "What you can do with KAI", "intro": "Six tools that work together.", "items": [
                ("Grow your savings", "Vaults earn for you automatically.", "products.html"),
                ("Save for later", "A pension you add to at your own pace.", "pension.html"),
                ("Get covered", "Your savings' earnings pay your insurance.", "insurance.html"),
                ("Protect your family", "Trusts that pay out by clear rules.", "trust.html"),
                ("Run your business", "Keep business cash safe from inflation.", "products.html"),
                ("Own real assets", "Land, timber and carbon credits, on-chain.", "products.html"),
            ]},
            {"type": "compare", "title": "The old way vs KAI", "items": [
                ("Bank", "Investment vault"),
                ("Pension fund", "Smart pension"),
                ("Insurance company", "Community insurance pool"),
                ("Trust lawyer", "KAI Trust"),
                ("Business bank account", "SME treasury"),
                ("Paper asset registry", "Tokenized assets"),
            ]},
            {"type": "cards", "title": "Who it is for", "items": [
                ("Small businesses", "Protect cash and get credit from real sales."),
                ("Groups", "Chamas, SACCOs and forest associations with clear, shared rules."),
                ("Everyday savers", "Use it on a smartphone, or by USSD on any phone."),
            ]},
            {"type": "steps", "title": "Roadmap", "label": "Phase", "items": [
                ("Foundation · Q2–Q3 2026", "Vaults, YToken and CENTS, mobile and USSD beta, security audit."),
                ("Expansion · Q4 2026–Q1 2027", "Pensions, insurance pilots, KAI Trust, stable token."),
                ("Business & assets · Q2–Q3 2027", "Business credit lines, tokenized land and carbon, YGOLD."),
            ]},
        ],
    },
    "problems.html": {
        "title": "The problem — KAI",
        "desc": "People work hard, but today's finance does not help them build wealth.",
        "eyebrow": "The problem",
        "h1": "People work hard. The system doesn't help them build wealth.",
        "lead": "Payments move money, then stop. Nothing grows and nothing is protected.",
        "cta2": ("solution.html", "See our solution"),
        "blocks": [
            {"type": "cards", "title": "Four big gaps", "items": [
                ("Payments don't build wealth", "Money arrives and sits. Savings, insurance and pensions live in separate apps."),
                ("Made for one person, not groups", "Chamas, SACCOs and forest groups still run on paper books."),
                ("Valuable assets stay locked", "Sales records and forest work don't count when you need a loan."),
                ("Crypto is too hard", "Seed phrases and gas fees keep most people out."),
            ]},
            {"type": "cards", "title": "Who pays the price", "items": [
                ("Small businesses", "Real sales every day, but no credit."),
                ("Forest associations", "Protect forests, yet depend on grants."),
                ("Chamas and SACCOs", "Big savings, eaten by inflation and fraud risk."),
                ("Young Africans", "Ready for digital finance, shut out by how hard it is."),
            ]},
            {"type": "stats", "title": "The damage", "items": [
                ("57%", "of adults have no bank account"),
                ("10%+", "yearly inflation in many markets eats savings"),
                ("$330B+", "missing every year for small businesses"),
            ]},
            {"type": "note", "text": "The real problem: today's finance records what people do, but never turns it into lasting wealth."},
        ],
    },
    "solution.html": {
        "title": "Our solution — KAI",
        "desc": "KAI moves value the way roads move people.",
        "eyebrow": "Our solution",
        "h1": "Roads move people. KAI moves value.",
        "lead": "One system that saves, protects and grows what you own, automatically.",
        "cta2": ("products.html", "See the products"),
        "blocks": [
            {"type": "cards", "title": "What counts as value", "intro": "More than cash.", "items": [
                ("Savings", "Stable coins and savings that earn, open 24/7."),
                ("Nature", "Carbon credits and protected forest land."),
                ("Trusts and pensions", "Plans for later that run by themselves."),
                ("Real assets", "Shares of land, gold, equipment or invoices."),
                ("Group money", "Shared pools that members control together."),
                ("Reputation", "A track record you can prove on-chain."),
            ]},
            {"type": "compare", "title": "What KAI replaces", "items": [
                ("Bank account · lots of paperwork", "Vault that pays out by rules"),
                ("Insurance company · disputed claims", "Pool that pays when the data says so"),
                ("Legal escrow · expensive", "Trust engine with time-locked payments"),
                ("Bank wire · 3–5 days", "Settled in seconds, no middleman"),
            ]},
        ],
    },
    "products.html": {
        "title": "Products — KAI",
        "desc": "Everything KAI offers, in one place.",
        "eyebrow": "Products",
        "h1": "Everything KAI offers, in one place.",
        "lead": "Pick what you need. Each product works with the others.",
        "cta2": ("ecosystem.html", "How it fits together"),
        "blocks": [
            {"type": "cards", "title": "Products", "items": [
                ("Insurance", "Your savings' earnings pay your premium.", "insurance.html"),
                ("Pension", "Save any amount, any time, for later.", "pension.html"),
                ("Trust", "Pass wealth to family by clear rules.", "trust.html"),
                ("Savings vaults", "Put tokens in, earn a yearly rate, take out any time.", None),
                ("SME treasury", "Business cash that keeps its value.", None),
                ("Tokenize assets", "Put land, timber or carbon credits on-chain.", None),
            ]},
            {"type": "cards", "title": "How money moves", "items": [
                ("Automatic payments", "Say the goal, like \"save 10% of every payment\". KAI does it."),
                ("M-Pesa in and out", "Put in shillings, and take your earnings back to M-Pesa."),
                ("Machine payments (x402)", "Apps and services pay each other, with a full record."),
            ]},
            {"type": "cards", "title": "Why it is built this way", "items": [
                ("Insurance paid by earnings", "Not by your monthly income."),
                ("A truly stable coin", "NUVARI STABLE is backed 150% by USDC."),
                ("Payments always arrive", "On-chain, or through M-Pesa and banks."),
            ]},
        ],
    },
    "insurance.html": {
        "title": "Insurance — KAI",
        "desc": "Let your savings pay your insurance.",
        "eyebrow": "KAI Insurance",
        "h1": "Let your savings pay your insurance.",
        "lead": "Put tokens to work. What they earn pays your premium to a licensed insurer.",
        "blocks": [
            {"type": "note", "text": "KAI is not an insurance company. Your policy always stays with a licensed insurer."},
            {"type": "steps", "title": "How it works", "items": [
                ("Choose your cover", "Health, motor, business, property, life or farm, from a licensed partner."),
                ("Put in tokens", "They stay yours."),
                ("KAI works out the amount", "Riskier cover needs more savings working for it."),
                ("Earnings pay the premium", "Automatically, with a record of every payment."),
                ("Grow over time", "As savings grow, more of the premium is covered."),
            ]},
            {"type": "stats", "title": "Your savings cover more each year", "note": "Example only. Depends on how the assets perform; not guaranteed.", "items": [
                ("10%", "of the premium in year 1"),
                ("35%", "in year 2"),
                ("60%", "in year 3"),
                ("100%", "from year 5"),
            ]},
            {"type": "cards", "title": "What you get", "items": [
                ("Licensed insurers", "KAI pays them; they cover you."),
                ("Your money stays yours", "Take it out any time. If it drops too low, you are warned before a payment is missed."),
                ("One pot, many policies", "One savings pot can pay several covers."),
                ("AI tips", "Help with saving and affordability, never with claims."),
            ]},
        ],
    },
    "pension.html": {
        "title": "Pension — KAI",
        "desc": "Build wealth while you work.",
        "eyebrow": "KAI Pension",
        "h1": "Build wealth while you work.",
        "lead": "Save any amount, whenever you have it. Plan with AI. Pass it on to your family.",
        "blocks": [
            {"type": "cards", "title": "Made for real life", "items": [
                ("Save any amount", "Regular or one-time, from you, your employer or your SACCO."),
                ("Pause and restart", "Life changes. Your plan stays open."),
                ("Plan with AI", "A plan built around your goals."),
                ("Stays balanced", "Your mix is adjusted over time."),
                ("Helps pay insurance", "Earnings can pay your KAI Insurance."),
                ("Passes to family", "Moves into a KAI Trust when the time comes."),
            ]},
            {"type": "list", "title": "Your retirement score", "intro": "One simple score shows if you are on track. It looks at:", "items": [
                "How much you have saved", "How regularly you save", "How your savings are growing",
                "Years until you retire", "Your insurance cover", "Your expected income",
            ]},
            {"type": "note", "text": "For everyone: employees, self-employed people, farmers, informal workers, SACCO members and families abroad. KAI works with licensed pension providers where the law requires."},
        ],
    },
    "trust.html": {
        "title": "Trust — KAI",
        "desc": "Protect your wealth and pass it on with confidence.",
        "eyebrow": "KAI Trust",
        "h1": "Protect your wealth. Pass it on with confidence.",
        "lead": "Set the rules once. Your wealth follows them, for your family and beyond.",
        "blocks": [
            {"type": "steps", "title": "How it works", "items": [
                ("Create", "Start from a template: family, education, retirement, business or charity."),
                ("Set the rules", "Who gets what, and when."),
                ("Fund it", "Add savings, investments or tokenized assets."),
                ("It is managed", "Reports and AI insights; a licensed trustee where the law requires."),
                ("It pays out", "When the conditions happen, like a graduation or a date."),
            ]},
            {"type": "cards", "title": "Who is who", "items": [
                ("Trustor", "Creates and funds the trust, and sets the rules."),
                ("Trustee", "Runs it by the rules. Licensed where required."),
                ("Beneficiaries", "Family, children, charities or groups who receive it."),
                ("Enforcer (optional)", "Checks the trustee follows the rules."),
            ]},
            {"type": "cards", "title": "Built on five promises", "items": [
                ("Ownership", "Your assets follow your instructions."),
                ("Transparency", "Every action is recorded."),
                ("Security", "Strong cryptography protects records."),
                ("Compliance", "Works with licensed trust professionals."),
                ("Automation", "Less paperwork, fewer mistakes."),
            ]},
        ],
    },
    "tokens.html": {
        "title": "Tokens — KAI",
        "desc": "Six tokens, each with one job.",
        "eyebrow": "KAI tokens",
        "h1": "Six tokens. Each with one job.",
        "lead": "Keeping the jobs separate keeps the system safe and easy to check.",
        "blocks": [
            {"type": "table", "title": "The six tokens", "head": ("Token", "Its job", "Supply"), "rows": [
                ("NVR", "Votes on how KAI is run, and shares protocol fees", "50 million"),
                ("NUVARI STABLE", "Stable coin for payments, backed 150% by USDC", "Grows with use"),
                ("YTOKEN", "Savings fund spread across many earning assets", "2.1 billion"),
                ("YGOLD", "Safer savings backed by gold", "4.2 billion"),
                ("GAMI", "Rewards for good actions; never sold as an investment", "8.4 billion"),
                ("NUVARI CENTS", "Start saving with cents; pays network fees for you", "Grows with use"),
            ]},
            {"type": "cards", "title": "How they work together", "items": [
                ("Decide", "NVR holders vote on rules, fees and the treasury."),
                ("Save and grow", "YTOKEN and YGOLD earn in vaults."),
                ("Pay", "NUVARI STABLE and CENTS move money and cover fees."),
                ("Reward", "GAMI thanks people for saving, verifying and helping."),
            ]},
        ],
    },
    "ecosystem.html": {
        "title": "Ecosystem — KAI",
        "desc": "One platform for a lifetime of wealth.",
        "eyebrow": "Ecosystem",
        "h1": "One platform for a lifetime of wealth.",
        "lead": "Earn, invest, protect, retire and pass it on, all connected.",
        "cta2": ("products.html", "See the products"),
        "blocks": [
            {"type": "steps", "title": "One journey", "items": [
                ("Earn", "Money comes in from work or business."),
                ("Invest", "KAI Wealth puts it to work."),
                ("Protect", "Earnings pay your insurance."),
                ("Retire", "Your pension keeps growing."),
                ("Pass on", "A trust hands it to the next generation."),
            ]},
            {"type": "cards", "title": "The six parts", "items": [
                ("KAI Wealth", "The engine: savings that grow and power everything else."),
                ("KAI Insurance", "Cover paid by your earnings.", "insurance.html"),
                ("KAI Pension", "Flexible retirement savings.", "pension.html"),
                ("KAI Trust", "A digital family office.", "trust.html"),
                ("KAI Payments", "Automatic premiums, contributions and payouts."),
                ("KAI AI", "Your money assistant. You stay in control."),
            ]},
            {"type": "compare", "title": "Separate apps vs KAI", "items": [
                ("Investment apps: only returns", "KAI: returns that also protect you"),
                ("Insurers: only cover", "KAI: cover paid by your savings"),
                ("Pension funds: only retirement", "KAI: retirement that passes to family"),
                ("Banks: only banking", "KAI: all of it, working together"),
            ]},
        ],
    },
    "DAO.html": {
        "title": "DAO — KAI",
        "desc": "The community runs KAI.",
        "eyebrow": "KAI DAO",
        "h1": "The community runs KAI.",
        "lead": "Expert councils decide in their own area, under one shared constitution.",
        "blocks": [
            {"type": "cards", "title": "The councils", "items": [
                ("Assembly", "The top authority: the constitution and big upgrades."),
                ("Constitutional Council", "Protects the rules and settles disputes."),
                ("Treasury DAO", "Manages funds, budgets and reserves."),
                ("Risk DAO", "Sets safety limits for loans and reserves."),
                ("Product DAO", "Approves new savings, insurance and pension products."),
                ("Security DAO", "Audits, bug bounties and incident response."),
                ("Ecosystem DAO", "Grants, partners and education."),
                ("Investment DAO", "Long-term investments and reserves."),
                ("Governance DAO", "Voting rules and tools."),
            ]},
            {"type": "steps", "title": "How a decision is made", "items": [
                ("Discuss", "Ideas are shared openly first."),
                ("Review", "The right council checks safety and cost."),
                ("Feedback", "Everyone can comment."),
                ("Vote", "Token holders vote on-chain."),
                ("Do it", "Smart contracts or a multi-signature wallet carry it out."),
                ("Check", "Results are measured against the goal."),
            ]},
            {"type": "cards", "title": "Who gets a vote", "items": [
                ("Token holders", "Hold NVR to vote."),
                ("Delegates", "Give your vote to someone you trust and keep your tokens."),
                ("Stakers", "Locking tokens shows long-term commitment."),
                ("Contributors", "Real work can add weight where it applies."),
            ]},
            {"type": "note", "text": "Early contributors form a Genesis Council that gives advice only. It cannot override a community vote."},
        ],
    },
    "bizcanvas.html": {
        "title": "Business model — KAI",
        "desc": "How KAI works as a business.",
        "eyebrow": "Business model",
        "h1": "How KAI works as a business.",
        "lead": "Infrastructure that works with regulated partners, not against them.",
        "blocks": [
            {"type": "cards", "title": "What customers get", "items": [
                ("Save with any income", "Add small amounts whenever money comes in."),
                ("Beat inflation", "Savings go into products that keep their value."),
                ("Automate bills", "Premiums, pension and transfers pay themselves."),
                ("Retire without a formal job", "Pensions that fit irregular income."),
                ("Protect family wealth", "Trusts that follow clear rules."),
                ("One app for everything", "Savings, insurance, pension and trust together."),
            ]},
            {"type": "cards", "title": "Who we serve", "items": [
                ("Individuals", "Including traders, farmers and boda boda riders."),
                ("Employees", "Better long-term savings and retirement."),
                ("Small businesses", "Treasury, insurance and staff benefits."),
                ("Groups and SACCOs", "Clear, shared money rules."),
                ("Forest associations", "Fair pay for conservation work."),
                ("Institutions", "Insurers, pension managers and banks."),
            ]},
            {"type": "cards", "title": "How people reach us", "items": [
                ("App and web", "Do everything yourself."),
                ("USSD, SMS and WhatsApp", "Works on any phone."),
                ("Partners", "SACCOs, forest groups, employers and universities."),
                ("People", "AI help, plus a real team for complex cases."),
            ]},
            {"type": "cards", "title": "How KAI earns", "items": [
                ("Performance fees", "Only on earnings, never on your savings."),
                ("Payment fees", "Small fees for moving money."),
                ("Lending spreads", "From business credit lines."),
                ("Tokenization fees", "For putting assets on-chain."),
            ]},
        ],
    },
}

# ─────────────────────────── layout ───────────────────────────
CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'


def cur(f, page):
    return ' aria-current="page"' if f == page else ""


def menu(page):
    top = "".join(f'<a href="{f}"{cur(f, page)}>{l}</a>' for f, l in [("index.html", "Home"), ("problems.html", "Problem"), ("solution.html", "Solution")])
    drop = "".join(f'<a href="{f}"{cur(f, page)}><b>{l}</b><small>{h}</small></a>' for f, l, h in PRODUCTS)
    after = "".join(f'<a href="{f}"{cur(f, page)}>{l}</a>' for f, l in [("DAO.html", "DAO"), ("bizcanvas.html", "Business model")])
    on = " kw-on" if any(page == p[0] for p in PRODUCTS) else ""

    def items(lst):
        return "".join(f'<a class="kw-item" href="{f}"{cur(f, page)}><b>{l}</b><small>{h}</small></a>' for f, l, h in lst)

    return f'''<div class="kw-nav" role="banner">
  <div class="kw-nav-inner">
    <a class="kw-brand" href="index.html" aria-label="KAI home"><span class="kw-logo">K</span><span>KAI</span></a>
    <div class="kw-links" role="navigation" aria-label="Main">
      {top}
      <div class="kw-drop"><button type="button" class="kw-drop-btn{on}" aria-expanded="false" aria-haspopup="true">Products {CHEV}</button><div class="kw-drop-menu">{drop}</div></div>
      {after}
    </div>
    <a class="kw-cta" href="{APP}">Open the app</a>
    <button type="button" class="kw-burger" aria-label="Open menu" aria-expanded="false" aria-controls="kw-panel"><span></span><span></span><span></span></button>
  </div>
  <div class="kw-panel" id="kw-panel" hidden>
    <div class="kw-panel-inner">
      <div><h3>Learn about KAI</h3><div class="kw-panel-grid">{items(LEARN)}</div></div>
      <div><h3>Products</h3><div class="kw-panel-grid">{items(PRODUCTS)}</div></div>
      <a class="kw-cta" href="{APP}">Open the KAI app</a>
    </div>
  </div>
</div>'''


def block(b):
    t = b["type"]
    head = f'<h2>{E(b["title"])}</h2>' if b.get("title") else ""
    intro = f'<p class="k-intro">{E(b["intro"])}</p>' if b.get("intro") else ""
    if t == "cards":
        cards = []
        for it in b["items"]:
            title, text = it[0], it[1]
            href = it[2] if len(it) > 2 else None
            inner = f'<h3>{E(title)}</h3><p>{E(text)}</p>'
            if href:
                cards.append(f'<a class="k-card k-card--link" href="{href}">{inner}<span class="k-more">Learn more {ARROW}</span></a>')
            else:
                cards.append(f'<div class="k-card">{inner}</div>')
        cols = " k-cards--4" if len(b["items"]) in (4, 8) else ""
        return f'<section class="k-sec"><div class="k-wrap">{head}{intro}<div class="k-cards{cols}">{"".join(cards)}</div></div></section>'
    if t == "steps":
        label = b.get("label", "Step")
        rows = "".join(f'<li><span class="k-step-n">{label} {i}</span><div><h3>{E(a)}</h3><p>{E(c)}</p></div></li>' for i, (a, c) in enumerate(b["items"], 1))
        return f'<section class="k-sec"><div class="k-wrap">{head}{intro}<ol class="k-steps">{rows}</ol></div></section>'
    if t == "compare":
        rows = "".join(f'<li><span class="k-old">{E(a)}</span><span class="k-arrow">{ARROW}</span><span class="k-new">{E(c)}</span></li>' for a, c in b["items"])
        return f'<section class="k-sec"><div class="k-wrap">{head}{intro}<ul class="k-compare">{rows}</ul></div></section>'
    if t == "stats":
        items = "".join(f'<div class="k-stat"><b>{E(n)}</b><span>{E(l)}</span></div>' for n, l in b["items"])
        note = f'<p class="k-small">{E(b["note"])}</p>' if b.get("note") else ""
        return f'<section class="k-sec k-sec--band"><div class="k-wrap">{head}{intro}<div class="k-stats">{items}</div>{note}</div></section>'
    if t == "table":
        th = "".join(f"<th>{E(h)}</th>" for h in b["head"])
        trs = "".join("<tr>" + "".join(f"<td>{E(c)}</td>" for c in r) + "</tr>" for r in b["rows"])
        return f'<section class="k-sec"><div class="k-wrap">{head}{intro}<div class="k-table"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div></div></section>'
    if t == "list":
        lis = "".join(f"<li>{E(x)}</li>" for x in b["items"])
        return f'<section class="k-sec"><div class="k-wrap">{head}{intro}<ul class="k-list">{lis}</ul></div></section>'
    if t == "note":
        return f'<section class="k-sec k-sec--tight"><div class="k-wrap"><p class="k-note">{E(b["text"])}</p></div></section>'
    raise ValueError(t)


def footer():
    learn = "".join(f'<li><a href="{f}">{l}</a></li>' for f, l, _ in LEARN)
    prods = "".join(f'<li><a href="{f}">{l}</a></li>' for f, l, _ in PRODUCTS)
    return f'''<footer class="k-foot">
  <div class="k-wrap k-foot-grid">
    <div class="k-foot-brand">
      <a class="kw-brand" href="index.html"><span class="kw-logo">K</span><span>KAI</span></a>
      <p>Banking for everyone, built on Avalanche.</p>
      <a class="kw-cta" href="{APP}">Open the app</a>
    </div>
    <div><h4>Learn</h4><ul>{learn}</ul></div>
    <div><h4>Products</h4><ul>{prods}</ul></div>
    <div><h4>Contact</h4><ul><li><a href="https://www.kai.bar" rel="noopener">www.kai.bar</a></li><li><a href="{APP}">KAI app</a></li><li><a href="/privacy">Privacy</a></li></ul></div>
  </div>
  <div class="k-wrap k-foot-bottom">
    <span>&copy; 2026 KAI Protocol · Built on Avalanche</span>
    <span>For information only, not financial advice. Digital assets can lose value.</span>
  </div>
</footer>'''


def page(name, p):
    cta2 = p.get("cta2")
    second = f'<a class="k-btn k-btn--ghost" href="{cta2[0]}">{E(cta2[1])}</a>' if cta2 else ""
    blocks = "\n".join(block(b) for b in p["blocks"])
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{E(p["title"])}</title>
  <meta name="description" content="{E(p["desc"])}">
  <link rel="icon" href="/icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="css/kai.css">
</head>
<body>
{menu(name)}
<main>
<section class="k-hero"><div class="k-wrap">
  <p class="k-eyebrow">{E(p["eyebrow"])}</p>
  <h1>{E(p["h1"])}</h1>
  <p class="k-lead">{E(p["lead"])}</p>
  <div class="k-btns"><a class="k-btn" href="{APP}">Open the app</a>{second}</div>
</div></section>
{blocks}
<section class="k-sec k-cta"><div class="k-wrap">
  <h2>Ready to start?</h2>
  <p>Open the KAI app and try it on the Avalanche test network. It is free.</p>
  <div class="k-btns"><a class="k-btn" href="{APP}">Open the app</a><a class="k-btn k-btn--ghost" href="products.html">See all products</a></div>
</div></section>
</main>
{footer()}
<script src="js/site.js" defer></script>
</body>
</html>
'''


if __name__ == "__main__":
    for name, p in PAGES.items():
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
            fh.write(page(name, p))
        words = sum(len(str(v).split()) for v in [p["h1"], p["lead"]]) + sum(
            len(" ".join(map(str, x if isinstance(x, (list, tuple)) else [x])).split())
            for b in p["blocks"] for x in b.get("items", b.get("rows", [b.get("text", "")]))
        )
        print(f"{name}: ~{words} words")
