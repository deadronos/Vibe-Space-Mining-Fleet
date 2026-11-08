# Keeping the web build small: procedural assets and streaming

Written 8 Nov 2026. Measured from the current build in `docs/` and from `~/Github/asteroid-fleet`.

## Where the size actually is

| File | Size (gzip) | What's in it |
| --- | --- | --- |
| `docs.wasm.unityweb` | 7.0 MB | Engine and C# code (IL2CPP). It barely grows as you add content. |
| `docs.data.unityweb` | 5.6 MB | Scenes, shaders (URP variants), built-in resources, fonts. Content lands here. |
| `docs.framework.js` + loader | 0.1 MB | JS glue |

**Meshes are not the problem.** All ten Foundry ship models in asteroid-fleet together are about **280 KB** (carrier 108 KB, drone 14 KB, fighter 17 KB, meteor 6 KB). On the web, the things that get big are **textures, audio, shader variants and fonts**.

## Rules of thumb

1. **Keep generating geometry in code.** The game already does this for asteroids (`Asteroid.BuildRockMesh`), the soft-dot texture, the starfield and the carrier.
   - Ships can be generated at startup in the same way. Write small C# builders for hulls: extrude a 2D outline, lathe a profile, add boxes and tapers with mirrored halves. This is the in-engine version of asteroid-fleet's Blender `foundry.py` / `shiplib.py` approach.
   - Seed every builder so each class always looks the same and variants are just different seeds.
   - Build each class's mesh **once** and share it (`sharedMesh`) across every instance. Each asteroid currently gets its own mesh. That's fine at 45 rocks, but for hundreds, build a pool of about 16 variants and reuse them.
   - For many meshes at startup, use the `Mesh.MeshData` API (`Mesh.AllocateWritableMeshData`), which works with Jobs and Burst. Spread generation across frames behind the loading screen so startup doesn't freeze.
2. **Colour comes from materials, not textures.** Use flat URP Lit materials, per-instance tint through `MaterialPropertyBlock`, and emission for glow (you already do this). Skip texture maps entirely, or generate small ones (noise, panel lines) into a `Texture2D` at runtime.
3. **Small glTF models are fine to ship as files.** A few hundred KB of `.glb` costs less than writing builders for complex shapes. The Foundry set can be used as-is.
4. **Watch shader variants.** URP's variant stripping and a single quality tier matter more than any model. Check the Build Report (`Window > General > Build Report`) after each build to see what grew.
5. **Audio:** if you add audio, use procedural synthesis (`OnAudioFilterRead`) or a few short compressed clips. Audio adds megabytes fast.

## Streaming assets from GitHub Pages

Yes. A Unity web build can download extra files after it starts, and GitHub Pages works as the host. The live site sends `access-control-allow-origin: *` and `cache-control: max-age=600` (checked with curl on `Build/docs.loader.js`), so cross-origin loads would work too. Files served from the same site have no CORS question at all.

**Watch out:** `WebBuild.BuildForPages` **deletes and rewrites `docs/` on every build**. Anything you copy into `docs/` by hand is lost on the next build. Have Unity output the extra files itself (option A), or extend the build script to copy them in afterwards (options B and C).

### Option A: StreamingAssets (simplest)

- Put the files in `Assets/StreamingAssets/`. The web build copies them to `docs/StreamingAssets/` and serves them as-is, uncompressed by Unity.
- Load them at runtime with `UnityWebRequest` from `Application.streamingAssetsPath + "/ships/drone.glb"`. On the web that path is a URL. Use `await`/coroutines, because synchronous file IO doesn't exist in the browser.
- These files are **not** part of the `.data` download, so the game starts sooner and the extras arrive later.
- Good for `.glb` models, JSON data (ship stats, system maps) and audio.

### Option B: glTFast at runtime

- Package `com.unity.cloud.gltfast`, used through `GltfImport.Load(url)` or the `GltfAsset` component with a URL. It downloads through `UnityWebRequest` and supports WebGL.
- Combine it with option A: ship `foundry_*.glb` in StreamingAssets and load each one when the class first appears. Show a procedural placeholder until it arrives.
- Alternatively, import the same `.glb` at **edit time** (glTFast is an importer too) and bake it into the build. At 280 KB total, that's also fine.

### Option C: Addressables with a remote catalog (for big content)

- Package `com.unity.addressables`. Enable **Build Remote Catalog** and set each remote group to `RemoteBuildPath` / `RemoteLoadPath`. The build writes `.bundle` files, a `catalog_*.json` and a `catalog_*.hash`. Upload or copy those to the host, for example `docs/ServerData/WebGL/`, through a post-build step in `WebBuild.cs`.
- Set the load path to `{UnityEngine.Application.absoluteURL}`-relative or the full Pages URL. `ResourceManager.InternalIdTransformFunc` can rewrite URLs at runtime, but it must be set before loading starts.
- Bundles hold real Unity assets: prefabs, materials, Unity-compressed textures, scenes. You can update content without rebuilding the player, because the game re-checks the catalog hash.
- This is overkill for a few small meshes. It's worth it if you add levels, textures or audio later.

## Recommendation

1. Keep everything procedural that is already procedural, and add a seeded ship-hull builder for the new classes (barge, hauler, fighter, scout, pirate).
2. If you want the Foundry look, put the `.glb` files in StreamingAssets and load them with glTFast at runtime, with the procedural hull as the fallback. The build doesn't grow, and the game still works if a download fails.
3. Consider Addressables only when there is several MB of optional content.

## Sources

- [Addressables: remote content intro, Unity docs](https://docs.unity3d.com/Packages/com.unity.addressables@2.8/manual/remote-content-intro.html)
- [Addressables: TransformInternalId, Unity docs](https://docs.unity3d.com/Packages/com.unity.addressables@2.7/manual/TransformInternalId.html)
- [Unable to load addressable from remote storage in WebGL (CORS), Unity Discussions](https://discussions.unity.com/t/unable-to-load-addressable-from-remote-storage-webgl-unity/257782)
- [glTFast runtime import, Unity docs](https://docs.unity3d.com/Packages/com.unity.cloud.gltfast@6.9/manual/ImportRuntime.html)
- [GltfAsset.Load, Unity docs](https://docs.unity3d.com/Packages/com.unity.cloud.gltfast@6.0/api/GLTFast.GltfAsset.Load.html)
- [glTFast on GitHub](https://github.com/atteneder/glTFast)
