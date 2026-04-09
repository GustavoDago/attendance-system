package com.school.attendance.config;

import com.school.attendance.model.*;
import com.school.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Starting mass data generation for testing...");

            // 1. Create Subjects
            List<Subject> subjects = new ArrayList<>();
            String[] subjectNames = {"Matemática", "Lengua", "Historia", "Geografía", "Física", "Química", "Biología", "Educación Física"};
            for (String name : subjectNames) {
                subjects.add(subjectRepository.save(Subject.builder().name(name).build()));
            }

            // 2. Create Courses
            List<Course> courses = new ArrayList<>();
            String[] levels = {"1ro", "2do", "3ro", "4to", "5to"};
            String[] divisions = {"A", "B"};
            for (String level : levels) {
                for (String div : divisions) {
                    courses.add(courseRepository.save(Course.builder().name(level).division(div).build()));
                }
            }

            // 3. Principal
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .dni("admin")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.PRINCIPAL)
                    .build();
            userRepository.save(admin);

            // 4. Teachers (one for each division, roughly)
            Random random = new Random();
            for (int i = 0; i < courses.size(); i++) {
                List<Subject> teacherSubjects = new ArrayList<>();
                teacherSubjects.add(subjects.get(random.nextInt(subjects.size())));
                
                Teacher teacher = Teacher.builder()
                        .firstName("Profesor")
                        .lastName(courses.get(i).getName() + " " + courses.get(i).getDivision())
                        .dni("prof" + (i + 1))
                        .password(passwordEncoder.encode("prof" + (i + 1)))
                        .role(Role.TEACHER)
                        .specialty("Docente General")
                        .subjects(teacherSubjects)
                        .build();
                userRepository.save(teacher);
            }

            // 5. Students (10 per course)
            int studentCounter = 1;
            for (Course course : courses) {
                for (int s = 1; s <= 10; s++) {
                    Student student = Student.builder()
                            .firstName("Alumno " + s)
                            .lastName(course.getName() + " " + course.getDivision())
                            .dni("alum" + studentCounter)
                            .password(passwordEncoder.encode("alum" + studentCounter))
                            .role(Role.STUDENT)
                            .course(course)
                            .guardianName("Padre/Madre de Alumno " + s)
                            .guardianPhone("555-" + String.format("%04d", studentCounter))
                            .birthDate(LocalDate.now().minusYears(13 + random.nextInt(5)))
                            .address("Calle Falsa 123, Ciudad")
                            .build();
                    userRepository.save(student);
                    studentCounter++;
                }
            }

            // 6. Preceptors (one per 2 courses)
            for (int i = 1; i <= 5; i++) {
                List<Course> managedCourses = new ArrayList<>();
                managedCourses.add(courses.get((i - 1) * 2));
                managedCourses.add(courses.get((i - 1) * 2 + 1));

                Preceptor preceptor = Preceptor.builder()
                        .firstName("Preceptor")
                        .lastName("Grupo " + i)
                        .dni("prec" + i)
                        .password(passwordEncoder.encode("prec" + i))
                        .role(Role.PRECEPTOR)
                        .assignedCourses(managedCourses)
                        .build();
                userRepository.save(preceptor);
            }

            System.out.println("Test data successfully created. Total Users: " + userRepository.count());
        }
    }
}
