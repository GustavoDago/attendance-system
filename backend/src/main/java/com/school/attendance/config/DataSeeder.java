package com.school.attendance.config;

import com.school.attendance.model.Role;
import com.school.attendance.model.User;
import com.school.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .dni("admin")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.PRINCIPAL)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created: admin / admin");
        }
    }
}
