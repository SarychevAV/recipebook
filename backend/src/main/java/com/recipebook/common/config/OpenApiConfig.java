package com.recipebook.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class OpenApiConfig implements WebMvcConfigurer {

    /**
     * Spring Framework 6 uses PathPatternParser for resource handlers by default,
     * which rejects patterns with ** in the middle (e.g. /swagger-ui/**‌/*swagger-initializer.js
     * registered internally by springdoc).
     *
     * Calling setPatternParser(null) disables PathPatternParser for resource handlers
     * (usePathPatternParser() → false), so AntPathMatcher is used instead.
     * @RequestMapping mappings are unaffected — they always use PathPatternParser.defaultInstance
     * via mvcPatternParser(), regardless of this setting.
     */
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.setPatternParser(null);
        configurer.setPathMatcher(new AntPathMatcher());
    }

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("RecipeBook API")
                        .description("""
                                REST API для приложения управления рецептами.

                                Позволяет пользователям просматривать публичные рецепты без авторизации,
                                а аутентифицированным пользователям — создавать, редактировать и удалять свои рецепты.

                                **Аутентификация:** Bearer JWT-токен. Получите токен через `/api/v1/auth/login` \
                                и передавайте его в заголовке `Authorization: Bearer <токен>`.""")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("RecipeBook Team")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Введите JWT-токен, полученный при входе в систему")));
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/swagger-ui", "/swagger-ui/index.html");
        registry.addRedirectViewController("/swagger-ui/", "/swagger-ui/index.html");
    }
}
