package com.example.car_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CarManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarManagementApplication.class, args);
	}

}
