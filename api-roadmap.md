# 📌 Project Roadmap (Kanban)

## 🟢 To Do (Próximas tarefas a implementar)

### 🔑 Auth (base do projeto)

- [x] `POST /auth/login` → login de usuário
- [ ] `POST /auth/logout` → logout _(talves faça)_

---

### 👤 User

- [x] `POST /user` → criar usuário
- [x] `GET /user/profile` → buscar perfil logado

---

### 📖 Story

- [x] `POST /story` → criar história
- [x] `GET /story/:slug` → buscar história por slug
- [x] `PATCH /story/:id` → editar história
- [x] `DELETE /story/:id` → deletar história
- [x] `GET /story/me` → buscar histórias do usuario
- [x] `GET /story` → lista com filtros, ordenação e paginação
- [ ] `GET /story/:id/recommendations` → recomendações de histórias
- [ ] `GET /story/rankings` → rankings
- [ ] `GET /story/editor-picks` → escolhas do editor
- [ ] `GET /story/latest-updates` → últimas atualizações

---

### 📚 Volume

- [x] `POST /volume/create/:storyId` → criar volume
- [x] `GET /volume/all/:storyId` → buscar todos os volumes da historia
- [ ] `PATCH /volume/:volumeId` → editar volume
- [ ] `DELETE /volume/:volumeId` → deletar capítulo

---

### 📚 Chapter

- [x] `POST /chapter/create/:volumeId` → criar capitulo
- [x] `GET /chapter/volume/:volumeId` → buscar todos os capitulos do volume
- [ ] `PATCH /chapter/:volumeId` → editar volume
- [ ] `DELETE /chapter/:volumeId` → deletar capítulo

---

### 💬 Comments & Reviews

- [ ] `POST /story/:id/comment` → comentar em história
- [ ] `POST /chapter/:id/comment` → comentar em capítulo
- [ ] `POST /announcement/:id/comment` → comentar em anúncio
- [ ] `GET /story/:id/comments` → listar comentários (paginação)
- [ ] `POST /story/:id/review` → avaliar história (5 critérios)
- [ ] `GET /story/:id/reviews` → listar avaliações com média

---

### 🌟 Highlights (Destaques)

- [ ] `POST /highlight` → criar destaque
- [ ] `PATCH /highlight/reorder` → reordenar destaques (máx. 4 ativos)
- [ ] `GET /highlight/active` → buscar 4 ativos
- [ ] `DELETE /highlight/:id` → remover destaque

---

### 📢 Announcements (Anúncios)

- [ ] `POST /announcement` → criar anúncio (rascunho/publicado)
- [ ] `PATCH /announcement/:id` → editar anúncio
- [ ] `DELETE /announcement/:id` → deletar anúncio
- [ ] `GET /announcement/active` → buscar 3 ativos
- [ ] `GET /announcement/:id` → buscar anúncio
- [ ] `GET /announcement` → listar anúncios (paginação)

---

### 📖 Reading History

- [ ] `POST /reading-history` → salvar progresso de leitura
- [ ] `GET /reading-history` → listar histórico do usuário

---

## 🟡 In Progress (quando começar a implementar)

- Story CRUD completo
- Chapters com reordenação
- Filtros e recomendações

---

## 🔵 Done (já implementadas)

- `POST /auth/login`
- `POST /user`
- `GET /user/profile`
- `POST /story`
- `GET /story/:slug`
