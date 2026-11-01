# Mothglass Ascent

A complete, browser-based action adventure set in an aerial glasshouse kingdom. Guide Vela from Dewglass Atrium through four regions, awaken the Root, Petal, and Pilgrim bells, defeat the Condensation Engine, and ascend to the High Lantern.

## Play

```sh
npm install
npm run dev
```

Open the local Vite address, then select **Enter the glasshouse** or press **Space**.

## Controls

- **A / D** or **arrow keys** — move
- **Space / W / Up** — jump; press again to double-jump
- **J / X / left click** — prism strike
- **Shift / K / C / right click** — sprint dash
- **Q** — bind lumen to restore health
- **F** — cast a piercing thread
- **E** — interact with bells, benches, travellers, and the exit
- **M / I / L / H** — map / inventory / journal / controls
- **Esc / P** — pause or close a panel

Touch controls appear on small screens and coarse-pointer devices.

## Systems

The game includes fixed-timestep platforming, coyote time and jump buffering, melee and ranged combat, three enemy types, a telegraphed boss encounter, collectible glass beads, three craftable upgrades, checkpoints, responsive HUD and menus, synthesized ambient audio, fullscreen, reduced motion, and a harder Clear Glass mode after victory.

Progress and preferences are saved defensively in this browser's local storage. There is no account, backend, or cross-device synchronization. Clearing site data removes the save.

## Build and test

```sh
npm run test
npm run build
npm run preview
```

The static production site is emitted to `dist/`.

## Art and implementation

The project adapts the supplied `make3d-mothglass-ascent` source package. It uses React, Three.js, original glasshouse artwork, code-generated canvas sprites, shader-driven mist and suspended glass prisms, and Web Audio. Font and software notices are retained in `CREDITS.md` and the bundled font license.
