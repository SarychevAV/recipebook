# CLAUDE.md — recipebook

This file is the source of truth for Claude Code when working on this project.
Read it fully before starting any task.

---

## Project Overview

**recipebook** — a web application for saving and sharing cooking recipes.
Users can browse public recipes without login, and authenticated users can create, edit, and manage their own recipes with photos.

**Monorepo structure:**
```
recipebook/
├── backend/          # Spring Boot 3 + Java 21
├── frontend/         # React + TypeScript + Vite
├── docker-compose.yml
├── docker-compose.prod.yml
└── CLAUDE.md
```

---

## Tech Stack

### Backend
- **Java 21** (use records, sealed classes, pattern matching where appropriate)
- **Spring Boot 3.x**
- **Spring Security 6** + JWT (stateless, no sessions)
- **Spring Data JPA** + **PostgreSQL**
- **Liquibase** for DB migrations
- **MapStruct** for DTO mapping
- **Lombok** (only for `@Builder`, `@Getter`, `@Slf4j` — avoid `@Data` on entities)
- **Testcontainers** + **JUnit 5** + **MockMvc** for tests
- **MinIO** (S3-compatible) for photo storage in dev; S3 in prod

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** as build tool
- **TanStack Query v5** for server state
- **React Hook Form** + **Zod** for forms and validation
- **Tailwind CSS** + **shadcn/ui** for UI components
- **React Router v6** for routing
- **Axios** with interceptors for HTTP

### Infrastructure
- **Docker + Docker Compose** for local dev
- **Railway** for production hosting
- **GitHub Actions** for CI

---

## Backend Architecture

### Package Structure (feature-based)
```
com.recipebook/
├── common/
│   ├── exception/        # GlobalExceptionHandler, custom exceptions
│   ├── response/         # ApiResponse<T> wrapper
│   └── security/         # JwtFilter, JwtService, SecurityConfig
├── user/
│   ├── UserEntity.java
│   ├── UserRepository.java
│   ├── UserService.java
│   ├── UserController.java
│   └── dto/
├── recipe/
│   ├── RecipeEntity.java
│   ├── RecipeRepository.java
│   ├── RecipeService.java
│   ├── RecipeController.java
│   └── dto/
├── ingredient/
├── tag/
└── storage/              # Photo upload abstraction
```

### Layering Rules
- **Controller** → accepts HTTP, validates input, delegates to Service, returns ResponseEntity
- **Service** → business logic only, no HTTP concerns, no direct repository calls from controllers
- **Repository** → data access only, custom JPQL/native queries here
- **Entity** → JPA mappings, no business logic, no serialization annotations
- **DTO** → separate Request/Response DTOs per use case, mapped via MapStruct

### Entity Conventions
```java
// Always use this base for entities
@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
```
- Use `UUID` for all primary keys (never auto-increment Long for public APIs)
- Avoid bidirectional JPA relationships unless strictly necessary
- Use `FetchType.LAZY` by default
- Never expose entities directly in API responses

### API Conventions
```
GET    /api/v1/recipes              # public, paginated
GET    /api/v1/recipes/{id}         # public
POST   /api/v1/recipes              # auth required
PUT    /api/v1/recipes/{id}         # auth required, owner only
DELETE /api/v1/recipes/{id}         # auth required, owner only
POST   /api/v1/recipes/{id}/photos  # auth required, multipart
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/users/me
```

### Response Format
Always wrap responses in `ApiResponse<T>`:
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
Errors follow RFC 7807 Problem Details:
```json
{
  "type": "/errors/not-found",
  "title": "Recipe not found",
  "status": 404,
  "detail": "Recipe with id=abc does not exist"
}
```

### Exception Handling
- All exceptions go through `@ControllerAdvice GlobalExceptionHandler`
- Create domain-specific exceptions: `RecipeNotFoundException`, `UnauthorizedAccessException`
- Never return 500 for business logic errors
- Log with `@Slf4j` — ERROR for unexpected, WARN for business rule violations

### Security Rules
- JWT secret from environment variable `JWT_SECRET` (never hardcoded)
- Token expiry: 24h access, 7d refresh
- Public endpoints: `GET /api/v1/recipes/**`, `POST /api/v1/auth/**`
- All other endpoints require authentication
- Validate resource ownership in Service layer, not Controller

### Testing Standards
- Unit tests for every Service method
- Integration tests with Testcontainers for repositories and controllers
- Test naming: `methodName_whenCondition_thenExpectedResult`
- Minimum coverage target: 80% for service layer
- Use `@Sql` annotations or builders for test data, never share mutable state between tests

