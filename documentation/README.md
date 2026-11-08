# Documentation

Project notes for Vibe Space Mining Fleet.

## Project

- [web-shell.md](web-shell.md): the web page around the Unity build, the TypeScript ↔ Unity bridge, saves, and how to release.

## For agents

- [../AGENTS.md](../AGENTS.md): the entry point (`CLAUDE.md` imports it). It lists the guides in [agents/](agents/): repo layout, driving the Unity Editor, Unity Version Control, the web shell and GitHub, the web build, changes across C# and TypeScript, and issues.
- [agents/decisions/](agents/decisions/README.md): accepted decisions (ADRs) and the open `decision needed` issues.

## Issue notes

- [issues/](issues/): per-issue notes, especially for Unity-side work that git can't show. For example, [#31 EditMode tests](issues/31-unity-editmode-tests-for-fleetsim/README.md).

## Research

- [research/adapting-asteroid-fleet.md](research/adapting-asteroid-fleet.md): what to take from `~/Github/asteroid-fleet` and how to make this game more RTS and Homeworld-like, with suggested phases.
- [research/assets-and-streaming.md](research/assets-and-streaming.md): where the web build's size comes from, generating meshes procedurally, and streaming extra files from GitHub Pages (StreamingAssets, glTFast, Addressables).
- [research/homeworld-and-space-rts.md](research/homeworld-and-space-rts.md): research notes on Homeworld 1–3, Deserts of Kharak, Dust Fleet, Falling Frontier, Nebulous and Beyond All Reason, RTS control conventions, and Unity performance at RTS unit counts, with sources.
