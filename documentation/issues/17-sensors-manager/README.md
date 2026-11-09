# Sensors Manager

[GitHub issue #17](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/17)

Git branch `feature/17-sensors-manager` and UVCS branch
`/main/feature-17-sensors-manager` at Unity changeset `cs:24`, merged into Unity `/main` as `cs:25`.

- Space and the Sensors HUD button toggle the angled tactical plot. The mouse wheel
  enters it at 210 units and returns to the fleet view at 170. Shift+Space and
  the existing HUD button toggle auto-launch.
- The tactical view dims the scene and draws a tilted plane with range rings.
  Geometric contacts identify ships and rocks, with altitude stems for selected
  ships and raiders. Selected orders appear as thin routes. Survey results
  briefly draw the scan radius, and incoming raids pulse at their origin.
- Ore chain and Build fold into headers in Sensors and can be reopened there.
  Selection, control groups, alerts, and context orders remain available.
- A deployed mining drone can scout. Select it, press V or click Survey, and
  right-click a point in the field. When the drone reaches it, it surveys a
  45-unit radius. Active rocks with at least half the remaining ore of the
  richest active rock become veins. The event log reports the survey result.
- The automatic mining score favors marked veins by a factor of 1.5. Existing
  orders continue until completed, and depleted rocks lose their vein status
  when they respawn.
- Save version 4 preserves veins and survey orders. Versions 2 and 3 still load
  with no marked veins.
- The HUD button gives touch users an entry point. Touch orders and pinch zoom
  are part of [#41](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/41).
  Hazard charting and avoidance are part of
  [#24](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/24).

Unity compiled successfully and all 53 EditMode tests passed, including the
survey order, vein round trip, and version 3 migration test. The Unity web
build succeeded at 10.2 MB, and `pnpm run check` passed.

In Chrome on WebGPU, a version 3 fixture loaded, a drone was selected from
its tactical marker, and a survey order revealed two veins. The drone then
headed to a marked rock. Separate browser checks verified Space, the Sensors
button, zooming across both thresholds, and Shift+Space for auto-launch.

The updated tactical plot was checked in Chrome on WebGPU. Geometric contacts
and the ore chain header aligned with the tilted view, and the survey circle
appeared around the two new veins.
