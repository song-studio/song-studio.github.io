# 2026 FIFA World Cup Fan Cards

世界杯球迷卡牌。

## Structure

- `index.html`: existing World Cup information site, with fan-card entrance in the hero.
- `fan-cards.html`: interactive card collection and pack-opening page.
- `assets/fan-cards/base`: optimized card art for the 48 qualified teams plus China gold card.
- `assets/fan-cards/special`: eight story cards plus China special gold card.
- `data`: static JSON for teams, cards, matches, standings, and card status.
- `data/knockout.json`: confirmed knockout fixtures and future elimination results.

## Data Model

User-owned cards, the fate card, daily draw status, and prediction choices live in browser localStorage.

`data/matches.json` contains two match collections:

- `matches`: all 72 group-stage matches, including finished scores.
- `today`: Beijing-time matchday entries consumed by the Fan Cards prediction page.

`data/standings.json` is generated from finished matches. Rebuild both files with:

```bash
node qa/build-world-cup-data.mjs
```

The same command also writes `data/knockout.json`. Update the verified score map and Round of 32 pairs in the builder, then run the smoke check before publishing.

## QA Smoke Check

Before each release, run:

```bash
cd /Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/2026-FIFA-World-Cup
./qa/smoke-check.sh
```

Only deploy when the script reports PASS.
