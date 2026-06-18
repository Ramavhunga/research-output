package za.co.univen.research_output.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origin-patterns:http://localhost:4200,http://localhost:4201,http://localhost:3000,http://127.0.0.1:4200,http://127.0.0.1:3000,https://*.azurestaticapps.net,https://*.azurewebsites.net}")
    private String allowedOriginPatterns;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(parseAllowedOriginPatterns())
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type", "X-Total-Count")
                .allowCredentials(true)
                .maxAge(3600);
    }

    private String[] parseAllowedOriginPatterns() {
        return Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }
}