```java
// Example test structure
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class RecipeServiceTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Test
    void createRecipe_whenUserAuthenticated_thenRecipeSaved() { ... }

    @Test
    void createRecipe_whenUserNotOwner_thenThrowsUnauthorized() { ... }
}
```

### Liquibase Migrations
```
backend/src/main/resources/db/changelog/
├── db.changelog-master.yaml
├── V1__create_users.sql
├── V2__create_recipes.sql
├── V3__create_ingredients.sql
└── V4__create_tags.sql
```
- One file per logical change, never edit existing migration files
- Always include rollback scripts

---

## Frontend Architecture

### Project Structure
```
frontend/src/
├── api/              # Axios instance + API functions per domain
├── components/
│   ├── ui/           # shadcn/ui base components (do not modify)
│   └── shared/       # reusable app-level components
├── features/
│   ├── auth/         # Login, Register components + hooks
│   ├── recipes/      # RecipeCard, RecipeForm, RecipeDetail
│   └── profile/      # User profile, my recipes
├── hooks/            # Custom hooks
├── lib/              # utils, zod schemas, constants
├── pages/            # Route-level components only, thin wrappers
├── router/           # Route definitions, protected route wrapper
├── store/            # Auth state (Zustand or Context)
└── types/            # Shared TypeScript types/interfaces
```

### Component Rules
- One component per file
- Feature components live in `features/`, not `components/`
- Pages are thin — logic lives in hooks and features
- Use `React.FC` sparingly — prefer plain function declarations
- All forms use React Hook Form + Zod schema validation

### API Layer
```typescript
// api/recipes.ts — always type request and response
export const getRecipes = (params: RecipeQueryParams): Promise<PagedResponse<RecipeDto>> =>
  api.get('/recipes', { params }).then(r => r.data);

export const createRecipe = (data: CreateRecipeRequest): Promise<RecipeDto> =>
  api.post('/recipes', data).then(r => r.data);
```

### TanStack Query Conventions
```typescript
// hooks/useRecipes.ts
export const useRecipes = (params: RecipeQueryParams) =>
  useQuery({
    queryKey: ['recipes', params],
    queryFn: () => getRecipes(params),
    staleTime: 1000 * 60 * 5, // 5 min for public data
  });

export const useCreateRecipe = () =>
  useMutation({
    mutationFn: createRecipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  });
```

### TypeScript Rules
- `strict: true` in tsconfig — no exceptions
- No `any` — use `unknown` and type guards if needed
- All API response types must mirror backend DTOs exactly
- Zod schemas double as runtime validators and type sources

---

## Docker & Local Development

### docker-compose.yml (dev)
Services:
- `postgres` — PostgreSQL 16, port 5432
- `minio` — photo storage, ports 9000/9001
- `backend` — Spring Boot with hot reload via spring-devtools
- `frontend` — Vite dev server with HMR

### Environment Variables
Backend (`.env` in `backend/`):
```
DB_URL=jdbc:postgresql://localhost:5432/recipebook
DB_USERNAME=recipebook
DB_PASSWORD=secret
JWT_SECRET=<min-256-bit-secret>
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```
Frontend (`.env` in `frontend/`):
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**Never commit `.env` files. Always provide `.env.example`.**

---

## Git & CI Conventions

### Branch Strategy
```
main          # production-ready only
develop       # integration branch
feature/*     # new features
fix/*         # bug fixes
```

### Commit Format (Conventional Commits)
```
feat(recipe): add photo upload endpoint
fix(auth): correct JWT expiry calculation
refactor(user): extract UserMapper to separate class
test(recipe): add integration tests for RecipeService
```

### GitHub Actions CI
On every PR to `develop` and `main`:
1. Backend: `./mvnw verify` (includes Testcontainers tests)
2. Frontend: `tsc --noEmit` + `eslint` + `vitest`
3. Docker build check

---

## What Claude Should Always Do

- Read this file before starting any task
- Ask clarifying questions before writing code if requirements are ambiguous
- Write tests alongside implementation, not after
- Follow existing package structure — never create new top-level packages without discussion
- Use constructor injection, never `@Autowired` on fields
- Prefer immutable DTOs (Java records for response DTOs)
- Never hardcode secrets, URLs, or environment-specific values
- Run the project mentally through its layers before generating code

## What Claude Should Never Do

- Use `@Data` on JPA entities (causes issues with Hibernate)
- Use `FetchType.EAGER`
- Skip Liquibase and use `ddl-auto: create` or `update` in any environment
- Return raw entities from controllers
- Use `var` where the type is not obvious from the right-hand side
- Generate code without corresponding tests for service layer
- Use `localStorage` for storing JWT (use httpOnly cookies or memory)
