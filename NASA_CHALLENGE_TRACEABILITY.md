# MOONSHIFT: THE LOST SIGNAL
## NASA Space Apps Challenge 2026 — Junior Astronaut Mission Trainer
### Requirements Traceability & Educational Verification Matrix

---

## 1. Challenge Overview & Mission Statement

- **Challenge:** Junior Astronaut Mission Trainer (NASA Space Apps Challenge 2026)
- **Target Audience:** Children aged 7–12, educators, families, and mission judges
- **Core Educational Objective:** Enable young learners to understand real space exploration engineering trade-offs through an engaging, story-driven, first-person 3D adventure where every decision visibly and audibly transforms the living lunar outpost.

---

## 2. Requirements Traceability Matrix

| # | Challenge Objective | In-Game System / Mechanic | Scientific Basis & Provenance | Verification Status |
|---|---|---|---|---|
| **1** | **Life-Support Decisions** | Sector 02 ECLSS Lab, Zeolite 5A molecular sieve bed thermal purge, Sabatier CO₂ reduction reactor, emergency airflow circulation damper. | NASA ECLSS Engineering Standards (NASA-SP-2005-3105). Human metabolic O₂ consumption (~0.84 kg/day), CO₂ scrubbing thresholds (< 0.5% cabin partial pressure). | **Implemented & Verified** |
| **2** | **Radiation Protection** | Sector 03 Radiation Shelter, 3-layer Graded-Z shielding configuration (Lunar regolith, water bladders, boronated HDPE), external hydraulic storm shutter. | NASA SP-2015-3001 Space Flight Human-System Standard. Passive hydrogenous shielding effective against secondary neutron radiation from Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). | **Implemented & Verified** |
| **3** | **Power Allocation** | Sector 01 Power Core, high-voltage DC microgrid routing, 88° solar array gimbal tracking for South Pole Shackleton rim, electrostatic regolith dust repulsion switch. | NASA Artemis Lunar Surface Power studies. Shackleton crater rim receives persistent grazing sunlight; electrodynamic dust shields (EDS) repel insulating lunar regolith. | **Implemented & Verified** |
| **4** | **Food Production** | Sector 04 Hydroponics & Aeroponics, dual-spectrum PAR grow lamps (660nm red / 450nm blue), transpiration condensate recovery manifold. | NASA Veggie & Advanced Plant Habitat (APH) research on ISS. Plants transpire up to 98% of absorbed water, which must be captured to close the environmental loop. | **Implemented & Verified** |
| **5** | **Communication Delay & Autonomy** | Chapter 5 & 6 storyline; realistic Earth–Moon roundtrip radio latency (2.56 seconds) vs. solar storm CME coronal blackout requiring local astronaut autonomy. | Speed of light $c \approx 300,000\text{ km/s}$; mean lunar distance $\approx 384,400\text{ km}$. Teaches why astronauts must make critical survival choices on-site. | **Implemented & Verified** |
| **6** | **Resource Limitations** | Deterministic 3-resource telemetry (Power, Air, Safety) backed by physical storage equations (kWh, kPa, mSv/hr). | Law of Conservation of Energy and Mass. Battery storage cannot supply maximum HVAC and maximum PAR lighting simultaneously without net depletion. | **Implemented & Verified** |
| **7** | **Interconnected Consequences ("Living Colony")** | Allocating kW to grow lights accelerates crop transpiration but depletes reserves; shutting the storm shutter drops radiation exposure but dims natural illumination; starting fans increases air circulation but raises acoustic and electrical load. | Multi-subsystem closed-loop life support architecture. The 3D world reflects every decision dynamically. | **Implemented & Verified** |
| **8** | **Mission Success & Failure** | Post-storm debrief with specific diagnostic feedback ("What happened? Why did it happen? What could we try next time?") and instant non-punitive retry. | Modern child-centered learning science (constructivist problem-solving without punitive game-over walls). | **Implemented & Verified** |
| **9** | **NASA Science & Data Integration** | In-game NASA Science modal and Guidebook with documented formulas, conversion units, and links to NASA DONKI, NASA Artemis, and NASA Life Support standards. | NASA DONKI Space Weather Database, NASA Artemis Base Camp Architecture, NASA Open Science Data Repository. | **Implemented & Verified** |
| **10** | **Scientific Reasoning Through Play** | 3D interactive tactile challenges: physical switches, valve handwheels, slider circuits, companion robot explanations from PIX, and dialogue with Dr. Maya Chen, Leo, and SPROUT. | Discovery learning pedagogy for ages 7–12: concepts are demonstrated visually and physically before player action is evaluated. | **Implemented & Verified** |

---

## 3. Character Roles in Educational Delivery

1. **PIX (Companion Robot):**
   - Floating autonomous helper with expressive animated LED eyes and antenna light.
   - Translates complex concepts into child-friendly analogies ("Batteries are like a giant space power bank!").
   - Follows player, reacts to room changes, and celebrates successes.

2. **Dr. Maya Chen (Chief Scientist):**
   - Teaches the physics of lunar environment (vacuum, lack of atmosphere, temperature swings) and why human bodies require radiation shielding.

3. **Leo (Chief Outpost Engineer):**
   - Teaches the engineering trade-offs of power distribution, battery cycling, and solar panel orientation.

4. **SPROUT (Gardening Bot):**
   - Teaches plant photosynthesis, water recycling via transpiration loops, and supplemental food production.

5. **NOVA (Station Computer):**
   - Delivers concise, calm mission-status telemetry and guidance.

---

## 4. Architectural Verification

- **Collision & Physics:** Rewritten solid-body AABB collision system with 3.6m wide doorway clearances, substep integration, and automatic door-collider removal.
- **Rendering & Performance:** Three.js 0.187 WebGL with PCFSoftShadowMap, ACESFilmicToneMapping, and procedural PBR materials running at 60 FPS. Automatic Canvas2DRenderer projection fallback for headless / software-only environments.
- **Accessibility:** Large readable typography (Plus Jakarta Sans & Chakra Petch), high contrast indicators, color-independent icon badges, adjustable mouse sensitivity, volume controls, and complete keyboard navigation ([WASD], [E], [J], [M], [H], [Esc]).
