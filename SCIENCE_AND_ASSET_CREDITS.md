# Scientific sourcing and art asset provenance

## NASA Earth imagery

- **NASA Blue Marble Next Generation**, image `bmng.jpg` distributed with the Basemap Python package (`mpl_toolkits.basemap_data`). The game includes a resized 2048×1024 JPEG (`public/assets/earth-blue-marble.jpg`) with its geographical surface appearance preserved.
- NASA Blue Marble reference: https://earthobservatory.nasa.gov/features/BlueMarble
- The image represents Earth surface imagery, NOT a live camera feed. Atmospheric/cloud animation outside the window is decorative and simplified.

## Celestial presentation

- Earth's mean distance from the Moon is approximately 384,400 km (varies over the orbit); at that distance its apparent angular diameter is ~1.9–2°. Earth in the 3D sky has been deliberately scaled accordingly. Earth in the interactive telescope is magnified optically for education.
- Average one-way light travel Earth–Moon is ~1.3 seconds. Actual delay varies with distance and other communication effects.
- Moon window views show locally generated stylized Three.js terrain, not a NASA topographic map. The regolith texture was generated procedurally for visual art, not measured data.

## Scientific claims and limitations

- Current system models, power allocations, crop photosynthesis indexes, and radiation doses in the inherited prototype contain educational approximation/game-balance numbers. They should not be represented as NASA-validated mission telemetry.
- Realistic radiation exposure depends on particle spectrum, geometry, shelter materials and numerous engineering assumptions. The simulator is not a verified radiation transport model.
- The demonstration simplifies life-support and food systems, and does not replace professional aerospace engineering.

## Other assets

- `public/assets/lunar-regolith.jpg`: generated procedural texture (original in this iteration).
- Existing authored procedural geometry, UI, and character meshes: user-uploaded source materials, license and provenance of any upstream contributions should be confirmed before formal submission.
- Fonts may be loaded by Google Fonts at runtime if an internet connection is available; game functionality should not depend on these fonts.
