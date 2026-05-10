package com.school.attendance.config;

import com.school.attendance.model.Preceptor;
import com.school.attendance.model.Role;
import com.school.attendance.model.User;
import com.school.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Running DataMigrationRunner...");

        // 1. Migrate existing users: set username = dni where username is null
        List<User> existingUsers = userRepository.findAll();
        for (User user : existingUsers) {
            if (user.getUsername() == null) {
                user.setUsername(user.getDni());
                userRepository.save(user);
                log.info("Migrated user DNI {} to username {}", user.getDni(), user.getDni());
            }
        }

        // 2. Inject Preceptors if they don't exist
        injectPreceptor("marcela", "Marcela", "Preceptora");
        injectPreceptor("juli", "Juli", "Preceptora");
        injectPreceptor("rosario", "Rosario", "Preceptora");
        
        // 3. Make sure admin has username 'admin'
        userRepository.findByDni("admin").ifPresent(admin -> {
            if (!"admin".equals(admin.getUsername())) {
                admin.setUsername("admin");
                userRepository.save(admin);
                log.info("Set admin username to 'admin'");
            }
        });
        
        log.info("DataMigrationRunner completed.");
    }

    private void injectPreceptor(String username, String firstName, String lastName) {
        if (userRepository.findByUsername(username).isEmpty() && userRepository.findByDni(username).isEmpty()) {
            Preceptor preceptor = Preceptor.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .dni(username) // Use same for DNI to avoid nulls/conflicts
                    .username(username)
                    .password(passwordEncoder.encode(username))
                    .role(Role.PRECEPTOR)
                    .build();
            userRepository.save(preceptor);
            log.info("Injected preceptor: {}", username);
        }
    }
}
