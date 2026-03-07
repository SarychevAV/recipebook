package com.recipebook.common.config;

import com.recipebook.ingredient.IngredientEntity;
import com.recipebook.recipe.RecipeEntity;
import com.recipebook.recipe.RecipeRepository;
import com.recipebook.recipe.RecipeStatus;
import com.recipebook.storage.StorageService;
import com.recipebook.tag.TagEntity;
import com.recipebook.tag.TagRepository;
import com.recipebook.user.UserEntity;
import com.recipebook.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class RecipeSeeder implements ApplicationRunner {

    private final RecipeRepository recipeRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final PlatformTransactionManager txManager;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${seed.photos-dir:docs/recipe-photos}")
    private String photosDir;

    // ── Seed data records ──────────────────────────────────────────────────

    record IngredientData(String name, String amount, String unit) {}

    record RecipeData(
            String title,
            String description,
            String instructions,
            int cookingTimeMinutes,
            int servings,
            List<String> tags,
            List<IngredientData> ingredients,
            String photoSeed
    ) {}

    // ── ApplicationRunner ──────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        if (recipeRepository.existsByStatus(RecipeStatus.PUBLISHED)) {
            log.debug("Published recipes already exist — skipping seed");
            return;
        }

        UserEntity admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            log.warn("Admin user '{}' not found — skipping recipe seed", adminEmail);
            return;
        }

        TransactionTemplate tx = new TransactionTemplate(txManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        log.info("Seeding {} sample recipes into the database…", SEED_RECIPES.size());
        for (RecipeData data : SEED_RECIPES) {
            try {
                tx.execute(status -> { seedRecipe(data, admin); return null; });
            } catch (Exception e) {
                log.error("Failed to seed recipe '{}': {}", data.title(), e.getMessage());
            }
        }
        log.info("Recipe seeding complete");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void seedRecipe(RecipeData data, UserEntity admin) {
        Set<TagEntity> tags = new HashSet<>();
        for (String tagName : data.tags()) {
            TagEntity tag = tagRepository.findByNameIgnoreCase(tagName)
                    .orElseGet(() -> tagRepository.save(TagEntity.builder().name(tagName).build()));
            tags.add(tag);
        }

        // Load photo before saving the recipe — single save, no double-write
        Optional<String> photoUrl = loadAndUploadPhoto(data.photoSeed());

        RecipeEntity recipe = RecipeEntity.builder()
                .title(data.title())
                .description(data.description())
                .instructions(data.instructions())
                .cookingTimeMinutes(data.cookingTimeMinutes())
                .servings(data.servings())
                .status(RecipeStatus.PUBLISHED)
                .owner(admin)
                .build();
        recipe.replaceTags(tags);
        photoUrl.ifPresent(recipe::updatePhotoUrl);

        // Single persist — @CreationTimestamp fires here
        RecipeEntity saved = recipeRepository.save(recipe);

        // Add ingredients to the managed entity — cascade handles their INSERT at flush
        List<IngredientEntity> ingredients = new ArrayList<>();
        List<IngredientData> ingList = data.ingredients();
        for (int i = 0; i < ingList.size(); i++) {
            IngredientData ing = ingList.get(i);
            ingredients.add(IngredientEntity.builder()
                    .recipe(saved)
                    .name(ing.name())
                    .amount(ing.amount())
                    .unit(ing.unit())
                    .orderIndex(i)
                    .build());
        }
        saved.replaceIngredients(ingredients);

        log.info("  ✓ Seeded: {}", data.title());
    }

    private Optional<String> loadAndUploadPhoto(String seed) {
        try {
            Path photoPath = Path.of(photosDir, seed + ".png");
            if (!Files.exists(photoPath)) {
                log.warn("Seed photo not found: {}", photoPath.toAbsolutePath());
                return Optional.empty();
            }
            byte[] bytes = Files.readAllBytes(photoPath);
            String url = storageService.upload(seed + ".png", new ByteArrayInputStream(bytes), bytes.length, "image/png");
            return Optional.of(url);
        } catch (Exception e) {
            log.warn("Could not load/upload photo for '{}': {}", seed, e.getMessage());
            return Optional.empty();
        }
    }

    // ── Recipe seed data ───────────────────────────────────────────────────

    private static final List<RecipeData> SEED_RECIPES = List.of(

        new RecipeData(
            "Паста Карбонара",
            "Классическая римская паста с шёлковым соусом из яиц и пекорино, без капли сливок — только мастерство.",
            """
            Поставьте большую кастрюлю с подсоленной водой на огонь и доведите до кипения.
            Нарежьте гуанчиале или панчетту кубиками 1 см и обжарьте на сухой сковороде до хрустящей корочки. Отставьте в сторону вместе с вытопившимся жиром.
            В миске венчиком взбейте 2 целых яйца и 1 желток, добавьте натёртый пекорино романо, щедро поперчите. Консистенция должна напоминать густой крем.
            Отварите спагетти до состояния аль денте — на 1 минуту меньше, чем указано на упаковке.
            Перед сливом зачерпните 150–200 мл крахмалистой воды от макарон.
            Слейте пасту и сразу переложите в сковороду к гуанчиале. Огонь выключите.
            Вылейте яично-сырную смесь на пасту и быстро перемешивайте, подливая воду от макарон ложка за ложкой, пока соус не станет кремовым и обволакивающим.
            Подавайте немедленно, посыпав свежемолотым чёрным перцем и пекорино.
            """,
            25, 2,
            List.of("Итальянская кухня"),
            List.of(
                new IngredientData("Спагетти", "200", "г"),
                new IngredientData("Гуанчиале или панчетта", "100", "г"),
                new IngredientData("Яйца", "2", "шт"),
                new IngredientData("Яичный желток", "1", "шт"),
                new IngredientData("Пекорино романо", "60", "г"),
                new IngredientData("Чёрный перец молотый", "", "по вкусу"),
                new IngredientData("Соль", "", "по вкусу")
            ),
            "carbonara"
        ),

        new RecipeData(
            "Пицца Маргарита",
            "Неаполитанская пицца с хрустящим бортом, томатным соусом San Marzano и расплавленной моцареллой — квинтэссенция итальянской кухни.",
            """
            В миске смешайте тёплую воду (35 °C), дрожжи и щепотку сахара. Оставьте на 10 минут до появления пены.
            Просейте муку горкой, сделайте лунку, влейте дрожжевую смесь, добавьте соль и оливковое масло. Замесите эластичное тесто, не липнущее к рукам, — около 10 минут.
            Уложите тесто в смазанную миску, накройте и оставьте в тепле на 1 час или до удвоения объёма.
            Разогрейте духовку до максимума (250–280 °C) с камнем для пиццы или перевёрнутым противнем.
            Томаты San Marzano разомните руками, приправьте солью, сахаром и орегано — соус готов без варки.
            Растяните тесто руками в круг диаметром 30 см, не используя скалку.
            Распределите томатный соус тонким слоем, оставив бортики. Разорвите моцареллу руками и разложите по поверхности.
            Сбрызните оливковым маслом, выпекайте 8–10 минут до обугленных пятен на бортах.
            Сразу после выпечки украсьте свежим базиликом.
            """,
            45, 4,
            List.of("Итальянская кухня", "Вегетарианское"),
            List.of(
                new IngredientData("Мука 00 или высшего сорта", "300", "г"),
                new IngredientData("Вода тёплая", "200", "мл"),
                new IngredientData("Сухие дрожжи", "5", "г"),
                new IngredientData("Оливковое масло", "2", "ст. л."),
                new IngredientData("Соль", "1", "ч. л."),
                new IngredientData("Томаты San Marzano", "400", "г"),
                new IngredientData("Моцарелла", "200", "г"),
                new IngredientData("Свежий базилик", "", "по вкусу"),
                new IngredientData("Орегано сухой", "1", "ч. л.")
            ),
            "pizza"
        ),

        new RecipeData(
            "Суши с лососем",
            "Роллы нигири с сочным атлантическим лосося и идеально приправленным суши-рисом — японская классика у вас дома.",
            """
            Промойте рис в нескольких водах, пока вода не станет прозрачной. Замочите на 30 минут, затем слейте.
            Отварите рис: залейте холодной водой 1:1.2, доведите до кипения, убавьте огонь до минимума, готовьте 12 минут под крышкой. Дайте настояться 10 минут.
            Смешайте рисовый уксус, сахар и соль, нагрейте до растворения. Аккуратно вмешайте заправку в горячий рис лопаткой, не нарушая текстуру зёрен.
            Накройте рис влажным полотенцем и дайте остыть до комнатной температуры.
            Лосося нарежьте ломтиками 5 мм под углом 45°, предварительно подморозив (30 минут в морозилке), — так проще получить ровный срез.
            Смочите руки в воде с уксусом. Возьмите ≈20 г риса, мягко сформируйте продолговатый нигири.
            Тонко намажьте васаби, уложите ломтик лосося поверх — рис должен быть виден с боков.
            Подавайте с соевым соусом, маринованным имбирём и васаби.
            """,
            60, 4,
            List.of("Японская кухня"),
            List.of(
                new IngredientData("Рис для суши", "300", "г"),
                new IngredientData("Лосось (сашими-качество)", "300", "г"),
                new IngredientData("Рисовый уксус", "60", "мл"),
                new IngredientData("Сахар", "2", "ст. л."),
                new IngredientData("Соль", "1", "ч. л."),
                new IngredientData("Васаби", "1", "ч. л."),
                new IngredientData("Соевый соус", "4", "ст. л."),
                new IngredientData("Маринованный имбирь", "50", "г")
            ),
            "sushi"
        ),

        new RecipeData(
            "Курица Тикка Масала",
            "Сочная куриная грудка в маринаде тандури, тушёная в насыщенном томатно-сливочном соусе с букетом индийских специй.",
            """
            Нарежьте курицу кубиками 3–4 см. Смешайте с йогуртом, соком лимона, тандури-масалой, куркумой, паприкой, солью и пропущенным через пресс чесноком. Маринуйте минимум 2 часа (лучше — ночь).
            Запеките курицу в духовке при 220 °C на решётке 18–20 минут до лёгкого обугливания краёв, или обжарьте партиями на сухой сковороде-гриль.
            Разогрейте масло гхи в казане. Обжарьте мелко нарезанный лук до золотого, около 10 минут.
            Добавьте чеснок и тёртый имбирь, жарьте 2 минуты до аромата.
            Всыпьте зиру, кориандр, кардамон, гарам-масалу. Жарьте специи 1 минуту.
            Добавьте томатное пюре, готовьте 8 минут до потемнения и загустения.
            Влейте жирные сливки, перемешайте. Положите запечённую курицу, тушите 10 минут на медленном огне.
            Скорректируйте соль и остроту. Украсьте листьями свежей кинзы.
            Подавайте с горячим рисом басмати или хлебом наан.
            """,
            50, 4,
            List.of("Индийская кухня"),
            List.of(
                new IngredientData("Куриное филе", "700", "г"),
                new IngredientData("Натуральный йогурт", "150", "мл"),
                new IngredientData("Тандури-масала", "2", "ст. л."),
                new IngredientData("Гарам-масала", "1", "ч. л."),
                new IngredientData("Томатное пюре", "300", "мл"),
                new IngredientData("Жирные сливки", "150", "мл"),
                new IngredientData("Репчатый лук", "2", "шт"),
                new IngredientData("Чеснок", "4", "зуб."),
                new IngredientData("Имбирь свежий", "3", "см"),
                new IngredientData("Масло гхи или растительное", "2", "ст. л."),
                new IngredientData("Кинза свежая", "", "по вкусу")
            ),
            "curry"
        ),

        new RecipeData(
            "Тако аль Пастор",
            "Мексиканские тако с маринованной свининой на углях, ананасом и соусом сальса — уличная еда, покорившая весь мир.",
            """
            Приготовьте маринад: смешайте сок апельсина, сок лайма, чеснок, орегано, тмин, паприку, чили и соль.
            Нарежьте свинину ломтиками 1 см, залейте маринадом. Оставьте в холодильнике на 4–8 часов.
            Для сальсы: мелко нарежьте томаты, лук, перец чили, кинзу. Смешайте с соком лайма и солью. Оставьте настояться 20 минут.
            Разогрейте сковороду-гриль или уличный гриль до максимума. Обжарьте ломтики свинины по 2–3 минуты с каждой стороны.
            На той же сковороде нарежьте ломтики ананаса, прогрейте 1–2 минуты.
            Разогрейте тортильи на сухой сковороде по 30 секунд с каждой стороны.
            Уложите мясо на тортилью, добавьте ананас, сальсу, нарезанный лук и кинзу. Сбрызните соком лайма.
            """,
            40, 4,
            List.of("Мексиканская кухня"),
            List.of(
                new IngredientData("Свиная шея", "600", "г"),
                new IngredientData("Кукурузные тортильи", "12", "шт"),
                new IngredientData("Ананас", "200", "г"),
                new IngredientData("Сок апельсина", "100", "мл"),
                new IngredientData("Сок лайма", "2", "ст. л."),
                new IngredientData("Чеснок", "3", "зуб."),
                new IngredientData("Паприка копчёная", "2", "ч. л."),
                new IngredientData("Томаты", "3", "шт"),
                new IngredientData("Красный лук", "1", "шт"),
                new IngredientData("Перец чили", "1", "шт"),
                new IngredientData("Кинза", "", "пучок")
            ),
            "tacos"
        ),

        new RecipeData(
            "Пад Тай",
            "Тайская обжаренная рисовая лапша с креветками, хрустящим арахисом и пряно-кисло-сладким соусом тамаринда.",
            """
            Замочите рисовую лапшу в холодной воде на 30 минут. Слейте воду — лапша должна быть мягкой, но ещё немного жёсткой.
            Приготовьте соус Пад Тай: смешайте рыбный соус, устричный соус, пасту тамаринда и пальмовый сахар. Нагрейте до растворения сахара.
            Сильно разогрейте вок с маслом на максимальном огне. Обжарьте чеснок 30 секунд.
            Добавьте креветки, жарьте 1–2 минуты до розового. Сдвиньте в сторону.
            Вбейте яйца в освободившуюся часть вока, быстро перемешайте до полуготовности.
            Добавьте лапшу, вылейте соус. Перемешивайте, переворачивая лапшу щипцами, 2–3 минуты.
            Добавьте ростки фасоли и часть зелёного лука, перемешайте ещё 30 секунд — ростки должны остаться хрустящими.
            Подавайте немедленно, посыпав дроблёным арахисом и зелёным луком. Подайте дольку лайма отдельно.
            """,
            30, 2,
            List.of("Тайская кухня"),
            List.of(
                new IngredientData("Рисовая лапша", "200", "г"),
                new IngredientData("Тигровые креветки", "200", "г"),
                new IngredientData("Яйца", "2", "шт"),
                new IngredientData("Паста тамаринда", "2", "ст. л."),
                new IngredientData("Рыбный соус", "2", "ст. л."),
                new IngredientData("Устричный соус", "1", "ст. л."),
                new IngredientData("Пальмовый сахар", "1", "ст. л."),
                new IngredientData("Ростки фасоли", "100", "г"),
                new IngredientData("Дроблёный арахис", "40", "г"),
                new IngredientData("Зелёный лук", "", "пучок"),
                new IngredientData("Лайм", "1", "шт")
            ),
            "padthai"
        ),

        new RecipeData(
            "Паэлья с морепродуктами",
            "Испанский символ — рис с шафраном на курином бульоне, мидии, креветки и кальмары, приготовленные на открытом огне в широкой сковороде.",
            """
            Замочите шафран в 3 ст. л. тёплой воды на 15 минут.
            Разогрейте оливковое масло в паэльере или широкой сковороде диаметром 40+ см. Обжарьте кальмары 2 минуты, выньте.
            В той же сковороде обжарьте мелко нарезанный лук 5 минут, добавьте чеснок и томаты, тушите ещё 5 минут до загустения — это «sofrito».
            Всыпьте паприку, перемешайте. Добавьте рис, обжарьте 2 минуты, помешивая.
            Влейте горячий рыбный бульон и шафрановую воду. Посолите, перемешайте — и больше не мешайте!
            Варите рис на среднем огне 10 минут. Разложите мидии и креветки поверх.
            Убавьте огонь до минимума, готовьте ещё 8–10 минут до впитывания бульона.
            Верните кальмары в сковороду. Дайте паэлье постоять 5 минут под фольгой.
            Украсьте дольками лимона и петрушкой. Подавайте прямо в сковороде.
            """,
            55, 6,
            List.of("Испанская кухня"),
            List.of(
                new IngredientData("Рис бомба или арборио", "400", "г"),
                new IngredientData("Мидии в раковинах", "500", "г"),
                new IngredientData("Тигровые креветки", "300", "г"),
                new IngredientData("Кальмар", "200", "г"),
                new IngredientData("Рыбный бульон", "1", "л"),
                new IngredientData("Шафран", "0.5", "г"),
                new IngredientData("Копчёная паприка", "1", "ч. л."),
                new IngredientData("Томаты свежие", "300", "г"),
                new IngredientData("Репчатый лук", "1", "шт"),
                new IngredientData("Чеснок", "4", "зуб."),
                new IngredientData("Оливковое масло", "4", "ст. л."),
                new IngredientData("Лимон", "1", "шт"),
                new IngredientData("Петрушка", "", "пучок")
            ),
            "paella"
        ),

        new RecipeData(
            "Говядина по-бургундски",
            "Французское рагу bœuf bourguignon — говядина, томлённая несколько часов в бургундском вине с жемчужным луком, морковью и шампиньонами.",
            """
            Нарежьте говядину кубиками 4–5 см. Обсушите бумажными полотенцами — это ключ к хорошей корочке.
            Обжарьте бекон в жаровне до хруста, выньте. В вытопившемся жире порциями обжарьте говядину со всех сторон до тёмной корочки — не перегружайте сковороду. Выньте мясо.
            В той же жаровне обжарьте нарезанный лук и морковь 5 минут. Добавьте томатную пасту, жарьте 1 минуту.
            Выложите мясо и бекон обратно. Посыпьте мукой, перемешайте, жарьте 2 минуты.
            Влейте вино, добавьте бульон так, чтобы жидкость едва покрывала мясо. Добавьте тимьян, лавровый лист, давленый чеснок.
            Доведите до кипения, снимите пену. Плотно накройте крышкой и поставьте в духовку 160 °C на 2.5–3 часа — мясо должно легко распадаться.
            За 30 минут до готовности обжарьте шампиньоны с маслом и чесноком на отдельной сковороде до золотистого.
            Добавьте грибы и жемчужный лук в жаровню на последние 20 минут.
            Выньте тимьян и лаврушку. Скорректируйте соль. При необходимости уварите соус на плите до нужной консистенции.
            Подавайте с картофельным пюре или свежим хлебом.
            """,
            180, 6,
            List.of("Французская кухня"),
            List.of(
                new IngredientData("Говядина (лопатка или шея)", "1.2", "кг"),
                new IngredientData("Красное бургундское вино", "750", "мл"),
                new IngredientData("Говяжий бульон", "400", "мл"),
                new IngredientData("Бекон", "150", "г"),
                new IngredientData("Шампиньоны", "300", "г"),
                new IngredientData("Жемчужный лук или шалот", "200", "г"),
                new IngredientData("Морковь", "2", "шт"),
                new IngredientData("Чеснок", "4", "зуб."),
                new IngredientData("Томатная паста", "2", "ст. л."),
                new IngredientData("Мука", "2", "ст. л."),
                new IngredientData("Тимьян свежий", "4", "веточки"),
                new IngredientData("Лавровый лист", "2", "шт"),
                new IngredientData("Сливочное масло", "30", "г")
            ),
            "bourguignon"
        ),

        new RecipeData(
            "Шакшука",
            "Яркое ближневосточное блюдо: яйца-пашот прямо в пряном томатном соусе с перцем и зирой — идеальный завтрак или ужин за 25 минут.",
            """
            Разогрейте оливковое масло в глубокой сковороде с крышкой. Обжарьте мелко нарезанный лук 5 минут до мягкости.
            Добавьте полоски сладкого перца, жарьте ещё 4 минуты.
            Добавьте тонко нарезанный чеснок, зиру, паприку, хлопья чили. Жарьте специи 1 минуту до аромата.
            Вылейте томаты, разомните их лопаткой. Приправьте сахаром, солью, добавьте половину петрушки. Тушите соус 10 минут до загустения.
            Сделайте ложкой 4 углубления в соусе. Аккуратно разбейте по яйцу в каждое.
            Накройте крышкой, готовьте 5–7 минут: белок должен схватиться, желток — остаться жидким.
            Посыпьте оставшейся петрушкой, крошкой феты (по желанию). Подавайте прямо в сковороде с питой или ломтями хлеба.
            """,
            25, 2,
            List.of("Ближневосточная кухня", "Вегетарианское"),
            List.of(
                new IngredientData("Яйца", "4", "шт"),
                new IngredientData("Консервированные томаты", "400", "г"),
                new IngredientData("Сладкий перец", "2", "шт"),
                new IngredientData("Репчатый лук", "1", "шт"),
                new IngredientData("Чеснок", "3", "зуб."),
                new IngredientData("Зира молотая", "1", "ч. л."),
                new IngredientData("Паприка копчёная", "1", "ч. л."),
                new IngredientData("Хлопья чили", "0.5", "ч. л."),
                new IngredientData("Оливковое масло", "2", "ст. л."),
                new IngredientData("Петрушка", "", "пучок"),
                new IngredientData("Фета", "60", "г")
            ),
            "shakshuka"
        ),

        new RecipeData(
            "Том Ям Кунг",
            "Острый тайский суп на кокосовом молоке с ароматными травами, грибами и сочными креветками — согревающий и бодрящий.",
            """
            Нарежьте лемонграсс кусочками 5 см и слегка раздавите рукояткой ножа.
            Нарежьте галангал кружочками, листья кафрского лайма надломите.
            Доведите куриный бульон до кипения, добавьте лемонграсс, галангал, листья лайма и пасту том ям. Варите 5 минут, чтобы специи отдали аромат.
            Добавьте разрезанные напополам грибы эноки или шиитаке, варите 3 минуты.
            Влейте кокосовое молоко, перемешайте. Добавьте рыбный соус и сок лайма — попробуйте, соус должен быть кисло-остро-солёным.
            Добавьте очищенные креветки, варите 2–3 минуты до готовности — они должны свернуться колечком.
            Отрегулируйте вкус: ещё сок лайма для кислоты, рыбный соус для солёности, перец чили для остроты.
            Разлейте по тарелкам, украсьте листьями кинзы и кружочком перца чили.
            """,
            35, 4,
            List.of("Тайская кухня"),
            List.of(
                new IngredientData("Тигровые креветки", "400", "г"),
                new IngredientData("Кокосовое молоко", "400", "мл"),
                new IngredientData("Куриный бульон", "600", "мл"),
                new IngredientData("Паста том ям", "2", "ст. л."),
                new IngredientData("Лемонграсс", "2", "стебля"),
                new IngredientData("Галангал или имбирь", "3", "см"),
                new IngredientData("Листья кафрского лайма", "4", "шт"),
                new IngredientData("Грибы шиитаке или эноки", "150", "г"),
                new IngredientData("Рыбный соус", "2", "ст. л."),
                new IngredientData("Сок лайма", "3", "ст. л."),
                new IngredientData("Перец чили", "1–2", "шт"),
                new IngredientData("Кинза", "", "пучок")
            ),
            "tomyum"
        )
    );
}
