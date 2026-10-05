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
APP = "/"  # the KAI app; linked once, from the menu

LEARN = [
    ("index.html", "Home", "Start here"),
    ("problems.html", "The problem", "Why conservation work goes unseen"),
    ("solution.html", "How it works", "From a record to a proof"),
    ("bizcanvas.html", "Business model", "How KAI works as a business"),
]
PRODUCTS = [
    ("murals.html", "Murals", "Art with a verified story"),
    ("hubs.html", "Information Hubs", "A portal for each CFA"),
    ("cfa.html", "For CFAs", "Nursery groups and records"),
]

E = html.escape

# ─────────────────────────── content ───────────────────────────
PAGES = {
    "index.html": {
        "title": "KAI Nuvari — Conservation work you can trust",
        "desc": "Murals and portraits with a verified conservation story, and Information Hubs for Community Forest Associations.",
        "eyebrow": "KAI Nuvari",
        "h1": "Conservation work you can trust.",
        "lead": "Community Forest Associations record their work. We check it, timestamp it on Avalanche, and turn it into murals with a story you can prove.",
        "blocks": [
            {"type": "cards", "title": "What we do", "items": [
                ("Murals and portraits", "Art from about KES 15,000, each linked to real tree-planting records.", "murals.html"),
                ("Information Hubs", "Each CFA gets its own portal to record and publish its work.", "hubs.html"),
                ("Nursery groups", "Seedlings, planting and survival, recorded by the people who do it.", "cfa.html"),
            ]},
            {"type": "steps", "title": "How a record becomes trusted", "items": [
                ("Record", "A CFA member records nursery or planting work."),
                ("Check", "A CFA verifier checks it and approves it."),
                ("Timestamp", "A fingerprint of the record is saved on Avalanche."),
                ("Publish", "Anyone can read it and check it was never changed."),
            ]},
            {"type": "cards", "title": "What a mural tells you", "items": [
                ("Which CFA", "The Community Forest Association behind the work."),
                ("Who planted", "The members who raised and planted the trees."),
                ("When", "The dates of planting and checking."),
                ("The proof", "A link to each record and its Avalanche timestamp."),
            ]},
        ],
    },
    "problems.html": {
        "title": "The problem — KAI",
        "desc": "Communities do real conservation work, but it is rarely recorded, trusted or rewarded.",
        "eyebrow": "The problem",
        "h1": "Real conservation work goes unseen.",
        "lead": "Forest groups plant and protect trees every day, but the records sit in notebooks that nobody can check.",
        "blocks": [
            {"type": "cards", "title": "Why it matters", "items": [
                ("Paper records", "Nursery and planting notes get lost and can't be checked."),
                ("No proof", "Buyers and partners can't tell real work from claims."),
                ("No reward", "The people who plant rarely earn from what they create."),
                ("Scattered information", "Each group keeps its own notes, so nothing adds up."),
            ]},
            {"type": "note", "text": "If conservation work can be proven, it can be trusted, shared and paid for."},
        ],
    },
    "solution.html": {
        "title": "How it works — KAI",
        "desc": "From a nursery record to a public proof on Avalanche.",
        "eyebrow": "How it works",
        "h1": "From a nursery record to a proof anyone can check.",
        "lead": "Provenance is the history of something: who made it, where, and when. We give conservation work a history that can't be changed.",
        "blocks": [
            {"type": "steps", "title": "The journey of one record", "items": [
                ("Recorded", "A nursery group enters seedlings, planting or a survival check, by form or by talking to Kanuvari AI."),
                ("Checked", "A CFA verifier reviews it, with photos as evidence."),
                ("Fingerprinted", "The record gets a unique fingerprint (SHA-256)."),
                ("Timestamped", "Fingerprints are saved on the Avalanche blockchain."),
                ("Published", "The record appears in the hub with a proof page."),
            ]},
            {"type": "compare", "title": "Before and after", "items": [
                ("Notebook in the nursery", "Record in the CFA's own hub"),
                ("\"We planted 1,000 trees\"", "Each planting checked by a verifier"),
                ("Records that can be changed", "Fingerprint on Avalanche"),
                ("Art with no story", "Murals linked to the real records"),
            ]},
        ],
    },
    "murals.html": {
        "title": "Murals — KAI",
        "desc": "Conservation murals and portraits, each with a verified story.",
        "eyebrow": "Murals",
        "h1": "Art with a story you can prove.",
        "lead": "Each mural or portrait is linked to the conservation records behind it. Scan or click, and see the trees, the people and the proof.",
        "blocks": [
            {"type": "cards", "title": "With every mural", "items": [
                ("The artwork", "A mural or portrait, from about KES 15,000."),
                ("The story", "The CFA, the nursery group, who planted and when."),
                ("The proof", "Each record checked by a verifier and timestamped on Avalanche."),
                ("A fingerprint", "One code that shows nothing has changed since it was made."),
            ]},
            {"type": "cards", "title": "See them", "items": [
                ("Browse the murals", "See prices, pictures and each mural's story.", "/murals"),
                ("Ask for a portrait", "Open a mural and leave your phone number; we call you back.", "/murals"),
            ]},
        ],
    },
    "hubs.html": {
        "title": "Information Hubs — KAI",
        "desc": "A portal for each Community Forest Association, and one public portal for everyone.",
        "eyebrow": "Information Hubs",
        "h1": "A portal for each group. One place for everyone.",
        "lead": "Each CFA manages its own information. When work is checked, it is published to the public portal.",
        "blocks": [
            {"type": "cards", "title": "Our hubs", "items": [
                ("Oloolua Conservation Hub", "Oloolua CFA and its Youth Guardians: nursery groups, planting and survival records.", "/nursery"),
                ("SIHU Information Hub", "Sango, Lake Victoria Basin: local stories, reviewed before they are published.", "/hub"),
                ("The public portal", "Both hubs side by side, with everything they published.", "/hubs"),
            ]},
            {"type": "cards", "title": "What a hub does", "items": [
                ("Enter information", "Members record work by form or by talking to Kanuvari AI."),
                ("Manage groups", "Admins add members, nursery groups and the species they grow."),
                ("Check", "Verifiers and editors approve before anything is public."),
                ("Publish", "Approved work appears in the public portal with its proof."),
            ]},
        ],
    },
    "cfa.html": {
        "title": "For CFAs — KAI",
        "desc": "Nursery groups record their work and get it verified.",
        "eyebrow": "For Community Forest Associations",
        "h1": "Your nursery groups, recorded and recognised.",
        "lead": "Record seedlings, planting and survival in your own hub. Your verifier checks it; the proof is yours forever.",
        "blocks": [
            {"type": "steps", "title": "Getting started", "items": [
                ("Join", "Sign in with Google or email and join your CFA."),
                ("Set up", "Your admin adds your nursery groups and the species you grow."),
                ("Record", "Log seedlings, planting, nursery work and survival checks."),
                ("Get verified", "Your CFA verifier approves; the record is timestamped."),
            ]},
            {"type": "cards", "title": "What you get", "items": [
                ("Your own records", "Everything saved under your name and your CFA."),
                ("Photo evidence", "Attach photos; each gets its own fingerprint."),
                ("Works offline", "Records wait on your phone until you have signal."),
                ("Your work in art", "Verified records can become part of a mural's story."),
            ]},
            {"type": "cards", "title": "Start now", "items": [
                ("Open the nursery groups", "Record your first seedlings.", "/nursery"),
                ("Talk to Kanuvari AI", "Say what happened; it fills in the form for you.", "/workspace"),
            ]},
        ],
    },
    "bizcanvas.html": {
        "title": "Business model — KAI",
        "desc": "How KAI works as a business.",
        "eyebrow": "Business model",
        "h1": "Murals pay for the work. Hubs make it trusted.",
        "lead": "We sell conservation murals and portraits, and offer Information Hubs as a service to CFAs and partners.",
        "blocks": [
            {"type": "cards", "title": "How KAI earns", "items": [
                ("Murals and portraits", "Sold from about KES 15,000, each with its verified story."),
                ("Information Hubs", "A hub for a CFA or conservation group, set up and supported."),
                ("Commissions", "Portraits and murals made to order for homes, offices and events."),
            ]},
            {"type": "cards", "title": "Who we serve", "items": [
                ("Buyers of art", "People and companies who want art with real impact."),
                ("CFAs", "Forest groups that want their work recorded and recognised."),
                ("Partners", "NGOs, funders and counties that need trusted conservation data."),
            ]},
            {"type": "cards", "title": "Why it works", "items": [
                ("Simple to run", "No exchange, no tokens to trade: art and information services."),
                ("Trust built in", "Every story is checked and timestamped on Avalanche."),
                ("Value to communities", "The work of the planters is visible and part of every sale."),
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
    top = "".join(f'<a href="{f}"{cur(f, page)}>{l}</a>' for f, l in [("index.html", "Home"), ("problems.html", "The problem"), ("solution.html", "How it works")])
    drop = "".join(f'<a href="{f}"{cur(f, page)}><b>{l}</b><small>{h}</small></a>' for f, l, h in PRODUCTS)
    after = "".join(f'<a href="{f}"{cur(f, page)}>{l}</a>' for f, l in [("bizcanvas.html", "Business model")])
    on = " kw-on" if any(page == p[0] for p in PRODUCTS) else ""

    def items(lst):
        return "".join(f'<a class="kw-item" href="{f}"{cur(f, page)}><b>{l}</b><small>{h}</small></a>' for f, l, h in lst)

    return f'''<div class="kw-nav" role="banner">
  <div class="kw-nav-inner">
    <a class="kw-brand" href="index.html" aria-label="KAI home"><span class="kw-logo">K</span><span>KAI</span></a>
    <div class="kw-links" role="navigation" aria-label="Main">
      {top}
      <div class="kw-drop"><button type="button" class="kw-drop-btn{on}" aria-expanded="false" aria-haspopup="true">What we offer {CHEV}</button><div class="kw-drop-menu">{drop}</div></div>
      {after}
    </div>
    <a class="kw-cta" href="{APP}">Open the app</a>
    <button type="button" class="kw-burger" aria-label="Open menu" aria-expanded="false" aria-controls="kw-panel"><span></span><span></span><span></span></button>
  </div>
  <div class="kw-panel" id="kw-panel" hidden>
    <div class="kw-panel-inner">
      <div><h3>Learn about KAI</h3><div class="kw-panel-grid">{items(LEARN)}</div></div>
      <div><h3>What we offer</h3><div class="kw-panel-grid">{items(PRODUCTS)}</div></div>
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


# Reading order: each page ends with "Previous" and "Next".
ORDER = ["index.html", "problems.html", "solution.html", "murals.html", "hubs.html", "cfa.html", "bizcanvas.html"]
NAMES = {f: (l, h) for f, l, h in LEARN + PRODUCTS}
# What the main top button says on each page (it scrolls to the content).
GO = {"index.html": "See what we do", "problems.html": "See why", "solution.html": "See the journey", "murals.html": "See what comes with a mural",
      "hubs.html": "See our hubs", "cfa.html": "See how to start", "bizcanvas.html": "See the model"}


def words_of(p):
    return sum(len(str(v).split()) for v in [p["h1"], p["lead"]]) + sum(
        len(" ".join(map(str, x if isinstance(x, (list, tuple)) else [x])).split())
        for b in p["blocks"] for x in b.get("items", b.get("rows", [b.get("text", "")]))
    )


def pager(name):
    i = ORDER.index(name)
    out = []
    if i > 0:
        f = ORDER[i - 1]
        out.append(f'<a class="k-page k-page--prev" href="{f}"><small>Previous</small><b>{E(NAMES[f][0])}</b><span>{E(NAMES[f][1])}</span></a>')
    else:
        out.append('<span></span>')
    if i < len(ORDER) - 1:
        f = ORDER[i + 1]
        out.append(f'<a class="k-page k-page--next" href="{f}"><small>Next</small><b>{E(NAMES[f][0])}</b><span>{E(NAMES[f][1])}</span></a>')
    else:
        out.append(f'<a class="k-page k-page--next" href="index.html"><small>Back to start</small><b>Home</b><span>Read it again from the top</span></a>')
    return f'<nav class="k-sec k-pager" aria-label="Pages"><div class="k-wrap k-pager-grid">{"".join(out)}</div></nav>'


def footer():
    def col(title, links):
        return f'<div class="k-foot-col"><h4>{title}</h4><ul>' + "".join(f'<li><a href="{h}">{E(l)}</a></li>' for h, l in links) + "</ul></div>"
    learn = col("Learn", [("index.html", "Home"), ("problems.html", "The problem"), ("solution.html", "How it works"), ("bizcanvas.html", "Business model")])
    prods = col("What we offer", [("murals.html", "Murals"), ("hubs.html", "Information Hubs"), ("cfa.html", "For CFAs"), ("/murals", "Browse murals"), ("/hubs", "Public portal")])
    company = col("Company", [("https://www.kai.bar", "www.kai.bar"), ("/privacy", "Privacy")])
    return f'''<footer class="k-foot">
  <div class="k-wrap k-foot-top">
    <div class="k-foot-brand">
      <a class="kw-brand" href="index.html"><span class="kw-logo">K</span><span>KAI</span></a>
      <p>Conservation records you can trust, and murals that carry their story.</p>
      <p class="k-foot-status"><i></i> Proofs on Avalanche</p>
    </div>
    <div class="k-foot-cols">{learn}{prods}{company}</div>
  </div>
  <div class="k-wrap k-foot-bottom">
    <span>&copy; 2026 KAI Protocol. All rights reserved.</span>
    <span>Conservation records and murals from Kenya.</span>
    <a href="#top" class="k-top">Back to top &uarr;</a>
  </div>
</footer>'''


def page(name, p):
    i = ORDER.index(name)
    nxt = ORDER[i + 1] if i < len(ORDER) - 1 else None
    second = f'<a class="k-btn k-btn--ghost" href="{nxt}">Next: {E(NAMES[nxt][0])} {ARROW}</a>' if nxt else ""
    minutes = max(1, round(words_of(p) / 180))
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
<body id="top">
{menu(name)}
<main>
<section class="k-hero"><div class="k-wrap">
  <p class="k-eyebrow">{E(p["eyebrow"])} <span>· {minutes} min read</span></p>
  <h1>{E(p["h1"])}</h1>
  <p class="k-lead">{E(p["lead"])}</p>
  <div class="k-btns"><a class="k-btn" href="#start">{E(GO[name])}</a>{second}</div>
</div></section>
<div id="start">
{blocks}
</div>
{pager(name)}
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
        print(f"{name}: ~{words_of(p)} words")
