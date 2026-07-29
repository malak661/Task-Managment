# Task Board

A small team task board. Sign in, create projects, add tasks, hand them to a
teammate, and move them from To Do to Done.

- **Backend** — Node.js, Express, MongoDB (Mongoose), JWT auth
- **Frontend** — React (Vite), React Router, axios
- **Tests** — Jest and supertest against a real MongoDB
- **Docs** — Swagger UI at `/api/docs`

---

## Getting it running

You need Node 18+ and Docker (for MongoDB). Three terminals, or three steps.

### 1. MongoDB

```bash
docker compose up -d
```

That starts MongoDB 7 on `localhost:27017` with a named volume, so data survives a
restart. If you would rather use MongoDB Atlas or an installation of your own, skip
this and put your connection string in `backend/.env` instead.

### 2. The API

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API comes up on <http://localhost:4000>. `GET /health` answers without touching
the database, which is handy for telling "the API is down" apart from "Mongo is
down".

### 3. The web app

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with one of the seeded accounts below.

---

## Test accounts

`npm run seed` (from `backend/`) creates three people, a project called *Website
Relaunch* and five tasks spread across the three statuses. It is safe to run again
— it only clears the records it created.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@taskboard.dev` | `Admin1234` |
| Member | `member@taskboard.dev` | `Member1234` |
| Member | `layla@taskboard.dev` | `Member1234` |

Sign in as the admin to see cross-project access and member management; sign in as
a member to see the same board without those controls.

---

## Environment variables

**`backend/.env`**

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | — | Where Mongo lives. The API refuses to boot without it. |
| `JWT_SECRET` | yes | — | Signs the tokens. Any long random string. |
| `PORT` | no | `4000` | Port for the API. |
| `NODE_ENV` | no | `development` | In `production`, 500s stop revealing internals. |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime. |
| `MONGODB_TEST_URI` | no | — | Tests only. See [Tests](#tests). |

**`frontend/.env`**

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `http://localhost:4000/api` | Where the client looks for the API. |

Both folders ship a `.env.example`. Real `.env` files are gitignored.

---

## Tests

```bash
cd backend
npm test
```

34 tests across 4 suites. They run against a real MongoDB rather than mocks:
`mongodb-memory-server` starts a throwaway instance, and every test begins with an
empty database. Nothing to set up, nothing left behind.

The first run downloads a MongoDB binary (~600 MB, once). If that download is
blocked on your network, point the suite at a Mongo you already have:

```bash
# Windows PowerShell
$env:MONGODB_TEST_URI='mongodb://localhost:27017/task-board-test'; npm test

# macOS / Linux
MONGODB_TEST_URI=mongodb://localhost:27017/task-board-test npm test
```

The database name must end in `-test`. The suite empties every collection between
tests, so it refuses to point at anything that is not obviously disposable.

What the tests cover:

| Suite | The interesting cases |
| --- | --- |
| `auth` | Password stored as a hash and never returned; `role` in the request body ignored; wrong password and unknown email give the *same* 401; a valid token for a deleted account is rejected |
| `projects` | List scoped to membership; admin sees everything; a non-member is blocked from reading *and* writing; the owner cannot be removed |
| `tasks` | Defaults; assignee must be a project member; any member can move a card but only some can delete; a task id from another project answers 404; tasks are cleaned up when a project or a member goes |
| `taskFilters` | Every filter; `unassigned`; priority sorted by weight not alphabet; pages that neither repeat nor drop rows; regex characters in the search treated as literal text |

---

## API documentation

Two ways in, depending on whether you want to read the API or poke at it.

**Swagger UI** — with the API running, open <http://localhost:4000/api/docs>. It is
generated from annotations on the routes, so it cannot drift from the code. The raw
OpenAPI 3 document is at `/api/docs.json`.

**Postman collection** — [`docs/task-board.postman_collection.json`](docs/task-board.postman_collection.json).
Import it (Postman → Import → the file), then:

1. Run **Auth → Login as admin**. A test script stores the token on the collection,
   so every other request is authorised from then on.
2. Run **Projects → Create project** and **Tasks → Create task**. They store
   `projectId` and `taskId` the same way, so nothing needs ids pasted into it.

24 requests across seven folders, covering every endpoint. It runs top to bottom
as-is — the destructive requests are kept in a *Cleanup (run last)* folder, and
signing in as a member stores a second token rather than replacing the admin one.
Alongside the happy path it includes the refusals, because those are the
interesting part:

| Request | Proves |
| --- | --- |
| Login with a wrong password | `401`, worded identically to an unknown email |
| Try to remove the owner | `400` — a project cannot be left unmanageable |
| Member renames a project they do not own | `403 Only the project owner or an admin can do that` |
| Member changes somebody's role | `403` — the guard runs before the controller |

**Auth** — every endpoint except register and login needs a bearer token:

```
Authorization: Bearer <token from /api/auth/login>
```

### Endpoints at a glance

| Method | Path | Who |
| --- | --- | --- |
| `POST` | `/api/auth/register` | anyone |
| `POST` | `/api/auth/login` | anyone |
| `GET` | `/api/auth/me` | signed in |
| `GET` | `/api/users` | signed in |
| `PATCH` | `/api/users/:id/role` | admin |
| `GET` | `/api/projects` | signed in (your projects; admin sees all) |
| `POST` | `/api/projects` | signed in |
| `GET` | `/api/projects/:id` | member, owner, admin |
| `PATCH` `DELETE` | `/api/projects/:id` | owner, admin |
| `POST` | `/api/projects/:id/members` | owner, admin |
| `DELETE` | `/api/projects/:id/members/:userId` | owner, admin |
| `GET` `POST` | `/api/projects/:projectId/tasks` | project members |
| `GET` `PATCH` | `/api/projects/:projectId/tasks/:taskId` | project members |
| `DELETE` | `/api/projects/:projectId/tasks/:taskId` | task creator, project owner, admin |

