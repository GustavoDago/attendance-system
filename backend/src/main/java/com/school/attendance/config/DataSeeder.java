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
            System.out.println("Starting mass data generation for testing...");

            // 1. Principal
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .dni("admin")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.PRINCIPAL)
                    .build();
            userRepository.save(admin);

            // 2. 5 Profesores (5 Courses)
            for (int i = 1; i <= 5; i++) {
                User teacher = User.builder()
                        .firstName("Profesor")
                        .lastName("Curso " + (char) ('A' + i - 1))
                        .dni("prof" + i)
                        .password(passwordEncoder.encode("prof" + i))
                        .role(Role.TEACHER)
                        .build();
                userRepository.save(teacher);
            }

            // 3. 75 Alumnos (15 por cada uno de los 5 cursos)
            int studentCounter = 1;
            for (int course = 1; course <= 5; course++) {
                for (int s = 1; s <= 15; s++) {
                    User student = User.builder()
                            .firstName("Alumno " + s)
                            .lastName("Curso " + (char) ('A' + course - 1))
                            .dni("alum" + studentCounter)
                            .password(passwordEncoder.encode("alum" + studentCounter))
                            .role(Role.STUDENT)
                            .build();
                    userRepository.save(student);
                    studentCounter++;
                }
            }

            // 4. 10 Ayudantes (STAFF)
            for (int i = 1; i <= 10; i++) {
                User staff = User.builder()
                        .firstName("Ayudante")
                        .lastName("Staff " + i)
                        .dni("ayu" + i)
                        .password(passwordEncoder.encode("ayu" + i))
                        .role(Role.STAFF)
                        .build();
                userRepository.save(staff);
            }

            // 5. 3 Preceptoras (PRECEPTOR - Cargo de 2 cursos c/u aprox)
            // Preceptor 1: Cursos A, B
            // Preceptor 2: Cursos C, D
            // Preceptor 3: Curso E
            for (int i = 1; i <= 3; i++) {
                User preceptor = User.builder()
                        .firstName("Preceptora")
                        .lastName(i == 1 ? "A-B" : i == 2 ? "C-D" : "E")
                        .dni("prec" + i)
                        .password(passwordEncoder.encode("prec" + i))
                        .role(Role.PRECEPTOR)
                        .build();
                userRepository.save(preceptor);
            }

            System.out.println("Test data successfully created. Total Users: " + userRepository.count());
        }
    }
}
