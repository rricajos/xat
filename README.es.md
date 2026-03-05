# Xat

**Plataforma open-source de soporte al cliente, omnicanal.**
Alternativa a Intercom, Zendesk y Chatwoot — construida desde cero con SvelteKit.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![README in English](https://img.shields.io/badge/README-English-blue)](README.md)

---

## Que es Xat?

Xat es una plataforma de customer engagement completamente open-source, desarrollada desde cero con un stack moderno basado en **SvelteKit**. Ofrece bandeja de entrada omnicanal, automatizacion inteligente, help center y campanas proactivas — todo en una sola aplicacion.

> **Nota:** Este proyecto es una implementacion independiente. No es un fork ni contiene codigo de ningun otro proyecto. Todo el codigo es original, escrito desde cero y licenciado bajo Apache 2.0.

---

## Convenciones de Codigo

> **Todo el codigo se escribe en ingles.** Esto incluye: nombres de variables, funciones, clases, archivos, rutas, endpoints de API, columnas/tablas de base de datos, comentarios, mensajes de commit, mensajes de error, logs y docstrings.

**Convenciones de nombrado:**
- Archivos y carpetas: `kebab-case` (ej: `automation-rules.ts`, `canned-responses/`)
- Variables y funciones: `camelCase` (ej: `getConversations`, `assignedAgent`)
- Types e interfaces: `PascalCase` (ej: `Conversation`, `InboxChannel`)
- Tablas de base de datos: `snake_case` (ej: `account_users`, `custom_attributes`)
- Endpoints de API: `kebab-case` (ej: `/api/v1/canned-responses`)
- Constantes y enums: `UPPER_SNAKE_CASE` (ej: `CONVERSATION_STATUS`, `MAX_RETRY_COUNT`)
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) en ingles (ej: `feat: add round-robin assignment`)

---

## Comparacion de Stack

| Capa | Chatwoot | Xat |
|------|----------|-----|
| Backend Framework | Ruby on Rails | SvelteKit (server) |
| Frontend Framework | Vue.js | Svelte 5 |
| Lenguaje | Ruby + JavaScript | TypeScript (full-stack) |
| Base de Datos | PostgreSQL | PostgreSQL |
| ORM | ActiveRecord | Drizzle ORM |
| Cache / Pub-Sub | Redis | Redis |
| Jobs en Background | Sidekiq | BullMQ |
| Almacenamiento | ActiveStorage (S3) | S3-compatible (MinIO / AWS S3) |
| WebSockets | ActionCable | Socket.IO |
| Serialization | jbuilder | SuperJSON / native |
| CSS | Tailwind CSS | Tailwind CSS |
| Componentes UI | Custom Vue | shadcn-svelte |
| Widget | Vue (iframe/SDK) | Svelte (Web Component/SDK) |
| Autenticacion | Devise | Lucia Auth |
| i18n | Rails i18n | Paraglide.js |
| Testing | RSpec + Cypress | Vitest + Playwright |
| Contenedores | Docker | Docker |

---

## Features Completas

### Canales de Comunicacion (13+)

| Canal | Descripcion |
|-------|-------------|
| **Website Live Chat** | Widget embebible, SDK JavaScript (`xat.js`), HMAC identity validation, pre-chat form configurable, dark mode, greeting message, business hours, continuidad de conversacion |
| **Email** | Recepcion via IMAP polling o forwarding webhook, envio via SMTP, parsing de hilos de email, firma de agente |
| **WhatsApp** | WhatsApp Business API (Cloud API / proveedores como 360dialog), templates, mensajes interactivos |
| **Facebook Messenger** | Via Graph API, mensajes, imagenes, attachments |
| **Instagram DMs** | Via Graph API, story replies, mensajes directos |
| **Twitter/X DMs** | Via API v2, mensajes directos |
| **Telegram** | Via Bot API, mensajes, archivos, stickers |
| **LINE** | Via Messaging API |
| **SMS** | Via Twilio u otros proveedores |
| **Voice** | Llamadas inbound/outbound, flujos de voz basicos |
| **TikTok** | Mensajes directos (experimental) |
| **API Channel** | Canal generico via webhooks para integraciones custom |
| **Custom Channels** | Framework extensible para agregar nuevos canales |

### Conversaciones

