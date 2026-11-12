export interface ScientificSource {
  id: string;
  system: 'Power & Illumination' | 'Life Support (ECLSS)' | 'Radiation Protection' | 'Space Agriculture & Water';
  title: string;
  agencyOrPublication: string;
  realWorldMeasurement: string;
  educationalApproximation: string;
  fictionalMissionAssumption: string;
  gameBalanceParameter: string;
  citationUrl: string;
}

export const NASA_SCIENTIFIC_SOURCES: ScientificSource[] = [
  {
    id: 'lunar-solar-power',
    system: 'Power & Illumination',
    title: 'Lunar South Pole Illumination & Fission/Solar Microgrid Sizing',
    agencyOrPublication: 'NASA Artemis Base Camp & Lunar Surface Innovation Initiative (LSII)',
    realWorldMeasurement:
      'Solar irradiance at 1 AU in lunar vacuum is ~1,361 W/m² (AM0 spectrum). While equatorial lunar nights last ~354 hours (14.7 Earth days), elevated peaks near the Lunar South Pole (such as Shackleton Crater rim) receive illumination for 70%–89% of the lunar year, with shadow transits lasting from 2 to 5 Earth days.',
    educationalApproximation:
      'We model a 24.0 kW peak photovoltaic + regenerative fuel-cell microgrid degraded to 18.0 kW by electrostatic regolith dust adhesion until the electrostatic dust shield is cycled.',
    fictionalMissionAssumption:
      'Outpost Beta-4 sits on a local ridge at 89.5°S undergoing a 6-hour grazing-horizon topographic shadow transit coinciding with a Solar Particle Event.',
    gameBalanceParameter:
      '1 simulated mission hour advances per 30 real-time seconds during exploration, and fast-forwards during the final 6-hour storm evaluation.',
    citationUrl: 'https://www.nasa.gov/directorates/stmd/lunar-surface-innovation-initiative/'
  },
  {
    id: 'eclss-air-water',
    system: 'Life Support (ECLSS)',
    title: 'Oxygen Generation Assembly (OGA) & Carbon Dioxide Removal (CDRA)',
    agencyOrPublication: 'NASA Marshall Space Flight Center — ISS ECLSS Baseline Documentation',
    realWorldMeasurement:
      'A human crew member consumes ~0.84 kg of O₂ per day and exhales ~1.00 kg of CO₂ per day. NASA spacecraft maintain cabin CO₂ well below 4.0 mmHg (~5,260 ppm) to prevent cognitive impairment and headaches, targeting < 2,000–2,500 ppm on modern long-duration missions. The ISS Water Recovery System (WRS) achieves ~93%–98% water reclamation.',
    educationalApproximation:
      'Cabin CO₂ ppm responds deterministically to Zeolite 5A desiccant/sorbent bed saturation and Sabatier reactor thermal balance, coupled to the kW allocated to the ECLSS bus.',
    fictionalMissionAssumption:
      'Scrubber Bed A suffered a thermal valve lock during a voltage sag, causing CO₂ to climb from nominal 1,100 ppm toward 3,400 ppm at mission start.',
    gameBalanceParameter:
      'Scrubber regeneration and O₂ electrolysis rates are scaled so changes are observable within seconds of re-routing power or purging the sorbent bed.',
    citationUrl: 'https://www.nasa.gov/reference/environmental-control-and-life-support-system/'
  },
  {
    id: 'lunar-radiation',
    system: 'Radiation Protection',
    title: 'Solar Particle Events (SPE), GCRs, and Hydrogen-Rich Shielding Physics',
    agencyOrPublication: 'NASA Space Radiation Analysis Group (SRAG) & LRO CRaTER Instrument',
    realWorldMeasurement:
      'Ambient surface dose rate on the Moon from Galactic Cosmic Rays (GCRs) is ~0.38 to 1.37 mSv/day (~15–57 µSv/hr). However, an unshielded Severe Solar Particle Event (SPE) can deliver 50 to >500 mSv/hr of energetic protons. High-atomic-number (high-Z) metals alone generate secondary Bremsstrahlung and spallation neutrons; low-Z hydrogenous materials (water, polyethylene C₂H₄) and compacted lunar regolith are far more effective per unit mass.',
    educationalApproximation:
      'Shielding attenuation is computed from areal density (g/cm²) weighted by hydrogen mass fraction: combining sintered regolith outer panels, potable/greywater bladder walls, and High-Density Polyethylene (HDPE) slabs reduces SPE dose rate by >94%.',
    fictionalMissionAssumption:
      'An M9/X-class coronal mass ejection proton front is arriving at the Moon, peaking at 1.85 mSv/hr inside unshielded aluminum hull sections.',
    gameBalanceParameter:
      'Players configure 4 modular bulkhead slots and water-wall circulation pumps within a 650 kg structural lock budget and pump kW budget.',
    citationUrl: 'https://www.nasa.gov/hrp/elements/radiation/'
  },
  {
    id: 'space-agriculture',
    system: 'Space Agriculture & Water',
    title: 'Controlled Environment Agriculture, PAR Lighting & Transpiration Recovery',
    agencyOrPublication: 'NASA Kennedy Space Center — Veggie & Advanced Plant Habitat (APH)',
    realWorldMeasurement:
      'Plants utilize Photosynthetically Active Radiation (PAR, 400–700 nm), predominantly red (660 nm) and blue (450 nm) wavelengths, for photosynthesis. Over 95% of water supplied to hydroponic crops is transpired through stomata into cabin air and can be condensed by ECLSS humidity separators back into clean greywater/potable feed.',
    educationalApproximation:
      'Greenhouse lighting efficiency depends on tuning the Red:Blue LED spectrum ratio (~3.5:1 optimal) and closing the transpirational condensate loop so irrigation does not drain habitat potable water reserves.',
    fictionalMissionAssumption:
      'The hydroponic bay was left in broad-spectrum high-drain mode (6.5 kW) with an open condensate vent, wasting both battery power and 1.8 L/hr of water.',
    gameBalanceParameter:
      'Healthy crop photosynthesis provides a modest supplemental CO₂ scrubbing bonus (-120 ppm equivalent) and stabilizes long-term crew nutritional readiness.',
    citationUrl: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/'
  }
];
