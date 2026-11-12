# MOONSHIFT: The Lost Signal

An original, story-led lunar habitat adventure for ages 7–12, developed as an independent educational project for the **NASA Space Apps Challenge 2026 — Build a Junior Astronaut Mission Trainer**.

> **Status:** Functional existing prototype with a visual/UX upgrade in progress. Not a finished or NASA-endorsed game. See `IMPLEMENTATION_STATUS.md` for what has actually been implemented and verified.

## Play locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open the development server URL shown in the terminal (by default port 3000).

```bash
npm run lint
npm run build
npm run preview
```

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| E | Interact with a nearby object |
| Shift | Sprint |
| Space | Jump |
| J | Astronaut guidebook |
| M | Habitat map |
| H | Navigation trail |
| Esc | Pause / close panels |
| F3 | Collision debugging (development) |

## What's inside

- A connected 3D lunar habitat with four mission wings, NPC characters, PIX the guide robot, story messages, context-sensitive interactables, and a local save system.
- Resource trade-off challenges around energy, air, greenhouse water, and sheltering.
- Two new glazed observation bays in the hub: one oriented toward the sculpted lunar landscape, the other toward a deliberately correctly scaled distant Earth.
- Earth observation telescope (look toward the telescope by the north viewing bench, press **E**) with an interactive, magnified NASA Blue Marble globe, an Earth–Moon message-delay experiment, and educational facts.
- Updated landing-page art direction, reduced repetitive caution-tape floor pattern, new regolith material, more accessible mission wording and tutorial-like puzzle coaching.

## Scientific accuracy

The mission story and many numerical model parameters are **fictional educational approximations**, not real-time NASA telemetry or proven operational guidance. Do **not** interpret a game score or dose estimate as real astronaut-safety advice. NASA Blue Marble Earth imagery is used for the globe; see `SCIENCE_AND_ASSET_CREDITS.md`.

The viewing telescope is an educational magnified display. Earth outside remains small by design: from the Moon it subtends roughly 2°.

## Responsible submission

Pre-existing work must be disclosed honestly and must comply with the event organizer's rules. This repository may contain code or art developed before the 2026 competition window. Do not represent it as work created entirely during the 48-hour event.

## Not affiliated

Created independently, not endorsed by NASA. NASA imagery must be credited appropriately; no NASA insignia or endorsement is implied.