- **Estados:** abierta, resuelta, pendiente, pospuesta (snoozed)
- **Prioridad:** urgente, alta, media, baja, ninguna
- **Asignacion:** manual a agente, manual a equipo, round-robin, auto-asignacion por reglas
- **Etiquetas (labels)** en conversaciones
- **Notas privadas** entre agentes (no visibles al cliente)
- **Menciones** (@agente) en notas privadas
- **Participantes** de conversacion (multiples agentes)
- **Typing indicators** en tiempo real
- **Read receipts** (confirmacion de lectura)
- **Rich text** en mensajes (markdown, formatting)
- **Emoji picker**
- **Archivos adjuntos** (drag & drop, imagenes, documentos, videos)
- **Notas de voz** (audio recording)
- **Mensajes interactivos** (botones, listas, cards)
- **Bulk actions** (resolver, asignar, etiquetar multiples conversaciones)
- **Mute/unmute** conversaciones
- **Enviar transcripcion** por email
- **Conversation workflows:** atributos requeridos antes de resolver

#### Sidebar de Conversacion (Panel Derecho)

- Informacion del contacto (nombre, email, telefono, ubicacion, IP)
- Atributos personalizados de la conversacion
- Atributos personalizados del contacto
- Conversaciones previas del contacto
- Participantes de la conversacion
- Acciones rapidas (asignar, etiquetar, priorizar)

### Contactos

- **Perfil unificado** del contacto con historial completo de conversaciones
- **Notas del contacto** (registrar llamadas, reuniones, notas manuales)
- **Atributos personalizados** (texto, numero, fecha, lista, checkbox, link)
- **Etiquetas** en contactos
- **Segmentos de contactos** (filtros avanzados guardados en sidebar)
- **Import/Export CSV** de contactos
- **Merge** de contactos duplicados
- **Companies/Organizations** asociadas a contactos
- **Filtros avanzados** (por nombre, email, telefono, ubicacion, atributo custom, operadores: equals, not equals, contains, does not contain, present, not present)

### Equipos y Agentes

- **Equipos (Teams)** con miembros asignados
- **Roles predefinidos:** owner, administrator, agent
- **Custom Roles** con permisos granulares
- **Disponibilidad del agente:** online, busy, offline
- **Agent Capacity** — limite de conversaciones simultaneas por agente
- **Auto-asignacion** respetando disponibilidad y capacidad
- **Round-robin** distribucion equitativa

### Automatizacion

#### Automation Rules (Reglas basadas en eventos)

Motor de reglas con estructura **Evento -> Condiciones -> Acciones**:

**Eventos (Triggers):**
- Conversacion creada
- Conversacion actualizada
- Conversacion reabierta
- Mensaje creado

**Condiciones** (combinables con AND/OR):
- Contenido del mensaje (contains, equals)
- Estado, inbox, equipo, agente asignado
- Etiquetas, prioridad
- Atributos del contacto o conversacion
- Email, telefono, pais del contacto
- Browser language del visitante

**Acciones:**
- Asignar agente o equipo
- Agregar/remover etiqueta
- Cambiar prioridad
- Resolver, posponer (snooze), silenciar (mute)
- Enviar mensaje al cliente
- Enviar email a un agente/equipo
- Asignar SLA policy

#### Macros

- Secuencias de acciones guardadas, ejecutables con un click
- Acciones secuenciales definidas en orden
- Macros privados (personales) o compartidos (team-wide)
- Preview antes de ejecutar
- Accesibles desde la barra de comandos

#### SLA Policies

- **First Response Time** — tiempo maximo para primera respuesta
- **Next Response Time** — tiempo maximo entre respuestas
- **Resolution Time** — tiempo maximo para resolver
- Alertas antes de incumplimiento (breach)
- Asignacion automatica via automation rules
- Reportes de cumplimiento (hit rate)

#### Business Hours

- Horario configurable por inbox
- Respuestas automaticas fuera de horario
- Calculo de SLA respetando business hours

### Campanas

#### Ongoing Campaigns (Continuas)

- Mensajes proactivos en el website live chat
- Trigger basado en URL de pagina (soporta wildcards para subdirectorios)
- Configurable por tiempo en pagina
- Enviado por bot o agente

#### One-off Campaigns (Puntuales)

- Envio masivo a audiencia segmentada por etiquetas
- Canales: SMS, WhatsApp (templates pre-aprobados)
- Programacion de envio (scheduled)
- Campos: titulo, mensaje, inbox, audiencia, fecha/hora

### Help Center (Base de Conocimiento)

