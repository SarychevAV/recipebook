# CLAUDE.md — recipebook

Это главный файл-инструкция для Claude Code. Читай его полностью перед началом любой задачи.

---

## О проекте

**recipebook** — веб-приложение для сохранения и публикации рецептов.
Гости могут просматривать публичные рецепты без регистрации. Авторизованные пользователи могут создавать, редактировать и управлять своими рецептами с фотографиями.

**Структура монорепо:**
```
recipebook/
├── backend/          # Spring Boot 3 + Java 21
├── frontend/         # React + TypeScript + Vite
├── docker-compose.yml
└── CLAUDE.md
```

---

## Технологический стек

### Backend
- **Java 21** (используй records, sealed classes, pattern matching там где уместно)
- **Spring Boot 3.x**
- **Spring Security 6** + JWT (stateless, без сессий)
- **Spring Data JPA** + **PostgreSQL**
- **Liquibase** для миграций БД
- **MapStruct** для маппинга DTO
- **Lombok** (только `@Builder`, `@Getter`, `@Slf4j` — не используй `@Data` на entities)
- **Testcontainers** + **JUnit 5** + **MockMvc** для тестов
- **MinIO** (S3-совместимое хранилище) для фото в dev; S3 в prod

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** как сборщик
- **TanStack Query v5** для серверного состояния
- **React Hook Form** + **Zod** для форм и валидации
- **Tailwind CSS** + **shadcn/ui** для UI компонентов
- **React Router v6** для маршрутизации
- **Axios** с interceptors для HTTP запросов

### Инфраструктура
- **Docker + Docker Compose** для локальной разработки
- **Railway** для production хостинга
- **GitHub Actions** для CI

---

## Архитектура Backend

### Структура пакетов (по фичам)
```
com.recipebook/
├── common/
│   ├── exception/        # GlobalExceptionHandler, кастомные исключения
│   ├── response/         # ApiResponse<T> обёртка
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
└── storage/              # Абстракция для загрузки фото
```

### Правила слоёв
- **Controller** → принимает HTTP запросы, валидирует входные данные, делегирует в Service, возвращает ResponseEntity
- **Service** → только бизнес-логика, без HTTP, без прямых вызовов Repository из Controller
- **Repository** → только доступ к данным, кастомные JPQL/native запросы здесь
- **Entity** → JPA маппинг, никакой бизнес-логики, никаких аннотаций сериализации
- **DTO** → отдельные Request/Response DTO для каждого use case, маппинг через MapStruct

