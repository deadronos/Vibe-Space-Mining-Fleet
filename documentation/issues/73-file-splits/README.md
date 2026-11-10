# Code quality 3/4: split the large sim and RTS files

[GitHub issue #73](https://github.com/deadronos/Vibe-Space-Mining-Fleet/issues/73)

The first slice was checked in as cs:63 on `/main/feature-73-file-splits`, based on cs:62, and merged into UVCS `/main` as cs:64.

The save/load, drone, logistics, throughput, and asteroid sections of `FleetSim.cs` now have their own partial files. The moved sections retain their original source text. Unity generated the five script metadata files.

`scripts/unity-check.sh` compiled and passed 169 of 169 EditMode tests on the feature branch and on the UVCS merge result.

Remaining work includes the combat and sim type splits, the RTS controller extractions, regenerating the demo scene for the overlay component, and checking selection, orders, and touch in a fresh web build.
