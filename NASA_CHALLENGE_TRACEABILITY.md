# MOONSHIFT — NASA Space Apps 2026 challenge coverage

**Target challenge:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/).  **Intended audience:** ages 7–12.

This is an **honest development matrix**, not a competition certification. A passing TypeScript/Vite build proves the source compiles; it does **not** establish that the game has been played all the way through, that children understand it, or that all science calculations are validated.

| Challenge area | Existing implementation / recent improvement | Verification and remaining work |
| --- | --- | --- |
| Life support | Life-support station, shared mission resources and interaction challenge | Source exists. Need hands-on playthrough, child-first teaching, and review of model assumptions and units. |
| Radiation protection | Shelter area and protection challenge | Source exists. Needs assessment of scientific assumptions, uncertainty, clarity for young learners and complete gameplay verification. |
| Power budgeting | Power-system challenge and mission-energy decisions | Source exists. Need verify visible trade-offs in each branch and that decisions can't create resources. |
| Food production | Greenhouse scene and water/light challenge | Source exists. Need distinguish accelerated plant growth from real-time biological processes and validate simplifications. |
| Communication delay | New Earth telescope with illustrated ~2.6-second Earth–Moon light-speed round-trip experiment | Implemented and TypeScript/build checked. **Not independently tested in a browser.** Scenario-specific signal outage is not equivalent to light propagation delay. |
| Integrated trade-offs | Existing simulation-engine and mission-state classes | Requires systematic unit tests for conservation, state boundaries, retries and endings. |
| Adventure/story | PIX companion, station characters, chapter objectives, guidebook, updated opening story | Working source carried over from uploaded prototype. No verified complete beginning-to-end 7–12-year-old playtest. |
| Scientific credibility | NASA source links, source ledger, credited NASA Blue Marble image and physically plausible apparent Earth size | Image credit and astronomy corrections implemented. **Game resource values remain educational approximations, not NASA telemetry or safety guidance.** Source-by-source expert review still required. |
| Presentation | Three.js 3D station, new glazed hub observation bays, lunar surface material, redesigned main menu and telescope | Compile/build passed on GitHub Actions. Final art direction, authored character animation, cinematics, accessibility and device-performance testing remain in progress. |
| Deliverable and reproducibility | Public GitHub repository with documented run and CI commands | GitHub Actions confirms install, type check and production build. A live public playable deployment and full interaction test are not yet verified. |

## Current verified evidence

- GitHub Actions on the current main branch runs `npm install`, `npm run lint` (`tsc --noEmit`), and `npm run build` successfully.
- Player/collision and narrative source code inspected, but a scripted desktop-and-mobile full game journey was not run in this work session. Local Chromium access to the local preview was blocked by the execution environment.
- The NASA Earth imagery is an existing NASA Blue Marble basemap and the proposed message experiment is **simulated**. Source notes: `SCIENCE_AND_ASSET_CREDITS.md`.

## Next release gates

1. End-to-end testing through the hub and every door, lesson, puzzle and ending, on real desktop and mobile browsers.
2. Child-friendly **teach → try → choose → consequence** progression for every required topic, followed by playtesting with ages 7–12 and suitably approved adults.
3. Written, checkable derivations / NASA citations for every meaningful numerical model and appropriate disclaimers.
4. Cinematic art direction across **all** rooms, quality 3D animations, short authored scenes and accessible spoken/subtitled dialogue as supported by licenses and runtime performance.
5. Verified production deployment, judge-friendly demonstration, documented external assets, and event-organizer confirmation about use of work made before the hackathon.

**NASA Space Apps recognition or a global award cannot be guaranteed.** This project is independent and is not endorsed by NASA.