- **Multiples portales** por cuenta
- **Categorias y subcategorias** para organizar contenido
- **Editor de articulos** (rich text / Markdown)
- **Portal publico** con busqueda full-text
- **Multi-idioma** — cada locale con su propia estructura de URLs
- **SEO:** meta tags, sitemap, URLs amigables
- **Custom domain** con SSL
- **Integracion con widget:** sugerir articulos antes de iniciar chat
- **Autoria:** cada articulo tiene un autor asignado

### Reportes y Analiticas

#### Dashboard Overview

- Conversaciones abiertas, no atendidas, sin asignar
- Metricas en tiempo real

#### Tipos de Reporte

| Reporte | Metricas |
|---------|----------|
| **Conversations** | First response time, resolution time, resolution count, CSAT |
| **Agents** | Metricas por agente individual |
| **Labels** | Volumen y rendimiento por etiqueta |
| **Inboxes** | Metricas por canal/inbox |
| **Teams** | Rendimiento por equipo |
| **CSAT** | Puntuaciones de satisfaccion con filtros por inbox, agente, equipo |
| **SLA** | Hit rate, misses, cumplimiento por politica |

#### Funcionalidades de Reportes

- Filtros por periodo: dias, semanas, meses
- Graficas de tendencia (line charts)
- Tablas paginadas y filtrables
- Exportacion a CSV
- Encuestas CSAT al resolver conversacion (configurable por inbox)

### Integraciones

| Integracion | Descripcion |
|-------------|-------------|
| **Slack** | Notificaciones de conversaciones + responder directamente desde Slack |
| **Dialogflow** | Chatbots con NLU de Google |
| **Google Translate** | Traduccion automatica de mensajes en 100+ idiomas |
| **Linear** | Convertir feedback del cliente en issues de Linear |
| **Dyte** | Video llamadas con el cliente desde el live chat |
| **Dashboard Apps** | Embeber herramientas internas como iframes en la sidebar |
| **Webhooks** | Callbacks HTTP en tiempo real por eventos (conversaciones, mensajes, contactos) |
| **Agent Bot API** | Webhook-based: enviar eventos a endpoint externo, recibir respuestas, handoff a humano |

### UI / UX

#### Navegacion Principal (Sidebar)

1. **Conversations** — bandeja de entrada principal
2. **Contacts** — directorio de contactos
3. **Reports** — analiticas y reportes
4. **Campaigns** — campanas proactivas
5. **Help Center** — gestion de la base de conocimiento
6. **Settings** — configuracion de la cuenta

#### Sidebar de Conversaciones (Panel Secundario)

- **All Conversations** — todas las conversaciones de la cuenta
- **Mentions** — conversaciones donde te mencionaron (@)
- **Unattended** — conversaciones sin respuesta
- **Custom Folders** — filtros de conversacion guardados (saved views)
- **Labels** — acceso rapido por etiqueta
- **Teams** — conversaciones por equipo

#### Command Bar (Cmd+K / Ctrl+K)

- Navegacion rapida a cualquier seccion (Settings, Reports, Contacts, etc.)
- Acciones contextuales sobre la conversacion actual:
  - Resolver / reabrir
  - Asignar agente o equipo
  - Agregar etiqueta
  - Silenciar / snooze
  - Enviar transcripcion por email
- Ejecutar macros
- Busqueda global

#### Keyboard Shortcuts

| Shortcut | Accion |
|----------|--------|
| `Cmd/Ctrl + K` | Abrir command bar |
| `Cmd/Ctrl + /` | Ver todos los shortcuts |
| `Cmd/Ctrl + Enter` | Enviar mensaje |
| `Cmd/Ctrl + E` | Resolver conversacion |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `J` / `K` | Navegar entre conversaciones |
| `Alt + N` | Nueva conversacion |

#### Temas y Accesibilidad

- **Dark mode** en dashboard y widget (auto / light / dark)
- **Font size selector** (6 opciones: smaller -> extra large)
- **i18n** — 30+ idiomas soportados (gestionado via Crowdin/Paraglide)

### Notificaciones

| Tipo | Descripcion |
|------|-------------|
| **In-app** | Centro de notificaciones (bell icon) con lista |
| **Audio** | Alertas sonoras configurables (multiples sonidos, condiciones de activacion) |
| **Email** | Notificaciones por email (nueva conversacion, asignacion, mencion) |
| **Push** | Push notifications en browser y mobile |

**Preferencias granulares por tipo:**
- New conversation alerts
- Assignment notifications
- Mention notifications
- New message in assigned conversation

**Audio alerts configurables:**
- Solo cuando la ventana no esta activa
- Cada 30 segundos hasta que se lean las conversaciones asignadas

