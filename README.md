# dome.ms

Member-owned hosting and protection for Münster. Describe a site, get a static page on `*.dome.ms` or your own domain, and see who is visiting. This repository is the Django API and the Next.js app.

## Live

- [dome.ms](https://dome.ms) — site and dashboard
- [status.dome.ms](https://status.dome.ms) — nodes, services, and certificates
- [api.dome.ms](https://api.dome.ms) — API
- [id.dome.ms](https://id.dome.ms) — login
- [grafana.dome.ms](https://grafana.dome.ms) — metrics

The NixOS cluster that runs these hosts is [dome-ms-infra](https://github.com/Just-another-Muensterhack/dome-ms-infra).

## Layout

| Path | Role |
| --- | --- |
| `service/` | Django API (`django-ninja`), Postgres, Keycloak login |
| `web/` | Next.js frontend |
| `flake.nix` | Packages and the local dev shell |

## Develop

Docker is required for Postgres and Keycloak.

```bash
nix develop
run-dev-all
```

| Command | What it starts |
| --- | --- |
| `run-dev-all` | Keycloak, Postgres, API, and frontend |
| `run-dev-infra` | Keycloak (`msdome` realm) and Postgres |
| `run-dev-backend` | Django on port 8000 |
| `run-dev-frontend` | Next.js on port 3000 |

`run-dev-infra --down` stops the containers.

## License

[MIT](LICENSE)
