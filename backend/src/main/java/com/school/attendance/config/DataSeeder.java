package com.school.attendance.config;

import com.school.attendance.model.*;
import com.school.attendance.repository.*;
import com.school.attendance.service.ExcelImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
    private final ExcelImportService excelImportService;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("Starting data generation...");

            // 1. Create Subjects
            List<Subject> subjects = new ArrayList<>();
            String[] subjectNames = {"Matemática", "Lengua", "Historia", "Geografía", "Física", "Química", "Biología", "Educación Física"};
            for (String name : subjectNames) {
                subjects.add(subjectRepository.save(Subject.builder().name(name).build()));
            }

            // 2. Create Courses (if not already created by CSV import)
            // The CSV import will create courses automatically, but we ensure
            // all expected courses exist for teachers and preceptors
            List<Course> courses = new ArrayList<>();
            int[] years = {1, 2, 3, 4, 5};
            String[] divisions = {"A", "B"};
            for (int year : years) {
                for (String div : divisions) {
                    Course course = courseRepository.findByYearAndDivisionAndShift(year, div, Shift.MORNING)
                            .orElseGet(() -> courseRepository.save(
                                    Course.builder()
                                            .year(year)
                                            .division(div)
                                            .shift(Shift.MORNING)
                                            .build()));
                    courses.add(course);
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
                        .lastName(courses.get(i).getYearLabel() + " " + courses.get(i).getDivision())
                        .dni("prof" + (i + 1))
                        .password(passwordEncoder.encode("prof" + (i + 1)))
                        .role(Role.TEACHER)
                        .specialty("Docente General")
                        .subjects(teacherSubjects)
                        .build();
                userRepository.save(teacher);
            }

            // 5. Import students from Excel
            excelImportService.importStudentsFromExcel();

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

            System.out.println("Data setup complete. Users: " + userRepository.count());
        }
    }
}
