package com.nbhv.thefinder.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Path.of(uploadDir).toAbsolutePath().toString();
        registry.addResourceHandler("/images/posts/**")
                .addResourceLocations("file:" + absolutePath + "/");

        Path postUploadPath = Path.of(uploadDir);
        Path parent = postUploadPath.getParent();
        Path claimUploadPath = parent == null ? Path.of("claims") : parent.resolve("claims");
        registry.addResourceHandler("/images/claims/**")
                .addResourceLocations("file:" + claimUploadPath.toAbsolutePath() + "/");
    }
}