Task lists take `status`, `priority`, `assignee` (an id, or `unassigned`),
`search`, `sort`, `page` and `limit`:

```
GET /api/projects/:projectId/tasks?status=todo&priority=high&sort=dueDate&page=1&limit=20
```

The response carries the paging numbers with the rows:

```json
{
  "tasks": [ ... ],
  "meta": { "total": 42, "page": 1, "limit": 20, "pages": 3 }
}
```

---

## How it is put together

```
task-managment/
├─ docker-compose.yml          MongoDB for local development
├─ docs/                       Postman collection
├─ backend/
│  ├─ src/
│  │  ├─ server.js             boots the http listener
│  │  ├─ app.js                express wiring: middleware, routes, error handler
│  │  ├─ constants.js          roles, statuses, priorities — shared by models and validation
│  │  ├─ config/               env, database connection, swagger definition
│  │  ├─ models/               user, project, task
│  │  ├─ modules/              one folder per feature: routes · controller · service · validation
│  │  │  ├─ auth/  users/  projects/  tasks/
│  │  ├─ middleware/           authenticate, authorize, validate, notFound, errorHandler
│  │  ├─ utils/                ApiError, asyncHandler, token, escapeRegex, validation
│  │  └─ seed/                 seed.js
│  └─ tests/                   supertest specs + shared helpers
└─ frontend/
   └─ src/
      ├─ api/                  axios instance and one module per resource
      ├─ context/              AuthContext — the session lives here
      ├─ components/           Layout, ProtectedRoute, Modal, TaskCard, forms, states
      ├─ pages/                Login, Register, Projects, ProjectBoard, NotFound
      ├─ labels.js             the wording for statuses, priorities and sort options
      └─ utils/                date formatting and overdue checks
```

### Separation of concerns

A request goes **route → validation → controller → service → model**.

- **Routes** say what exists and which middleware guards it.
- **Validation** (Joi) checks the request and hands the controller a cleaned value.
  Unknown fields are stripped rather than rejected, which is what closes the
  "register yourself as an admin" hole.
- **Controllers** are deliberately boring: call a service, pick a status code.
  They never touch Mongoose.
- **Services** hold the rules — who may see a project, who may delete a task.
- **Models** own the data shape and anything that must always be true, like
  hashing a password before it is stored.

### Roles and permissions

There are two levels, and they answer different questions.

`role` on the user (`admin` / `member`) is global and checked by middleware.
Project permissions depend on the project document, so they live in the services.

| Action | Who can |
| --- | --- |
| Create a project | anyone signed in (they become the owner) |
| See a project | its members, plus any admin |
| Rename or delete a project | the owner, plus any admin |
| Add or remove members | the owner, plus any admin |
| Create or edit a task | any member of the project |
| Delete a task | its creator, the project owner, or an admin |
| Promote someone to admin | an admin |

Registration always creates a member. There is no way to sign yourself up as an
admin — the seed script creates the first one, and admins can promote others.

### Data model

```
User ──owns──▶ Project ──has many──▶ Task
  └──member of──┘                     ├── creator  → User
                                      └── assignee → User (nullable)
```

- The owner is also kept in `members`, so "can this person see it?" is a single
  membership check. `{ members: 1 }` is indexed because every project list is
  scoped that way.
- Tasks are indexed on `{ project: 1, status: 1 }` — they are always read one
  project at a time, usually narrowed by status.
- Deleting a project deletes its tasks. Removing a member unassigns theirs.

---

## Decisions worth explaining

**Statuses are stored as `todo` / `in_progress` / `done`.** The UI owns the labels
("To Do", "In Progress", "Done"), so rewording a column never becomes a data
migration.

**Tasks carry a hidden `priorityWeight`.** Sorting on the words puts "high" before
"low" alphabetically, which means nothing to anybody. A `pre('save')` hook keeps a
number (`low`=1 … `high`=3) in step with the label, and `sort=priority` orders by
that. The field is `select: false`, so it never reaches a response.

**Login answers the same way for a wrong password and an unknown email.** Two
different messages would turn the endpoint into a way to find out who has an
account.

**`authenticate` loads the user from the database on every request.** Trusting the
token payload alone would let a deleted account keep working until its token
expired.

**A task is only reachable through its project.** Lookups are
`{ _id: taskId, project: projectId }`, not `findById`, so a valid task id borrowed
from another project answers 404 instead of leaking the task.

**Search input is escaped before it reaches `$regex`.** Otherwise a search for
`c++` is an invalid pattern and a search for `.*` quietly matches everything.

**The board asks the API once and splits the result into columns.** Three requests,
one per column, would be tidier in theory and worse in practice at this size.

**A 403 (not a 404) comes back for a project you cannot access.** A 404 would hide
whether it exists at all, which is marginally safer; a 403 is clearer for an
internal team tool. A deliberate trade, and easy to flip.

---

## Known limitations

- **No refresh tokens.** A JWT lasts seven days and there is no revocation list. If
  a token expires while the app is open, the client signs you out and sends you
  back to the login screen.
- **The board loads up to 100 tasks per project.** Pagination exists on the API and
  is covered by tests, but the board does not page through it yet.
- **`sort=dueDate` puts tasks with no due date first**, since Mongo sorts `null`
  below any date. Moving them to the end needs an aggregation pipeline, which felt
  like the wrong trade here.
- **No real-time updates.** Changes show after the next request, not by push.
- **Docker Compose covers MongoDB only.** The API and web app run on the host with
  `npm run dev`.
