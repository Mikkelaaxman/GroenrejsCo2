package com.groenrejs.Co2Calc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

@SpringBootApplication
public class Co2CalcApplication extends WebMvcConfigurationSupport {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry){
		registry.addResourceHandler("/**")
				.addResourceLocations("classpath:/static");
	}

	public static void main(String[] args) {
		SpringApplication.run(Co2CalcApplication.class, args);
	}

}
