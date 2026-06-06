package com.shawilTech.netproxi.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI identityServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NetProxi Identity Service API")
                        .description("Handles authentication, registration, and user management")
                        .version("v1.0.0")
                );
    }

}