### Profile Settings

- Avatar, nombre, display name
- Disponibilidad (online, busy, offline)
- Preferencias de notificacion (audio, email, push)
- Idioma del dashboard
- Tamano de fuente
- Firma de email del agente

### Settings (Administracion)

| Seccion | Contenido |
|---------|-----------|
| **Account** | Nombre, logo, timezone, idioma del sitio |
| **Inboxes** | CRUD de inboxes, configuracion por canal (greeting, auto-assignment, CSAT toggle, pre-chat form, business hours, HMAC) |
| **Agents** | Invitar, desactivar, cambiar rol, ver capacidad |
| **Teams** | Crear equipos, asignar miembros |
| **Labels** | Crear y gestionar etiquetas |
| **Canned Responses** | Templates de respuesta rapida |
| **Macros** | Crear y gestionar macros |
| **Custom Attributes** | Definir campos custom para conversaciones y contactos |
| **Custom Roles** | Crear roles con permisos granulares |
| **Automation** | Reglas de automatizacion |
| **SLA Policies** | Politicas de nivel de servicio |
| **Conversation Workflows** | Atributos requeridos al resolver |
| **Integrations** | Conectar/desconectar apps (Slack, Dialogflow, Linear, Dyte) |
| **Applications** | Dashboard Apps (iframes) |
| **Audit Log** | Registro de quien hizo que y cuando |
| **Security** | SAML SSO, configuracion de autenticacion |

### Super Admin

- Panel de administracion en `/super_admin`
- Gestion de cuentas/organizaciones (crear, suspender, eliminar)
- Crear super admins
- Monitoreo de jobs en background (equivalente a Sidekiq dashboard -> Bull Board)
- **Platform APIs** para gestion programatica de usuarios, cuentas y roles

### API Publica

API REST completa documentada con OpenAPI/Swagger:

| Recurso | Endpoints |
|---------|-----------|
| Conversations | List, Create, Filter, Details, Update, Toggle Status, Toggle Priority, Custom Attributes, Labels, Reporting Events |
| Messages | List, Create, Delete |
| Contacts | List, Create, Update, Search, Filter, Conversations, Labels, Notes |
| Inboxes | List, Create, Update, Delete, Agent Bot config |
| Agents | List, Create, Update, Delete |
| Teams | List, Create, Update, Delete, Members |
| Labels | CRUD |
| Canned Responses | CRUD |
| Custom Attributes | CRUD |
| Custom Filters | CRUD |
| Automation Rules | CRUD |
| Help Center | Portals, Categories, Articles — CRUD |
| Reports | Conversations, Agents, Labels, Inboxes, Teams metrics |
| Webhooks | CRUD |
| Profile | Get, Update |
| Account Users | List, Create, Delete |
| Agent Bots | CRUD |
| **Platform APIs** | Accounts, Users, Roles (super admin) |

---

## Plan de Desarrollo por Fases

### Fase 0 — Fundamentos y Arquitectura (Semanas 1-3)

Establecer la base del proyecto, tooling, autenticacion y layout core.

- [ ] Inicializar monorepo con pnpm workspaces
- [ ] Crear app SvelteKit con TypeScript estricto
- [ ] Configurar ESLint, Prettier, Husky (pre-commit hooks)
- [ ] Configurar Tailwind CSS + shadcn-svelte
- [ ] Configurar Docker Compose: PostgreSQL, Redis, MinIO
- [ ] Configurar Drizzle ORM con migraciones
- [ ] Esquema base: `accounts`, `users`, `roles`, `account_users`
- [ ] Sistema de autenticacion: registro, login, logout, sesiones (Lucia Auth)
- [ ] Middleware de autorizacion basado en roles (owner, admin, agent)
- [ ] Layout del dashboard: sidebar principal, secondary sidebar, content area, right panel
- [ ] Navegacion: Conversations, Contacts, Reports, Campaigns, Help Center, Settings
- [ ] Profile settings: avatar, display name, disponibilidad, idioma, font size
- [ ] Notification center (bell icon con lista in-app)
- [ ] Command bar (Cmd+K) con navegacion basica
- [ ] Keyboard shortcuts framework
- [ ] Dark mode (auto / light / dark) en dashboard
- [ ] i18n setup con Paraglide.js (espanol + ingles inicialmente)
- [ ] Vitest + Playwright configurados
- [ ] CI con GitHub Actions (lint, test, build)

**Entregable:** App con login, dashboard con layout completo, dark mode, command bar, i18n y notificaciones.

