# I Solidi

An interactive website that teaches 3D solids to primary school children (third grade, in Italian).

- **Solidi di rotazione** (solids of revolution): a plane figure turns around an axis and a solid is
  born. The animation can be played forwards and backwards, or scrubbed with a slider.
  With **Disegna tu** children draw their own figure and watch the solid it generates; they can give
  it a name and save it (in the browser's local storage, so only on that browser and computer).
- **Smontiamo i solidi** (unfolding solids): cube, cuboid, triangular prism, square pyramid, cylinder
  and cone open up face by face until they lie flat as a net, one face at a time or all together.

The site is static: Three.js for the 3D views, plain TypeScript and DOM for everything else.

## Getting started

Requires Node 26 (see `.nvmrc`).

```sh
nvm use
npm ci
npm run dev        # development server
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | Biome lint, including the layer dependency rules |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | All of the above, then the production build in `dist/` |
| `npm run preview` | Serves the production build |

## Project structure

The code follows a lightweight DDD layout; dependencies only point inward.

```
src/
  domain/          pure model: plane figures, polyhedra, nets, unfolding math (no DOM, no scene)
    geometry/        shared kernel (points, polygon checks)
    revolution/      solids of revolution
    nets/            polyhedra and their nets
  application/     page state and use cases (playback, solid selection, drawing); no DOM
  presentation/    Italian texts and grammar, Three.js views, DOM widgets, colors, styles
  infrastructure/  browser storage, behind interfaces defined by the application layer
  entries/         entry point of each page: wires the layers together
```

Code, comments and identifiers are in English; Italian appears only in the text shown to children.

## Continuous integration and deployment

The GitHub Actions workflow in `.github/workflows/ci.yml` runs type checks, lint, tests and the build
on every pull request and on every push to `master`. Pushes to `master` are then published on
GitHub Pages (Settings → Pages → Source must be set to "GitHub Actions").

## License

Copyright (C) 2026 Matteo Zeccoli Marazzini

This program is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program
(see [COPYING](COPYING)). If not, see <https://www.gnu.org/licenses/>.
