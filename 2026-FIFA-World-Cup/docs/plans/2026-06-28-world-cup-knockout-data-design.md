# World Cup Knockout Data Design

## Goal

Publish the completed group stage, final standings, and confirmed Round of 32 fixtures without duplicating tournament data across Chinese and English JavaScript blocks.

## Data Sources

- `data/matches.json` remains the source for all 72 group matches and the Beijing-time daily prediction list.
- `data/standings.json` remains the generated source for the 12 final group tables.
- `data/knockout.json` becomes the source for knockout fixtures, participants, times, venues, status, and scores.

Each data file records its update time and source URLs. Team IDs must match `data/cards.json`.

## Page Behavior

The homepage loads all three tournament files. The event hub continues to show daily matches, the full group schedule, and standings. Its knockout tab opens the existing knockout page.

The knockout page keeps the current visual design and round navigation. JavaScript renders each round from `data/knockout.json`; localized names come from the data file. Static bracket slots remain available as a fallback if the knockout request fails.

The Round of 32 shows all 16 confirmed pairings. Later rounds keep winner placeholders until results identify the advancing teams.

## Updating Results

`qa/build-world-cup-data.mjs` owns the verified group-stage score map and regenerates group matches and standings. A separate knockout file lets maintainers update elimination matches without touching page code.

The card competition still reads `matches.json.today`. The tournament-page change must not alter reward generation, predictions, or downloads in `fan-cards.html`.

## Validation

The validator checks:

- 72 unique group matches, all finished after the group stage;
- valid team IDs, scores, and winners;
- 12 groups with four teams and three matches per team;
- 16 Round of 32 fixtures containing 32 qualified teams;
- valid knockout team IDs, match numbers, and winner placeholders;
- valid inline JavaScript in `index.html`.

The smoke test remains the release gate. The live GitHub Pages site must be checked after pushing.