---

### Fase 1 — Inboxes, Widget y Canal Website (Semanas 4-6)

El canal core: live chat en website.

- [ ] Esquema: `inboxes`, `channels`, `conversations`, `messages`, `contacts`, `contact_inboxes`
- [ ] CRUD de Inboxes en Settings
- [ ] **Widget embebible (Web Component):**
  - Compilar componente Svelte como Web Component
  - SDK JavaScript (`xat.js`) para integracion
  - Pre-chat form configurable (campos standard + custom)
  - HMAC-based identity validation
  - Greeting message configurable
  - Customizacion: colores, heading, tagline, reply time
  - Dark mode del widget (auto / light / dark)
  - setLocale(), setUser(), setCustomAttributes() via SDK
- [ ] Comunicacion en tiempo real via WebSocket (Socket.IO)
- [ ] **Vista de conversaciones en dashboard:**
  - Lista de conversaciones (secondary sidebar) con filtros
  - Detalle de conversacion (area central) con thread de mensajes
  - Panel derecho: info del contacto, atributos custom, conversaciones previas
- [ ] Envio y recepcion de mensajes en tiempo real
- [ ] Typing indicators (agente y cliente)
- [ ] Read receipts
- [ ] Emoji picker
- [ ] Archivos adjuntos (drag & drop, imagenes, documentos)
- [ ] Audio recording (notas de voz)
- [ ] Rich text / Markdown en mensajes
- [ ] Estados de conversacion: open, resolved, pending, snoozed
- [ ] Prioridad de conversacion (urgent, high, medium, low, none)
- [ ] Asignacion manual a agente

**Entregable:** Chat en vivo funcional con widget embebible, mensajes en tiempo real y panel de conversacion completo.

---

### Fase 2 — Gestion de Conversaciones y Contactos (Semanas 7-9)

Herramientas para que los agentes trabajen eficientemente.

- [ ] **Conversaciones:**
  - Asignacion a equipo
  - Round-robin auto-assignment
  - Etiquetas (labels) en conversaciones
  - Notas privadas entre agentes
  - Menciones (@agente) en notas privadas
  - Participantes de conversacion
  - Bulk actions (resolver, asignar, etiquetar multiples)
  - Mute/unmute conversaciones
  - Enviar transcripcion por email
  - Canned responses (respuestas predefinidas)
  - Filtros avanzados de conversacion (por estado, inbox, agente, equipo, etiqueta, prioridad)
  - Custom folders / saved views (guardados en sidebar)
  - Vista: "Mentions" y "Unattended"
- [ ] **Contactos:**
  - Vista de contacto unificada con historial de conversaciones
  - Notas del contacto (Cmd+Enter para agregar)
  - Atributos personalizados (text, number, date, list, checkbox, link)
  - Etiquetas en contactos
  - Segmentos de contactos (filtros avanzados guardados en sidebar)
  - Import CSV de contactos
  - Export CSV de contactos
  - Merge de contactos duplicados
  - Companies/Organizations asociadas
  - Filtros avanzados con operadores (equals, not equals, contains, present, etc.)
- [ ] **Keyboard shortcuts** completos (resolver, navegar J/K, send, toggle sidebar, etc.)
- [ ] **Command bar** acciones contextuales (resolver, asignar, etiquetar, snooze, mute, macro)

**Entregable:** Flujo de trabajo completo para equipos de soporte con gestion avanzada de contactos.

---

### Fase 3 — Canal Email + API Channel (Semanas 10-12)

Expandir canales de comunicacion.

- [ ] **Canal Email:**
  - Configuracion de inbox IMAP/SMTP en Settings
  - Recepcion via IMAP polling
  - Recepcion via forwarding (webhook)
  - Envio de respuestas via SMTP
  - Parsing de hilos de email (In-Reply-To, References headers)
  - Firma de agente configurable
  - Email como conversacion en la bandeja unificada
- [ ] **API Channel:**
  - Crear inbox tipo API en Settings
  - Endpoint REST para crear conversaciones y mensajes programaticamente
  - Callback URL para webhooks entrantes
  - Autenticacion por API key
  - Documentacion del canal

**Entregable:** Soporte para email y canal API ademas del live chat.

---

### Fase 4 — Equipos, Roles y Notificaciones (Semanas 13-15)

Escalar para organizaciones con multiples equipos.

