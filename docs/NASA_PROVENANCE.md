# MOONSHIFT — NASA DATA PROVENANCE & MODEL BOUNDARIES

**Status:** New Science Adventure uses a versioned checked-in NASA reference snapshot, not live spacecraft telemetry. Static source records are transformed into actual interactive experiment calculations; the older station simulator uses additional fictional assumptions documented in `src/science/assumptions.ts`.

## Authoritative reference snapshot
File: `src/science/nasaDataset.json` (captured 2026-11-12)

| ID | NASA value | Source | Interactive use |
| --- | --- | --- | --- |
| lunarGravityMs2 | 1.62 m/s² | NASA Moon Fact Sheet | Free-fall distance in the Moon/Earth experiment |
| earthGravityMs2 | 9.80 m/s² | NASA Moon Fact Sheet | Identical comparison on Earth |
| earthMoonDistanceKm | 384,400 km average | NASA Moon Facts | Vacuum one-way radio travel delay ≈ 1.28 s |
| solarIrradianceWm2 | 1361 W/m² | NASA Moon Fact Sheet | Sample power output of hypothetical teaching solar array |
| stormPeakKp | Kp 9 on Earth during May 2024 | NASA CCMC May 2024 Helio Storm | Context for fictional space-weather response exercise |

Direct sources:
- NASA Moon fact sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- NASA Moon facts: https://science.nasa.gov/moon/facts/
- NASA CCMC May 2024 helio storm: https://ccmc.gsfc.nasa.gov/storms/may2024/

**Crucial boundary:** Earth-based Kp is a measure of *geomagnetic activity at Earth*, not an observation of lunar surface radiation or an astronaut radiation dose. The game must not use the Kp 9 value to numerically calculate lunar dose.

## Actual equations in the interactive academy
- Ideal free-fall distance from rest, metres: `d = 0.5 × gravity_m_s2 × time_s²`.
- Example panel power, kilowatts: `P = 1361 × 8 m² × 0.20 × (sunlight_% / 100) / 1000`.
- Four-hour training example energy: `E_kWh = P_kW × 4 h`.
- One-way radio delay, seconds: `t = 384400 km / 299792.458 km/s ≈ 1.2822 s`.

**The NASA values in the first factor of each equation are real sourced values.** Panel area, hypothetical panel efficiency, ideal lighting window and station resource readiness scores are fictional pedagogical choices, explicitly declared in the JSON snapshot. Real mission solar performance depends on temperature, illumination angle, season, dust, power electronics and other factors.

## Separate legacy habitat model
The original Three.js game contains a second, more detailed deterministic station model in:
- `src/game/SimulationEngine.ts`
- `src/science/formulas.ts`
- `src/science/assumptions.ts`

Many rates, optimization setpoints and safety thresholds in that original model are illustrative, **not independently validated flight engineering**. This is a teaching simulator, not a predictive risk-management tool for actual astronauts.

In particular, its simplified exponential shielding calculation does not constitute a validated transport model, and its numerical mSv/hr output must be marked *simulated scenario value* rather than *measured NASA lunar radiation*. Do not claim evidence of true shielding performance without validated particle spectra and transport calculations.

## What counts as evidence of learning
Tracked completed lessons and choices are *usage observations*, not proof that a child learned something. A learning-outcome claim requires actual pre/post questions or supervised playtests with appropriate consent, recorded methods and limitations.

## Integrity and limitations
- The game starts without external API requests, so it runs reliably for judges.
- Each data card links to the official primary source.
- Local user progress is stored on the device only.
- This snapshot does **not** claim that NASA supplied the fictional LUNA-7 spacecraft design, its 24-hour crisis or the readiness scores.
- The lesson values and mission assumptions are deliberately separate from real-world measurements in the repository.
