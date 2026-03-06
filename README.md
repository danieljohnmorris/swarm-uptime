# swarm-uptime

Uptime monitor built to run on Docker Swarm. Status page, API, background workers, the lot - no AWS required.

This is a reference project for deploying a full stack on a VPS with Dokploy Swarm instead of AWS. Blog post: [TODO]

## Stack

- **API** - Hono on Node
- **Worker** - BullMQ processing check jobs
- **Web** - Astro SSR status page
- **Queue** - Redis
- **Database** - Postgres
- **Proxy** - Traefik (SSL, routing, load balancing)

## Local dev

Start Postgres and Redis:

```bash
docker compose up postgres redis -d
```

Copy the env file:

```bash
cp .env.example .env
```

Run the migration:

```bash
cd api && npx drizzle-kit migrate
```

Start all three services (separate terminals):

```bash
cd api && npm run dev
cd worker && npm run dev
cd web && npm run dev
```

Add a monitor:

```bash
curl -X POST http://localhost:3001/monitors \
  -H "Content-Type: application/json" \
  -d '{"name": "Google", "url": "https://google.com", "interval": 30}'
```

Status page at http://localhost:4321

## Swarm deployment

Requires a Docker Swarm cluster (single node is fine for testing). Set your env vars in `.env` then:

```bash
docker stack deploy -c docker-compose.swarm.yml uptime
```

Traefik handles SSL via Let's Encrypt. Set `API_DOMAIN` and `STATUS_DOMAIN` in your env.

## What this replaces on AWS

| AWS | Swarm |
|-----|-------|
| ALB | Traefik |
| ECS/Fargate | Swarm services |
| RDS | Postgres container |
| SQS + Lambda | BullMQ + worker container |
| CloudFront | Cloudflare (free) |
| VPC + NAT Gateway | Docker overlay network |
| CloudWatch | Docker logs / Grafana |