- [ ] Esquema: `teams`, `team_members`, `custom_roles`, `permissions`
- [ ] CRUD de equipos en Settings
- [ ] Asignacion de conversaciones a equipos
- [ ] Auto-asignacion basada en reglas de inbox -> equipo
- [ ] **Custom Roles** con permisos granulares (mas alla de admin/agent)
- [ ] **Agent Capacity** — limite configurable de conversaciones simultaneas
- [ ] Auto-asignacion respetando disponibilidad + capacidad
- [ ] Vista de conversaciones por equipo en sidebar
- [ ] **Notificaciones completas:**
  - Audio alerts con multiples sonidos y condiciones
  - Email notifications (nueva conversacion, asignacion, mencion, nuevo mensaje)
  - Push notifications (Web Push API) con permisos del browser
  - Preferencias granulares por tipo de evento
  - Configuracion: solo cuando ventana inactiva / cada 30s hasta leer
- [ ] Presencia de agentes en tiempo real (online, busy, offline)

**Entregable:** Multiples equipos con roles custom, capacity management y notificaciones completas.

---

### Fase 5 — Automatizacion (Semanas 16-19)

Motor de automatizacion completo.

- [ ] **Automation Rules:**
  - UI para crear/editar reglas en Settings -> Automation
  - Eventos: conversation created, updated, opened; message created
  - Condiciones con operadores AND/OR (contenido, atributos, inbox, team, labels, prioridad, contacto)
  - Acciones: asignar agente/equipo, agregar/remover etiqueta, cambiar prioridad, resolver, snooze, mute, enviar mensaje, enviar email, asignar SLA
  - Ejecucion via BullMQ (background jobs)
- [ ] **Macros:**
  - CRUD en Settings -> Macros
  - Secuencias de acciones ordenadas
  - Macros privados y compartidos
  - Preview antes de ejecutar
  - Ejecutables desde command bar y UI de conversacion
- [ ] **SLA Policies:**
  - CRUD en Settings -> SLA
  - First response time, next response time, resolution time
  - Alertas antes de breach
  - Asignacion via automation rules
- [ ] **Business Hours:**
  - Configuracion por inbox
  - Mensaje de fuera de horario
  - SLA respeta business hours
- [ ] **Conversation Workflows:**
  - Atributos requeridos antes de resolver (Settings -> Conversation Workflows)
  - Modal que bloquea resolucion hasta llenar campos
- [ ] **Agent Bot API:**
  - Webhook-based: enviar eventos a endpoint externo
  - Recibir respuestas del bot
  - Handoff a agente humano
  - Configuracion por inbox

**Entregable:** Conversaciones se enrutan y procesan automaticamente. Macros y SLA operativos.

---

### Fase 6 — Reportes y CSAT (Semanas 20-22)

Metricas para medir y mejorar el soporte.

- [ ] **Dashboard Overview:**
  - Conversaciones abiertas, no atendidas, sin asignar en tiempo real
  - Metricas resumidas del periodo
- [ ] **Reportes por tipo:**
  - Conversation reports
  - Agent reports
  - Label reports
  - Inbox reports
  - Team reports
- [ ] **Metricas en cada reporte:**
  - First response time
  - Resolution time
  - Resolution count
  - Conversations count
  - CSAT score
- [ ] Filtros por periodo: days, weeks, months (date range picker)
- [ ] Graficas de tendencia (line/bar charts)
- [ ] Tablas paginadas y filtrables
- [ ] Exportacion a CSV
- [ ] **CSAT:**
  - Encuesta de satisfaccion al resolver conversacion
  - Toggle por inbox en Settings
  - CSAT Reports con filtros por inbox, agente, equipo, label
- [ ] **SLA Reports:**
  - Hit rate (porcentaje de SLAs cumplidos)
  - SLA misses
  - Filtros por SLA policy, inbox, agente, equipo, label

**Entregable:** Managers pueden medir rendimiento del equipo y satisfaccion del cliente con datos exportables.

---

### Fase 7 — Campanas (Semanas 23-24)

Mensajes proactivos a clientes.

- [ ] Seccion "Campaigns" en sidebar principal
- [ ] **Ongoing Campaigns (website live chat):**
  - Mensaje trigger basado en URL de pagina (soporta wildcards)
  - Tiempo en pagina como condicion
  - Envio por bot o agente
  - Activar/desactivar campana
- [ ] **One-off Campaigns:**
  - Envio masivo a audiencia segmentada por etiquetas
  - Canales soportados: SMS, WhatsApp (templates)
  - Programacion de envio (scheduled datetime)
  - Campos: titulo, mensaje, inbox, audiencia, fecha/hora
  - Estado de la campana (draft, scheduled, sent)

