# 0017: Foundry glTF ships, imported at edit time

- **Status:** Accepted
- **Date:** 2026-11-11
- **Issue:** #14 (also settles #29)
- **Decided by:** the user, after the barge spike in #14

## Context

Ships were Unity primitives. #14 asked whether to build hulls procedurally in C# (#28) or use asteroid-fleet's Foundry models: low-poly `.glb` files, MIT, about 280 KB for all ten. The web build is about 10.7 MB gzipped, and 7.5 MB of that is the wasm (engine and IL2CPP code), which grows with code and packages, not with assets.

## Options

1. **Procedural hulls** (#28): no download, but every class needs a hand-written builder, and the look is limited to boxes and tapers.
2. **Foundry models imported at edit time**: the meshes go into the build's data file. Measured on the barge, then all five classes: +15 KB gzipped, wasm unchanged.
3. **Foundry models loaded at runtime with glTFast** (#29): the data file doesn't grow, but glTFast's runtime code goes into the wasm (likely more than the models weigh), and every class needs a loading state and a fallback.
4. **Addressables**: only worth it past several MB of optional content.

## Decision

Option 2. The Foundry `.glb` files live in `Assets/_Game/Models/` and are imported by a small project `ScriptedImporter` (`GlbMeshImporter`), with no glTF package. `FoundryHulls` places them on the unit prefabs and maps each glTF material slot to an existing project material, so they add no shaders. Every class keeps its primitive build as the fallback. The carrier keeps its own hull because of its working landing bay.

## Consequences

- New ship art costs a `.glb` and a slot map, not a hull builder. Expect a few KB gzipped per model.
- #29 (runtime glTFast) is parked. Adding glTFast later would bring a second `.glb` importer; pick one.
- #28 shrinks to what Foundry doesn't cover: the shared rock mesh pool, and hulls for any class without a model.
- The importer only covers what the Foundry exports use (one mesh, positions and normals, no textures). A textured or multi-node model needs it extended, or a real glTF package.
- Revisit if optional content (music, other systems' art) passes a few MB: that is when streaming from StreamingAssets or Addressables pays off.
