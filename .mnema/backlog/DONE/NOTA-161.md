---
mnema:
  key: NOTA-161
  state: DONE
  title: >-
    Compose: restart:no + portas de host configuráveis (não ocupar portas de
    outras apps)
  description: >-
    Containers usavam restart:unless-stopped + portas fixas → voltavam sozinhos
    no boot e ocupavam 3000/8080/7474/7687/9000/9001/6390/8035/1035
    permanentemente, atropelando outras apps locais. Corrigido: restart:'no' em
    todos os serviços + todas as portas de host via ${VAR:-default}.
    .env.example documentado. Containers antigos derrubados; 9 portas
    confirmadas livres via ss.
  acceptance_criteria:
    - Zero restart:unless-stopped no compose
    - Todas as portas de host em ${VAR:-default}
    - docker compose config válido
    - .env.example com seção de portas
    - Portas livres após down
  labels:
    - docker
    - dx
    - infra
  estimate: 1
  priority: 2
  assignee: 019f03ba-735c-725c-b52a-22a88c9abe61
  reporter: 019f0164-3101-76bc-af75-94e9b1380134
  epic_key: null
  sprint_key: null
  reopen_count: 0
  metadata: {}
  updated_at: '2026-07-07T14:04:42.182Z'
---
# Compose: restart:no + portas de host configuráveis (não ocupar portas de outras apps)