### Соглашения по Entity
```java
// Всегда используй этот базовый класс для entities
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
- Используй `UUID` для всех primary keys (никогда auto-increment Long для публичных API)
- Избегай двунаправленных JPA связей без крайней необходимости
- По умолчанию всегда `FetchType.LAZY`
- Никогда не отдавай Entity напрямую в ответе API

### Соглашения по API
```
GET    /api/v1/recipes              # публичный, с пагинацией
GET    /api/v1/recipes/{id}         # публичный
POST   /api/v1/recipes              # требует авторизации
PUT    /api/v1/recipes/{id}         # требует авторизации, только владелец
DELETE /api/v1/recipes/{id}         # требует авторизации, только владелец
POST   /api/v1/recipes/{id}/photos  # требует авторизации, multipart
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/users/me
```

### Формат ответов
Всегда оборачивай ответы в `ApiResponse<T>`:
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
Ошибки следуют RFC 7807 Problem Details:
```json
{
  "type": "/errors/not-found",
  "title": "Recipe not found",
  "status": 404,
  "detail": "Recipe with id=abc does not exist"
}
```

### Обработка исключений
- Все исключения проходят через `@ControllerAdvice GlobalExceptionHandler`
- Создавай доменные исключения: `RecipeNotFoundException`, `UnauthorizedAccessException`
- Никогда не возвращай 500 для ошибок бизнес-логики
- Логируй через `@Slf4j` — ERROR для неожиданных ошибок, WARN для нарушений бизнес-правил

### Правила безопасности
- JWT секрет только из переменной окружения `JWT_SECRET` (никогда не хардкодить)
- Время жизни токенов: 24ч access, 7д refresh
- Публичные endpoints: `GET /api/v1/recipes/**`, `POST /api/v1/auth/**`
- Все остальные endpoints требуют авторизации
- Проверка владельца ресурса — в слое Service, не в Controller

### Стандарты тестирования
- Unit тесты для каждого метода Service
- Integration тесты с Testcontainers для репозиториев и контроллеров
- Именование тестов: `methodName_whenCondition_thenExpectedResult`
- Минимальное покрытие: 80% для слоя Service
- Используй `@Sql` аннотации или builders для тестовых данных, никогда не делись мутабельным состоянием между тестами

```java
// Пример структуры теста
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

### Миграции Liquibase
```
backend/src/main/resources/db/changelog/
├── db.changelog-master.yaml
├── V1__create_users.sql
├── V2__create_recipes.sql
├── V3__create_ingredients.sql
└── V4__create_tags.sql
```
- Один файл на одно логическое изменение, никогда не редактируй существующие файлы миграций
- Всегда добавляй rollback скрипты

---

## Архитектура Frontend

### Структура проекта
```
frontend/src/
├── api/              # Axios instance + API функции по доменам
├── components/
│   ├── ui/           # shadcn/ui базовые компоненты (не изменять)
│   └── shared/       # переиспользуемые компоненты приложения
├── features/
│   ├── auth/         # Login, Register компоненты + hooks
│   ├── recipes/      # RecipeCard, RecipeForm, RecipeDetail
│   └── profile/      # Профиль пользователя, мои рецепты
├── hooks/            # Кастомные hooks
├── lib/              # utils, zod schemas, константы
├── pages/            # Компоненты уровня роута, только тонкие обёртки
├── router/           # Описание роутов, protected route обёртка
├── store/            # Auth состояние (Zustand или Context)
└── types/            # Общие TypeScript типы и интерфейсы
```

### Правила компонентов
- Один компонент — один файл
- Компоненты фич живут в `features/`, не в `components/`
- Pages — тонкие обёртки, логика живёт в hooks и features
- `React.FC` использовать редко — предпочитай обычные function declarations
- Все формы используют React Hook Form + Zod валидацию

### Слой API
```typescript
// api/recipes.ts — всегда типизируй request и response
export const getRecipes = (params: RecipeQueryParams): Promise<PagedResponse<RecipeDto>> =>
  api.get('/recipes', { params }).then(r => r.data);

export const createRecipe = (data: CreateRecipeRequest): Promise<RecipeDto> =>
  api.post('/recipes', data).then(r => r.data);
```

### Соглашения TanStack Query
```typescript
// hooks/useRecipes.ts
export const useRecipes = (params: RecipeQueryParams) =>
  useQuery({
    queryKey: ['recipes', params],
    queryFn: () => getRecipes(params),
    staleTime: 1000 * 60 * 5, // 5 минут для публичных данных
  });

export const useCreateRecipe = () =>
  useMutation({
    mutationFn: createRecipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  });
```

### Правила TypeScript
- `strict: true` в tsconfig — без исключений
- Никакого `any` — используй `unknown` и type guards если нужно
- Все типы ответов API должны точно соответствовать backend DTO
- Zod schemas одновременно служат runtime валидаторами и источником типов

---

## Docker и локальная разработка

### docker-compose.yml (dev)
Сервисы:
- `postgres` — PostgreSQL 16, порт 5432
- `minio` — хранилище фото, порты 9000/9001
- `backend` — Spring Boot с hot reload через spring-devtools
- `frontend` — Vite dev сервер с HMR

### Переменные окружения
Backend (`.env` в папке `backend/`):
```
DB_URL=jdbc:postgresql://localhost:5432/recipebook
DB_USERNAME=recipebook
DB_PASSWORD=secret
JWT_SECRET=<минимум 256-битный секрет>
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```
Frontend (`.env` в папке `frontend/`):
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**Никогда не коммить `.env` файлы. Всегда предоставляй `.env.example`.**

---

## Git и CI соглашения

### Стратегия веток
```
main          # только production-ready код
develop       # интеграционная ветка
feature/*     # новые фичи
fix/*         # исправление багов
```

### Формат коммитов (Conventional Commits)
```
feat(recipe): add photo upload endpoint
fix(auth): correct JWT expiry calculation
refactor(user): extract UserMapper to separate class
test(recipe): add integration tests for RecipeService
```

### GitHub Actions CI
При каждом PR в `develop` и `main`:
1. Backend: `./mvnw verify` (включая Testcontainers тесты)
2. Frontend: `tsc --noEmit` + `eslint` + `vitest`
3. Проверка сборки Docker образа

---

## Что Claude должен делать всегда

- Читать этот файл перед началом любой задачи
- Задавать уточняющие вопросы перед написанием кода если требования неоднозначны
- Писать тесты вместе с реализацией, а не после
- Следовать существующей структуре пакетов — никогда не создавать новые пакеты верхнего уровня без обсуждения
- Использовать constructor injection, никогда `@Autowired` на полях
- Предпочитать иммутабельные DTO (Java records для response DTO)
- Никогда не хардкодить секреты, URL и environment-специфичные значения
- Мысленно прогонять задачу через все слои проекта перед генерацией кода

## Что Claude никогда не должен делать

- Использовать `@Data` на JPA entities (вызывает проблемы с Hibernate)
- Использовать `FetchType.EAGER`
- Пропускать Liquibase и использовать `ddl-auto: create` или `update` в любом окружении
- Возвращать Entity напрямую из Controller
- Использовать `var` там где тип не очевиден из правой части выражения
- Генерировать код без соответствующих тестов для слоя Service
- Хранить JWT в `localStorage` (использовать httpOnly cookies или память)
