# Changelog

## b018 — 2026-08-08

- Câmera 3ª pessoa em órbita: ao olhar para baixo, sobe por cima do personagem para ver os pés (sem atravessar o chão)
- Cache `b018`

## b017 — 2026-08-08

- Cabeça/pescoço alinhados com a câmera (não mais invertidos cima/baixo nem esquerda/direita)
- 1ª pessoa usa o mesmo sentido de pitch que a 3ª pessoa
- Cache `b017`

## b016 — 2026-08-08

- Crônicas em painel único sequencial (fala → fato), com tempo de leitura maior e sem sobreposição de toast/balão
- Ciclo dia/noite completo (não fica preso no dia); estações e clima mais rápidos
- Chuva e vento mais visíveis (partículas + balanço das árvores); sessão começa sob chuva legível
- Câmera: olhar para o chão (pitch ampliado); ainda sem enterrar a câmera no terreno
- Cache `b016`

## b015 — 2026-08-08

- HUD compacta em coluna flex (sem sobreposição)
- No celular: objetivo longo oculto; chips pequenos; gameplay em primeiro plano
- Cache `b015`

## b014 — 2026-08-08

- Splash limpa: «Os primeiros povos» + jornada na mata (sem Cananéia / spoilers)
- Tela de personagem: só o nome **ALBERT** (sem descrição)
- Cache `b014`

## b013 — 2026-08-08

- Tom de fronteira / exploração (mood Last of the Mohicans — trilha **original**, sem OST licenciada)
- Score: pads épicos, frase ascendente, batida de trilha
- NPC caçador Yacuã + Karaí como caçador a cavalo; splash/pitch atualizados
- Cache `b013`

## b012 — 2026-08-08

- Enredo ampliado: Cananéia e a exploração da América do Sul
- 6 NPCs históricos/míticos (só Albert é jogável): Carijó a cavalo, Bacharel, Vespúcio, Martim Afonso, anciã, Espírito do Peabiru
- NPCs surgem aleatoriamente; interação (E) revela fatos históricos
- HUD «Crônicas»; tema/splash atualizados
- Cache `b012`

## b011 — 2026-08-08

- Estações do ano (primavera → verão → outono → inverno) com cores e clima próprios
- Clima jogável: névoa, chuva, vento, tempestade de areia + partículas
- Áudio ambiente acompanha chuva/vento/areia e dia/noite
- Ciclo dia/noite mais presente; HUD mostra estação · dia/noite · clima
- Cache `b011`

## b010 — 2026-08-08

- Câmera 3ª pessoa fica acima do chão; olhar cima/baixo é cabeça/pescoço + ponto de mira
- Pescoço/cabeça sincronizados com a câmera (esquerda/direita e cima/baixo)
- Óculos de grau com lentes transparentes (olhos visíveis)
- Cache `b010`

## b009 — 2026-08-08

- Albert redesenhado a partir da foto do protagonista: óculos, barba, jaqueta azul, zíper laranja, mochila
- Face regenerada (pele clara-média, óculos pretos, barba)
- Cache `b009`

## b008 — 2026-08-08

- Cena bem mais clara: sol/hemi/fill + névoa mais leve + dia mais longo
- Albert iluminado (key/rim) para não sumir na névoa
- Câmera 3ª pessoa olha para cima/baixo de verdade (órbita com pitch)
- Mira escondida em 3ª pessoa; HUD mais limpa no celular
- Cache `b008`

## b007 — 2026-08-08

- Albert deixa de caminhar de costas: corpo vira na direção do movimento
- Skin limpa (sem coroa de espinhos / glow tech); bolsa no quadril
- Áudio da mata: passos, pássaros, uivo de lobo, coruja, rio por proximidade
- Look touch mais responsivo; master um pouco mais alto
- Cache `b007`

## b006 — 2026-08-08

- Skin do Albert atualizada para teste de produção: pele cobre, manto verde-musgo, pintura de argila, coroa de penas, amuleto âmbar
- Face regenerada (olhos âmbar + marcas vermelhas/brancas)
- Cache `b006` em HTML / SW / build

## b003 — 2026-08-08

- Produção HostGator em **https://jhonatanribeiro.com/spirit/** (SPIRIT)
- Pacote FTP: `release/hostgator-spirit/`

## b002 — 2026-08-08

- Trilha sonora procedural (drone, pad, melodia esparsa, dia/noite)
- 4 animais místicos (cervo-luz, coruja-sílex, raposa-eco, peixe-lua)
- 5 mistérios para vencer + 3 placas de lore opcionais
- Vaga-lumes, pegadas-guia, pistas dos espíritos
- Albert 3D melhorado (já em b001.1 session) mantido

## b001 — 2026-08-08

- Vertical slice da receita: splash → Albert → dificuldade → play
- Floresta densa, rio, 3 puzzles, win condition
- 1ª/3ª pessoa, touch, áudio procedural da mata
- Build HostGator-safe (não sobrescreve `data/` vivo)
- Smoke test + API PHP stubs (leaderboard/signal/tickets)
