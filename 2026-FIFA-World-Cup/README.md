# 2026 FIFA World Cup Fan Cards

世界杯球迷卡牌。

## Structure

- `index.html`: existing World Cup information site, with fan-card entrance in the hero.
- `fan-cards.html`: interactive card collection and pack-opening page.
- `assets/fan-cards/base`: optimized card art for the 48 qualified teams plus China gold card.
- `assets/fan-cards/special`: eight story cards plus China special gold card.
- `data`: static JSON for teams, cards, matches, standings, and card status.

## Data Model

V1 stores user-owned cards, the fate card, daily draw status, and prediction choices in browser localStorage. Match data can start as static JSON and later be updated by GitHub Actions.
