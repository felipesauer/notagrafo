# docker buildx bake — builda as imagens da aplicação em paralelo, reaproveitando
# as camadas comuns (pnpm install + build de core/graph) entre os targets.
# Uso: `docker buildx bake` (todos) ou `docker buildx bake api worker`.
#
# api, worker e seed partem da mesma base (deps + build de core/graph/worker),
# então o BuildKit deduplica essas camadas numa única invocação — em vez de
# recompilá-las 3x como no build sequencial do compose.

group "default" {
  targets = ["api", "worker", "dashboard"]
}

target "api" {
  context    = "."
  dockerfile = "packages/api/Dockerfile"
  target     = "production"
  tags       = ["notagrafo-api:latest"]
}

target "worker" {
  context    = "."
  dockerfile = "packages/worker/Dockerfile"
  target     = "production"
  tags       = ["notagrafo-worker:latest"]
}

target "dashboard" {
  context    = "."
  dockerfile = "packages/dashboard/Dockerfile"
  target     = "production"
  tags       = ["notagrafo-dashboard:latest"]
}
