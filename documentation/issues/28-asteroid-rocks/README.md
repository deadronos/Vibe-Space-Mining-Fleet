# Issue #28 — Better asteroid rocks: shared mesh variant pool and richer shapes

Implements [GitHub #28](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/28).

## Summary of changes

- **Shared procedural variant pool (`Vibe-Space-Mining-Fleet/Assets/_Game/Scripts/World/AsteroidMeshPool.cs`):**
  - Generates `16` (`VariantCount = 16`) faceted rock variants once at startup behind the loading screen in a single `Mesh.AllocateWritableMeshData` / `Mesh.ApplyAndDisposeWritableMeshData` batch using a watertight frequency-5 icosphere template (`1500` faceted vertices / `500` triangles per variant, zero shared-seam cracks, outward-verified winding).
  - Replaces the six-way 2D `Mathf.PerlinNoise` mix with deterministic 3D gradient noise (`GradNoise3D`), multi-octave `Fbm3D`, and `Ridged3D` multifractal noise across four curated shape archetypes (`ElongatedSlab`, `Shard` with 6 cleavage planes, `Cratered` with 5 spherical-cap craters and raised rims, and `RidgedTerraced` with tilted strata steps).
  - Normalizes every variant around radius `0.5` so `SimAsteroid.Radius` (`0.5 * Scale`), drone standoff, and selection rings stay aligned.
  - Computes 1-ring / 2-ring topological concavity plus ridge/crater/cleavage crevice masks into vertex colors (`RGB` = subtle mineral facet variation darkened by crevice AO, `A` = AO `0.34..1.0`) and pre-bakes each variant's non-convex `MeshCollider` once via `Physics.BakeMesh(mesh.GetEntityId(), false)`.
- **Pooled rock views (`Asteroid.cs`, `AsteroidField.cs`):**
  - `AsteroidField` builds and owns the `AsteroidMeshPool` in `Bind` (before `WebBridge.Start()` emits `"ready"`) and disposes it in `OnDestroy`.
  - `Asteroid.Sync` selects `pool.ForSeed(rock.Seed)` on generation changes and assigns the shared `Mesh` to both `MeshFilter.sharedMesh` and `MeshCollider.sharedMesh` with zero per-respawn mesh allocations or collider bakes, while keeping seed-derived rotation/spin, mined-size scaling, and `MaterialPropertyBlock` iron/copper/ice/carbon and vein-gold tints.
- **Vertex-color + instanced URP rock shader (`Assets/_Game/Shaders/AsteroidLit.shader`, `MiningFleetSceneBuilder.cs`, `Rock.mat`):**
  - Added `SpaceMining/AsteroidLit` (`ForwardLit` via `UniversalFragmentPBR`, `ShadowCaster`, `DepthOnly`, `DepthNormals`) supporting per-instance `_BaseColor` via `UNITY_INSTANCING_BUFFER_START(Props)` (`MaterialPropertyBlock` + GPU instancing) alongside vertex-color facet shading and crevice AO (`_OcclusionStrength`, `_CreviceAlbedo`).
  - Updated `MiningFleetSceneBuilder.CreateMaterials()` and `Rock.mat` via **Space Mining Fleet → Build Demo Scene**.
- **EditMode tests (`Assets/_Game/Scripts/Editor/AsteroidTests.cs`):**
  - Added 4 EditMode tests verifying all 16 variant meshes (vertex/normal/color counts, outward normals, radius bounds, crevice AO range, distinctness), deterministic seed-to-variant coverage, pooled mesh reuse across respawns + `MeshCollider.Raycast` surface hits + mined scale shrinking, and `Rock.mat` shader/instancing setup.

## UVCS

- Branch: `/main/feature-28-asteroid-rocks`
- Changesets: `cs:89` (code, shader, material, scene, tests), `cs:90` (`Data/Plugins/lib_burst_generated.wasm` after WebGL build)

## Verification

- **Unity EditMode (`./scripts/unity-check.sh`):** `compiled`, `EditMode 278 of 278 passed` (274 existing + 4 new in `AsteroidTests`).
- **Unity Editor Play Mode:** Verified `poolReady=True`, `activeRocks=45`, `uniqueMeshes=15`, `508.6 fps`, and `AsteroidMeshPool.BuildAll()` warm build timing `14.93 ms` (`21.47 ms` cold including template construction).
- **Unity Web build + clean manifest:** `Succeeded size=10.4MB errors=0` (`unity.data.unityweb` 3,205,947 B, `unity.wasm.unityweb` 7,535,760 B — +39 KB total over `cs:88`, no new packages). `node scripts/verify-unity-manifest.mjs --require-clean` passed (`/main/feature-28-asteroid-rocks@cs:90 (clean), 4 files`).
- **Web shell (`pnpm run check` & `pnpm run build`):** `oxlint` `0` warnings/errors, `oxfmt --check` passed, `tsc -p .` passed, `11 of 11` Node tests passed, Vite production build succeeded.
- **Browser QA (`http://localhost:5202/`):**
  - Default `WebGPU` (`v0.17.0 · WebGPU · Unity 6000.6.8f1`): `60.00 fps`, `frameMs=16.67` (`p95=17.00`, `max=18.00`), `simMs=0.08`, `syncMs=0.28`, `0` console/page errors; mining lasers lock onto faceted rock surfaces with sparks.
  - `?renderer=webgl2` (`v0.17.0 · WebGL 2 · Unity 6000.6.8f1`): `60.00 fps`, `frameMs=16.67`, `0` console/page errors.
  - `?bench=500` (checked on `WebGPU` and `WebGL 2`): `500` drones (`146–154` in flight, `12–17` mining), `60.00 fps`, `frameMs=16.67` (`p95=17.00`, `max=18.00`), `syncMs=0.28–0.33`, `0` console/page errors.

## Open points

- UVCS branch `/main/feature-28-asteroid-rocks` (`cs:90`) is ready to merge to `/main` when requested.
