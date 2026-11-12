# MOONSHIFT — NASA JUNIOR ASTRONAUT CHALLENGE TRACEABILITY MATRIX
Date: 2026-11-12. This is an honest implementation audit, NOT an assertion of full competition readiness.

Official brief: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/

| Requirement | Implemented behavior | Grounding | Automated verification | Current status |
|---|---|---|---|---|
| Learners aged 7–12 | First-person adventure, 7-stage Science Academy, natural dialogue, visual choice cards and optional hints | Age audience from official brief | TypeScript + build; no real child playtest yet | Partial |
| Running an outpost | Five connected habitat sectors, interactive air/power/garden/shelter equipment, resource telemetry | Fictional LUNA-7 habitat model | Production build; scene is not browser-playtested | Partial |
| Life support | Air repair task, CO₂ teaching, power/air tradeoff and ventilation console | NASA ECLSS research; fictional rates | Scientific model tests (limited) | Partial |
| Radiation protection | Qualitative shelter preparation, scenario choices, training readiness | NASA radiation references and May 2024 space-weather event | No validated radiation dose model | Partial |
| Power budgeting | Solar output demonstration; battery kWh and allocation choices to several systems | NASA lunar irradiance + fictional example panel | Automated solar computation tests | Implemented educational vertical slice |
| Food production | Greenhouse controls, water recycling decisions, animated plant support | NASA space-agriculture background | Gameplay not browser-verified | Partial |
| Communication delay | 384,400 km sourced Earth–Moon distance, one-way light-speed calculation, choice to ask/act | NASA Moon Facts | Automated delay tests | Implemented educational vertical slice |
| Interconnected tradeoffs | KidFriendlyConsole updates shared Three.js station model, separate science adventure stores branching choices and resources | Explicit teaching assumptions | Three distinct deterministic narrative-path tests, no full integration E2E | Partial |
| Branching narrative | Three starting scenarios; persistent choice consequences; different resource endings; crew remembers decisions | Authored fiction | Tests for branches and double-spend prevention | Partial |
| Learn before assess | Short character explanations, Moon/Earth gravity experiment, example solar array experiment and guided repair tasks | NASA primary references | Physics calculation tests | Partial; not every lesson has hands-on experiment |
| NASA data as actual input | Auditable JSON snapshot of 5 NASA reference values consumed by physics/energy/communication simulations | docs/NASA_PROVENANCE.md | npm run audit:nasa; npm run test:science | Verified snapshot, static not live API |
| Art direction | docs/ART_BIBLE.md; detailed central habitat features, labels, title and 3D observation scene | Original art language | Production compilation | Not yet meets final premium art benchmark |
| People and NPCs | PIX, Maya, Leo, SPROUT, NOVA with partial dialogue and simple 3D models | Fictional characters | Not yet comprehensive NPC browser automation | Partial |
| Cinematic story | ArrivalCinematic uses actual Three.js gameplay scene and skippable subtitles; legacy chapter progression | Fictional narrative | Production compilation | Partial; not full branching cutscene system |
| Accessibility | Clickable controls, hints, text instructions, clear mouse/keyboard guidebook; some touch support | Age-appropriate design | No external accessibility audit | Partial |
| Performance | Shared materials, low-friction renderer fallback, capped pixel ratio, light geometry | Rendering guidelines | Vite build only; JS chunk >500 kB | Not benchmarked |
| All endings, save and resume | LocalStorage saves story and station; separate academy outcomes, legacy station storm debrief | Fictional narrative | Unit tests for academy paths | Needs full gameplay walkthrough |
| Awards readiness | Public GitHub code, Vercel link, documented sources, scripts and design rules | Official challenge | CI build | Not yet ready to claim win or complete |

## Commands and evidence
- `npm run audit:nasa`: checks reference snapshot and derived physics values offline.
- `npm run audit:nasa:online`: optional source verification (network required; cannot replace scientific review).
- `npm run test:science`: tests Earth/Moon gravity, example solar power, signal time, deterministic branching, and resource bounds.
- `npm run lint`: TypeScript check.
- `npm run build`: Vite production build.

## Blocking gaps before claiming complete
1. Browser-playtest real pointer lock, door collision, all four sector repairs, all seven academy stages and three outcomes.
2. Replace procedural/generic hero NPC models and repetitive environmental detail with consistent original high-quality art assets and animations.
3. Extend all lessons with physical cause/effect experiments; do not just present choices in full-screen panels.
4. Unify the adventure's resource simulation and legacy 3D station engine into a single proven source of truth; current integration is partial.
5. Verify that every resource action has genuine delayed consequences, and all NPC responses remain coherent.
6. Scientific review of shield/CO₂ legacy equations; they currently use fictional rates and must never be passed off as NASA-measured flight telemetry.
7. Performance, accessibility and playtest evidence with children (guardian permissions) and educators.
8. Complete theatrical scenes and polished multiple narrative routes.

Do not mark these complete based on successful compilation alone.
