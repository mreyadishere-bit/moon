# MOONSHIFT — LUNAR WONDER ART & EXPERIENCE BIBLE
Version 1.0 — implementation benchmark and audit checklist

## North star
MOONSHIFT is a *premium soft-geometric lunar adventure* for children aged 7–12 (optimized for 12), not a generic engineering control room, a cartoon imitation of Minecraft, or a collection of stock sci-fi assets. Existing assets may be kept when they meet the same visual standard.

**One game, one material language, one lighting grammar, one interaction grammar.** Every asset must look believable alongside PIX, the Central Habitat and the Observation Dome.

## Mandatory hero references
1. **Central Habitat:** large-scale spatial legibility, warm living details, crisp transitions between wall/floor/ceiling assemblies, easy discovery of exits and interactables. No blank box corridors.
2. **Observation Dome:** physically plausible Moon horizon and Earth angular scale, controlled contrast between bright vacuum-lit exterior and practical interior, properly framed glass, player never confuses cinematic art with scientific measurement.
3. **PIX:** consistent character silhouette, warm readable expressions, restrained color and emissive lighting, smooth navigation that never blocks doors or objectives.

These three are *benchmarks*, not an assertion that current assets already meet commercial quality.

## Visual direction & palette
- Primary background: #0B1520; structural graphite #263644
- Main composite ceramic #E7E8E4; moonstone #9CA8AD
- Interaction blue #79AEC8; sparse champagne #D6B68A
- Energy amber #E9AD65
- Air/water cyan #79C9D8
- Botanical sage #89BE96
- Shelter lavender #B8A5DC
- Actual danger only: coral #DA7468
- Success: #82C5A4
- Accent is limited to a functional system; don't put every color in a single room.

## Modeling and material guidelines
- Readable large silhouettes, beveled medium-scale geometry and functional micro-details.
- No repetitive box-and-warning-stripe patterns, decorative fake screens, interchangeable NPCs, nonfunctional UI, overglossy plastic, or extremely tiny labels.
- Use efficient optimized glTF/GLB for hero assets if available legally; original procedural geometry is fine for structure, never as a substitute for actual asset direction.
- Assign appropriate metalness and roughness; clearcoat only where required. Keep physically consistent scale.
- Every window, door and airlock must have visually matched collision and a credible state indicator.
- Preserve FPS by instancing repeated low-importance items and keeping materials shared.

## Lighting and cinematic direction
- Use practical lights to describe geometry, navigation and system health.
- Exterior: sharp directional sunlight, black sky, plausible lunar terrain and no atmospheric fog.
- Interior: shadowed graphite supports, warm comfort pools near crew space, restrained emissive accents at equipment.
- High contrast without crushed shadow interiors or blown-out composites.
- Cinematics should use the same actual level/character assets as gameplay, never mismatched pre-rendered stills.
- Camera movements should be intentional, short, skippable and not induce motion sickness.

## Navigation/learning UI
- Child can identify the current destination and nearest interaction within five seconds.
- One objective visible, one highlighted target, one clear affordance per action.
- Use short warm natural English; no unexplained industrial terminology.
- Large comfortable targets, progressive hints, optional route trail, readable subtitles and reduced-motion settings.
- A science experiment has a visible changing variable, a cause-and-effect result and a clearly labeled real-world source/fictional assumption.
- Atlas, Field Journal, repairs, onboarding and end screen share icon stroke weights, typography, corner radii and animation timings.

## Characters and writing
- PIX is lively, subtle, playful, never annoying or a continuously running chatbot.
- Maya explains lunar science, Leo teaches power engineering, SPROUT covers plants, NOVA covers mission operations.
- No T-poses, clipping, repetitive inappropriate gestures or mismatched art assets.
- Characters remember at least important player decisions, and NPC reactions are authored and grounded in actual state.
- Every major consequence appears in environment lighting, sound, status and later dialogue where possible.

## Science/art separation
- NASA measurements are clearly distinguished from derived results, illustrative equipment assumptions and fictional story.
- NASA 2024 Kp 9 is an *Earth geomagnetic index*, never directly displayed as measured lunar dose.
- Do not represent a generic shield-score as an engineering dose-response curve.
- Earth is approximately 1.9 degrees in the lunar sky, not a giant fantasy planet unless viewing through an explicitly magnifying telescope.
- The Moon has no breathable air and negligible atmosphere; no exposed human figures outside an airlock without proper protection.

## Asset acceptance checks
An asset fails and must be revised if:
- Its geometry/materials don't match adjacent environment;
- It looks randomly procedural, generic or stylistically alien;
- It visually occludes critical interaction or path;
- It introduces an invisible obstacle;
- It has a broken shader, missing texture, or unreadable text;
- It substantially harms performance;
- It is unlicensed or inadequately attributed.

## Production checkpoints
- Screenshot comparisons from 3+ actual player viewpoints in each hero area;
- Functional door/collider traversal from both directions;
- Pointer-lock and mobile touch navigation checks;
- At least one complete 7–12-year-old comprehension playtest with appropriate guardian/educator approval before claiming an educational effect;
- Verify all effects in a real browser and record device+frame rate rather than assuming 60 FPS.
