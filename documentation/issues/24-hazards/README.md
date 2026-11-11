# Field hazards

[GitHub #24](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/24)

## First slice

- Generate a debris field per system from the route seed, independently of asteroid and combat random draws. Apply damage over time through the existing hull and destruction rules.
- Let a completed scout survey chart nearby debris. Automated drones avoid charted debris when choosing a mining route. Direct orders retain player control.
- Give each system a solar storm cycle. Warn through the event log ahead of the storm, announce its start and end, and increase debris damage while the storm is active.
- Preserve charting and storm timing through save/load and warp. Older saves start with uncharted debris and a fresh storm timer.
- Show the field in Sensors and in the 3D view. Verify with EditMode tests and a browser playtest.

The first slice was later extended with radiation and automated flight avoidance.

## Starting numbers and behavior

The first slice places one debris field per system, with a radius of 22 units. Exposed fleet ships take 3 hull damage per second. The first storm starts after 6 minutes in-system, with a 30-second warning. It lasts 40 seconds and doubles debris damage. The timer pauses while the system is inactive. Save version 11 stores the chart and storm state for each visited system.

Once a scout charts a field, automated mining rejects rocks whose direct approach crosses the debris and reassigns affected drones. Direct orders can still cross it. The boundary changes from red to amber when charted.

## Verification

- EditMode covers exposed barge damage, scout charting and save reload, survey order replacement, and storm warning and damage.
- In the local browser build, a barge sent into the red Sensors ring dropped from full hull to 90%, then 87%. A scout survey turned the ring amber and logged the charting notice.

## Full field hazard scope

Each system also has a purple radiation zone with an 18-unit radius and 2 hull damage per second. Scouts chart it independently of debris. Automated drones steer around charted zones on approach and return legs when their destination is outside the zone. Manual orders and destinations inside a zone can still take a ship through it.

H₂ storms require gas giants and belong with [#25](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/25).

Unity implementation: `cs:77` on `/main/feature-24-hazards`. Final EditMode result: 257 of 257 passed.

- The final forced WebGL2 build rendered both the debris and radiation boundaries in Sensors view.
