# Simplify Square Roots (Prime Factors)

React SPA for prime-factorization-based square root simplification. Math rendering via KaTeX / MathJax wrappers; Vite + Tailwind.

**Live:** https://content-interactives.github.io/simplify_square_roots_prime_factors/

**Curriculum and standards:** [Standards.md](Standards.md)

## Stack

- React 19, Vite 7, JavaScript (JSX)
- Tailwind CSS 3
- `better-react-mathjax`, `katex`, `react-katex`, `lucide-react`

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Build → `dist/` |
| `npm run preview` | Preview `dist/` |
| `npm run lint` | ESLint |
| `npm run deploy` | Build + `gh-pages -d dist` |

## Configuration

`vite.config.js`: `base: '/simplify_square_roots_prime_factors/'`.

## Layout

`src/main.jsx` entry; feature components and assets under `src/` and `public/`.
