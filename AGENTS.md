# AGENTS.md — AVA API

## Project

AVA API is the NestJS backend for AVA MY POS.

Stack:

* NestJS
* TypeScript
* TypeORM
* PostgreSQL
* REST API
* JWT

Frontend is a separate Electron + React project.

## Main Rules

* Make the smallest complete change.
* Read existing code before editing.
* Follow existing project structure and naming.
* Reuse existing modules, DTOs, entities, services, and helpers.
* Do not refactor unrelated code.
* Do not add dependencies unless necessary.
* Do not change API contracts without checking impact.
* Do not modify frontend code unless requested.

## NestJS

* Keep controllers thin.
* Put business logic in services.
* Use DTOs with `class-validator`.
* Use dependency injection.
* Avoid `any`.
* Use NestJS exceptions.
* Never expose passwords, PINs, hashes, tokens, or secrets.

## TypeORM and PostgreSQL

* Confirm actual entity fields and ID types before coding.
* Use parameterized queries.
* Avoid N+1 queries.
* Load only required fields and relations.
* Use transactions for multi-table writes.
* Create migrations for schema changes.
* Do not use `synchronize: true` in production.
* Do not rename or delete columns unless explicitly requested.

## Performance

AVA may contain 45,000+ products and large sales history.

* Never return unlimited lists.
* Use pagination and maximum limits.
* Filter, sort, group, and aggregate in PostgreSQL.
* Do not fetch all rows and process them in JavaScript.
* Add indexes only after checking existing indexes.

Standard pagination response:

```ts
{
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  total_pages: 0
}
```

## AVA Domain Rules

* Product price modes may include `FIXED_PRICE`, `OPEN_PRICE`, `WEIGHT_PRICE`, and `SERVICE_PRICE`.
* Use `unit_groups`, `units`, and `product_units` for multi-unit products.
* Convert stock using the base unit.
* Save sale-time product name, barcode, unit price, cost price, discount, and total.
* Never calculate historical profit from the current product cost.
* Every stock change should create a stock movement.
* Sales, returns, stock, payments, and points must use transactions.
* Promotions must not modify product master prices.
* Store settings and device settings must remain separate.
* Never trust `user_id`, role, price, discount, or device identity from the client without validation.

## Validation

After changes, run available commands from `package.json`, such as:

```bash
npm run build
npm run lint
npm run test
```

Fix only errors caused by the requested change.

## Response Style

Keep responses short.

Do not:

* Repeat the request.
* Explain basic NestJS concepts.
* Paste unchanged code.
* Provide multiple solutions unless necessary.
* Create extra documentation.
* Use excessive comments.

Final response format:

```text
Implemented:
- <change>

Files:
- <file>

Validation:
- Build: passed
- Tests: passed
```

Mention migrations, risks, or breaking changes only when applicable.