**Entregable:** Campanas proactivas por live chat, SMS y WhatsApp.

---

### Fase 8 — Help Center (Semanas 25-27)

Base de conocimiento publica para autoservicio.

- [ ] Esquema: `portals`, `categories`, `articles`, `article_translations`
- [ ] Seccion "Help Center" en sidebar principal
- [ ] **Gestion de Portales:**
  - Crear multiples portales por cuenta
  - Configuracion: nombre, slug, dominio custom, color, logo
  - SSL para custom domain
- [ ] **Categorias:**
  - CRUD con jerarquia (categorias y subcategorias)
  - Ordenamiento drag & drop
- [ ] **Articulos:**
  - Editor rich text / Markdown
  - Asignar autor y categoria
  - Meta content (description, tags) para SEO
  - Estados: draft, published, archived
- [ ] **Portal publico:**
  - Vista publica con busqueda full-text
  - URLs amigables (/portal/slug/category/article)
  - Sitemap automatico
  - Meta tags para SEO
  - Responsive design
- [ ] **Multi-idioma:**
  - Traducciones de articulos por locale
  - Cada idioma con su propia URL structure
  - Redireccion automatica por idioma del visitante
- [ ] **Integracion con widget:**
  - Sugerir articulos relevantes antes de iniciar chat
  - Busqueda de articulos desde el widget
  - Link a articulo completo

**Entregable:** Base de conocimiento publica, multi-idioma, con SEO y conectada al widget.

---

### Fase 9 — Canales de Mensajeria (Semanas 28-32)

Expandir a todos los canales de mensajeria social.

- [ ] **WhatsApp** (Cloud API / 360dialog)
  - Recepcion y envio de mensajes
  - Templates de mensajes
  - Mensajes interactivos (botones, listas)
  - Media (imagenes, documentos, audio, video)
- [ ] **Facebook Messenger** (Graph API)
  - Conectar pagina de Facebook
  - Mensajes, imagenes, attachments
- [ ] **Instagram DMs** (Graph API)
  - Conectar cuenta de Instagram Business
  - Mensajes directos, story replies
- [ ] **Telegram** (Bot API)
  - Crear bot y conectar
  - Mensajes, archivos, stickers
- [ ] **Twitter/X DMs** (API v2)
  - Conectar cuenta
  - Mensajes directos
- [ ] **LINE** (Messaging API)
  - Conectar canal de LINE
  - Mensajes
- [ ] **SMS** (Twilio)
  - Configurar cuenta Twilio
  - Envio y recepcion de SMS
- [ ] **Voice** (WebRTC / Twilio Voice)
  - Llamadas inbound y outbound
  - Flujos de voz basicos
- [ ] **TikTok** (experimental)
  - Mensajes directos

**Entregable:** Soporte omnicanal real con todos los principales canales de mensajeria y voz.

---

### Fase 10 — Integraciones (Semanas 33-35)

Conectar Xat con el ecosistema de herramientas.

- [ ] **Settings -> Integrations** page
- [ ] **Slack:**
  - Conectar workspace
  - Notificaciones de conversaciones en canal
  - Responder conversaciones desde Slack
- [ ] **Dialogflow:**
  - Conectar proyecto de Dialogflow
  - Chatbot NLU por inbox
- [ ] **Google Translate:**
  - Traduccion automatica de mensajes
  - 100+ idiomas
- [ ] **Linear:**
  - Crear issues desde conversaciones
  - Tracking de feature requests
- [ ] **Dyte:**
  - Video llamadas desde live chat
  - Generar links de llamada
- [ ] **Dashboard Apps:**
  - Framework para embeber iframes en sidebar de conversacion
  - Configuracion de apps custom por cuenta
- [ ] **Webhooks salientes:**
  - CRUD en Settings
  - Suscripcion por eventos (conversation.created, message.created, etc.)
  - Payload con datos completos del evento
- [ ] **App/Integration framework:**
  - Estructura para plugins de terceros
  - Hooks de eventos

**Entregable:** Xat integrado con Slack, Dialogflow, Translate, Linear, Dyte y extensible via webhooks.

---

### Fase 11 — API Publica y Super Admin (Semanas 36-38)

API completa y administracion de plataforma.

