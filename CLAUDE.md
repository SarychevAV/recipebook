# CLAUDE.md — Мандаринка (recipebook)

Это главный файл-инструкция для Claude Code. Читай его полностью перед началом любой задачи.

---

## О проекте

**Мандаринка** — веб-приложение для сохранения и публикации кулинарных рецептов.
Гости могут просматривать публичные рецепты без регистрации. Авторизованные пользователи могут создавать, редактировать и управлять своими рецептами с фотографиями.

Сайт: **darink.ru**
Аудитория: мобильные пользователи в приоритете (375px+).

**Структура монорепо:**
```
recipebook/
├── backend/                  # Spring Boot 3 + Java 21
├── frontend/                 # React + TypeScript + Vite
├── docs/design/              # Скриншоты дизайн-референсов
├── .github/workflows/
│   └── deploy.yml            # Автодеплой при push в main
├── docker-compose.yml        # Локальная разработка
├── docker-compose.prod.yml   # Production
└── CLAUDE.md
```

---

## Технологический стек

### Backend
- **Java 21** (используй records, sealed classes, pattern matching там где уместно)
- **Spring Boot 3.x**
- **Spring Security 6** + JWT (stateless, без сессий)
- **Spring Data JPA** + **PostgreSQL 16**
- **Liquibase** для миграций БД
- **MapStruct** для маппинга DTO
- **Lombok** (только `@Builder`, `@Getter`, `@Slf4j` — не используй `@Data` на entities)
- **Testcontainers** + **JUnit 5** + **MockMvc** для тестов
- **MinIO** (S3-совместимое хранилище) для фото

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** как сборщик
- **TanStack Query v5** для серверного состояния
- **React Hook Form** + **Zod** для форм и валидации
- **Tailwind CSS** + **shadcn/ui** для UI компонентов
- **React Router v6** для маршрутизации
- **Axios** с interceptors для HTTP запросов

