# apps/api (placeholder)

This will be an ASP.NET Core Web API project, added in a later pass, exposing endpoints
that match the TypeScript interfaces in `apps/web/lib/data/*.ts` (one controller/endpoint
group per resource: opportunities, agents, contacts, awards, activity, twin, etc.).

No code lives here yet. `apps/web/lib/data` functions take no arguments related to a
backend base URL, so wiring this API in later is additive, not a rewrite.