- [ ] **API REST publica:**
  - Documentacion con OpenAPI 3.0 / Swagger UI
  - Endpoints completos: Conversations, Messages, Contacts, Inboxes, Agents, Teams, Labels, Canned Responses, Custom Attributes, Custom Filters, Automation Rules, Help Center, Reports, Webhooks, Profile, Account Users, Agent Bots
  - Autenticacion por API key (user token + account)
  - Rate limiting
- [ ] **Platform APIs:**
  - Gestion de Accounts, Users, Roles a nivel plataforma
  - Solo accesible por super admins
- [ ] **Super Admin Console (/super_admin):**
  - Dashboard de la plataforma
  - CRUD de cuentas/organizaciones (crear, suspender, eliminar)
  - Crear y gestionar super admins
  - Monitoreo de background jobs (Bull Board)
  - Audit log a nivel plataforma
- [ ] **Multi-tenancy completo:**
  - Aislamiento de datos por cuenta
  - Limites configurables por plan (agentes, inboxes, contactos)
- [ ] **Security:**
  - SAML SSO (Settings -> Security)
  - Audit Log por cuenta (Settings -> Audit Log)
  - Rate limiting y proteccion contra abuso
- [ ] **Custom branding:**
  - Logo y colores por cuenta
  - Custom domain para widget

**Entregable:** Plataforma lista para operar como SaaS multi-tenant con API completa y super admin.

---

### Fase 12 — Produccion y Escalabilidad (Semanas 39-41)

Preparar para despliegue en produccion a escala.

- [ ] **Docker:**
  - Dockerfile optimizado (multi-stage build)
  - Docker Compose para desarrollo
  - Docker Compose para produccion (con Traefik/Nginx)
  - Servicios separados: web (SvelteKit), worker (BullMQ), websocket
- [ ] **Kubernetes:**
  - Helm chart
  - Horizontal Pod Autoscaler
  - WebSocket sticky sessions
- [ ] **Observabilidad:**
  - Health checks y readiness probes
  - Logging estructurado (JSON, correlacion por request ID)
  - Metricas de aplicacion (Prometheus endpoint)
  - Tracing (OpenTelemetry)
- [ ] **Base de datos:**
  - Migraciones zero-downtime
  - Backup y restore automatizado
  - Connection pooling
- [ ] **Scaling:**
  - Horizontal scaling: workers independientes
  - Shared state en Redis
  - CDN para assets estaticos
- [ ] **Documentacion:**
  - Guia de self-hosted deployment
  - Guia de configuracion de canales
  - Guia de contribucion

**Entregable:** Xat desplegable en produccion con observabilidad, escalabilidad y documentacion completa.

---

## Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/xat.git
cd xat

# Instalar dependencias
pnpm install

# Levantar servicios (PostgreSQL, Redis, MinIO)
docker compose up -d

# Ejecutar migraciones
pnpm db:migrate

# Seed de datos iniciales (super admin)
pnpm db:seed

# Iniciar en modo desarrollo
pnpm dev

# Abrir en el navegador
# Dashboard: http://localhost:5173
# Widget test: http://localhost:5173/widget/test
# Super Admin: http://localhost:5173/super-admin
```

### Scripts Disponibles

```bash
pnpm dev              # Desarrollo con HMR
pnpm build            # Build de produccion
pnpm preview          # Preview del build
pnpm test             # Vitest (unit tests)
pnpm test:e2e         # Playwright (E2E tests)
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm db:migrate       # Ejecutar migraciones
pnpm db:generate      # Generar migracion desde schema
pnpm db:seed          # Seed de datos iniciales
pnpm db:studio        # Drizzle Studio (DB GUI)
pnpm widget:build     # Build del widget como Web Component
```

---

## Contribuir

Las contribuciones son bienvenidas. Por favor lee [CONTRIBUTING.md](docs/contributing.md) antes de enviar un PR.

1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/my-feature`)
3. Commit tus cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add my feature'`)
4. Push al branch (`git push origin feature/my-feature`)
5. Abre un Pull Request

### Requisitos para PRs

- Tests unitarios para logica de negocio
- Tests E2E para flujos criticos
- Lint y formato OK (`pnpm lint && pnpm format`)
- Build exitoso (`pnpm build`)

---

## Licencia

Este proyecto esta licenciado bajo la **Apache License 2.0** — ver el archivo [LICENSE](LICENSE) para detalles.

---

> **Disclaimer:** Este proyecto es una implementacion independiente inspirada en la funcionalidad de plataformas de customer engagement. No es un fork, no contiene codigo de ningun otro proyecto, y no esta afiliado a ninguna otra plataforma. Todo el codigo es original y escrito desde cero.
