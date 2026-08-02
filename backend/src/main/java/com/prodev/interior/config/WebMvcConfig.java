package com.prodev.interior.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String appDataDir = System.getenv("APPDATA");
        if (appDataDir == null) {
            appDataDir = System.getProperty("user.home") + "/AppData/Roaming";
        }
        Path uploadPath = Paths.get(appDataDir, "InteriorERP", "images");
        
        // Windows 환경 등에서 올바른 file URI 처리를 위해
        String fileResourcePath = uploadPath.toFile().toURI().toString();
        
        registry.addResourceHandler("/images/**")
                .addResourceLocations(fileResourcePath);
    }
}
