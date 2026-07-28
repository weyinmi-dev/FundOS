# FundOS

FundOS is an AI operating system for nonprofit/startup fundraising — an AI team of 12 named
agents that discovers funding opportunities, drafts proposals, manages funder relationships,
and administers awards.

This repo is a Next.js port of the `docs/reference/FundOS.dc.html` mockup. See
`docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` for the design this port
follows, and `docs/superpowers/plans/` for the implementation plans.

## Layout

- `apps/web` — the Next.js 15 application (this pass)
- `apps/api` — placeholder for a future ASP.NET Core Web API
- `infra` — placeholder for a future .NET Aspire AppHost + docker-compose

## Running

```bash
cd apps/web
npm install
npm run dev
```