### Инфраструктура
- **Docker + Docker Compose** (два файла — dev и prod)
- **Timeweb Cloud VPS** — Ubuntu 22.04, 2GB RAM, IP: 147.45.153.120
- **nginx** — реверс-прокси, слушает 80/443
- **GitHub Actions** для автодеплоя при push в `main`

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
├── storage/              # Абстракция для загрузки фото в MinIO
└── ai/                   # AI функции (Spring AI + Ollama) — планируется
```

### Правила слоёв
- **Controller** → принимает HTTP запросы, валидирует входные данные, делегирует в Service, возвращает ResponseEntity
- **Service** → только бизнес-логика, без HTTP, без прямых вызовов Repository из Controller
- **Repository** → только доступ к данным, кастомные JPQL/native запросы здесь
- **Entity** → JPA маппинг, никакой бизнес-логики, никаких аннотаций сериализации
- **DTO** → отдельные Request/Response DTO для каждого use case, маппинг через MapStruct

### Соглашения по Entity
```java
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
GET    /api/v1/recipes                  # публичный, с пагинацией
GET    /api/v1/recipes/{id}             # публичный
POST   /api/v1/recipes                  # требует авторизации
PUT    /api/v1/recipes/{id}             # требует авторизации, только владелец
DELETE /api/v1/recipes/{id}             # требует авторизации, только владелец
POST   /api/v1/recipes/{id}/photos      # требует авторизации, multipart
POST   /api/v1/recipes/{id}/favorite    # требует авторизации
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/users/me
```

### Формат ответов
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
Ошибки по RFC 7807 Problem Details:
```json
{
  "type": "/errors/not-found",
  "title": "Recipe not found",
  "status": 404,
  "detail": "Recipe with id=abc does not exist"
}
```

### Обработка исключений
- Все исключения → `@ControllerAdvice GlobalExceptionHandler`
- Доменные исключения: `RecipeNotFoundException`, `UnauthorizedAccessException`
- Никогда не возвращай 500 для ошибок бизнес-логики
- Логируй через `@Slf4j` — ERROR для неожиданных ошибок, WARN для нарушений бизнес-правил

### Правила безопасности
- JWT секрет только из `JWT_SECRET` переменной окружения
- Время жизни токенов: 24ч access, 7д refresh
- Публичные endpoints: `GET /api/v1/recipes/**`, `POST /api/v1/auth/**`
- Проверка владельца ресурса — в слое Service, не в Controller

### Стандарты тестирования
- Unit тесты для каждого метода Service
- Integration тесты с Testcontainers для репозиториев и контроллеров
- Именование: `methodName_whenCondition_thenExpectedResult`
- Минимальное покрытие: 80% для слоя Service

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class RecipeServiceTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Test
    void createRecipe_whenUserAuthenticated_thenRecipeSaved() { ... }
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
- Один файл на одно логическое изменение
- Никогда не редактировать существующие файлы миграций
- Всегда добавлять rollback скрипты

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
├── pages/            # Тонкие обёртки уровня роута
├── router/           # Описание роутов, ProtectedRoute
├── store/            # Auth состояние
└── types/            # Общие TypeScript типы
```

### UI/UX соглашения (мобиль в приоритете)

**Дизайн система:**
- Акцентный цвет: `#F97316` (orange-500)
- Фон страниц: `#F9FAFB` (gray-50)
- Карточки: `rounded-2xl`, `shadow-sm`, белый фон
- Шрифт: Inter
- Всё должно корректно отображаться от 375px

**Навигация:**
- Bottom Tab Bar — основная навигация на мобиле
- Пункты: Лента (🏠), Поиск (🔍), Создать (➕), Мои рецепты (📖), Профиль (👤)
- Активный пункт — оранжевый `#F97316`
- Кнопка "Создать" — крупнее остальных, оранжевый фон

**Обязательные правила UI:**
- Теги/фильтры — горизонтальный скролл в одну строку, без переносов
- Автор рецепта — показывать `username`, никогда не `email`
- Единицы измерения — строчными: "г", "мл", "кг", "л", "шт"
- Breadcrumbs — обычный регистр, не КАПСЛОК
- Кнопки "Редактировать/Удалить" — в меню "···" (три точки), не в основном контенте
- Placeholder без фото — нейтральный серый градиент, не жёлтый
- Форма создания рецепта — многошаговая (4 шага) с прогресс-баром

**Ингредиент в форме — одна строка:**
```
[Название (flex-grow)] [Кол-во (80px)] [Единица dropdown (70px)] [🗑️]
```
Единицы в dropdown: г, кг, мл, л, шт, ст.л, ч.л, по вкусу

**Статистика рецепта с иконками:**
```
⏱ 30 мин   👥 2 порции   🥕 3 ингредиента
```

### Правила компонентов
- Один компонент — один файл
- Компоненты фич живут в `features/`, не в `components/`
- Pages — тонкие обёртки, логика в hooks и features
- Предпочитай обычные function declarations вместо `React.FC`
- Все формы — React Hook Form + Zod
- URL для API — всегда относительные (`/api/v1/...`), никогда не хардкодить домен или IP

### Слой API
```typescript
export const getRecipes = (params: RecipeQueryParams): Promise<PagedResponse<RecipeDto>> =>
  api.get('/recipes', { params }).then(r => r.data);
```

### TanStack Query
```typescript
export const useRecipes = (params: RecipeQueryParams) =>
  useQuery({
    queryKey: ['recipes', params],
    queryFn: () => getRecipes(params),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateRecipe = () =>
  useMutation({
    mutationFn: createRecipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  });
```

### TypeScript
- `strict: true` — без исключений
- Никакого `any` — используй `unknown` и type guards
- Zod schemas = runtime валидация + источник типов

---

## Docker

**Два файла — используй правильный:**

| | dev | prod |
|---|---|---|
| Команда | `docker compose up -d` | `docker compose -f docker-compose.prod.yml up -d --build` |
| Frontend | Vite dev + HMR | nginx со статическим билдом |
| Порты БД | открыты наружу | только внутри Docker сети |
| Env | дефолтные dev значения | из `backend/.env` |

---

## Деплой

**Сервер:** Timeweb Cloud VPS
**Путь:** `/home/deploy/recipebook`
**Пользователь:** `deploy`

**nginx** (`/etc/nginx/sites-available/recipebook`):
- `/` → `http://localhost:3000` (frontend контейнер)
- `/api` → `http://localhost:8080` (backend контейнер)

**Ручной деплой:**
```bash
ssh deploy@147.45.153.120
cd /home/deploy/recipebook
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

**Автодеплой:** GitHub Actions при push в `main`.

---

## Переменные окружения

`backend/.env` (локально):
```
DB_URL=jdbc:postgresql://postgres:5432/recipebook
DB_USERNAME=recipebook
DB_PASSWORD=secret
JWT_SECRET=dev-secret-key-minimum-256-bits
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_PUBLIC_URL=http://localhost:9000
ADMIN_EMAIL=admin@recipebook.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=admin
```

`frontend/.env` (локально):
```
VITE_API_BASE_URL=/api/v1
```

**Никогда не коммить `.env`. Всегда поддерживай `.env.example` актуальным.**

---

## Git соглашения

```
main          # production-ready → автодеплой
develop       # интеграционная ветка
feature/*     # новые фичи
fix/*         # исправление багов
```

Формат коммитов:
```
feat(recipe): add photo upload endpoint
fix(ui): replace tags wrap with horizontal scroll
fix(auth): correct JWT expiry calculation
refactor(user): extract UserMapper to separate class
test(recipe): add integration tests for RecipeService
```

---

## AI интеграция (планируется)

Spring AI + Ollama — всё локально, без внешних API:
- LLM: llama3.2 через Ollama
- Эмбеддинги: nomic-embed-text
- Векторное хранилище: PGVector (расширение PostgreSQL)
- Пакет: `com.recipebook.ai`
- При сохранении APPROVED рецепта → индексировать через `RecipeIndexingService`

---

## Что Claude должен делать всегда

- Читать этот файл перед началом любой задачи
- Задавать уточняющие вопросы если требования неоднозначны
- Писать тесты вместе с реализацией, не после
- Следовать существующей структуре пакетов
- Использовать constructor injection, никогда `@Autowired` на полях
- Предпочитать иммутабельные DTO (Java records для response DTO)
- Никогда не хардкодить секреты, URL и environment-специфичные значения
- При изменении UI — проверять мобильный вид в первую очередь (375px)
- Мысленно прогонять задачу через все слои перед генерацией кода

## Что Claude никогда не должен делать

- Использовать `@Data` на JPA entities
- Использовать `FetchType.EAGER`
- Пропускать Liquibase и использовать `ddl-auto: create` или `update`
- Возвращать Entity напрямую из Controller
- Использовать `var` там где тип не очевиден из правой части
- Генерировать код без тестов для слоя Service
- Хранить JWT в `localStorage`
- Показывать `email` пользователя в UI — только `username`
- Хардкодить домен, IP или порт во frontend коде
- На сервере запускать `docker compose up` без `-f docker-compose.prod.yml`
