#!/usr/bin/env bash
# Ambiente de desenvolvimento completo com teardown automático.
#
# Sobe a infra (Neo4j/Redis/MinIO/Mailpit) via docker compose, faz build das
# libs + seed, e roda api/worker/dashboard(Vite) em foreground. Ao encerrar
# (Ctrl+C, kill, ou saída por erro), um trap derruba a infra — liberando TODAS
# as portas do host. Um comando sobe tudo; um Ctrl+C limpa tudo.
set -euo pipefail
cd "$(dirname "$0")/.."

parou=0
teardown() {
    # idempotente: o trap dispara em INT/TERM e também no EXIT — evita rodar 2x.
    [ "$parou" = "1" ] && return
    parou=1
    echo ""
    echo "⏹  encerrando dev — derrubando a infra (libera as portas)…"
    # stop (não down): preserva os volumes/dados; só para os containers e solta
    # as portas. Use 'pnpm dev:down' para remover containers/rede também.
    docker compose stop >/dev/null 2>&1 || true
    echo "✓ infra parada."
}
# INT/TERM: Ctrl+C ou kill. EXIT: qualquer saída (inclusive erro do set -e).
trap teardown INT TERM EXIT

echo "▶  subindo infra (docker compose)…"
docker compose up -d --wait

echo "▶  build libs…"
pnpm dev:libs

echo "▶  seed…"
pnpm dev:seed

echo "▶  api + worker + dashboard (Vite :5173) — Ctrl+C encerra tudo"
# Foreground: quando morre (Ctrl+C), o trap EXIT acima roda o teardown.
pnpm dev:packages
