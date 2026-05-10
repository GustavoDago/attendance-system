package com.school.attendance.config;

import com.school.attendance.model.*;
import com.school.attendance.repository.*;
import com.school.attendance.service.ExcelImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.core.io.FileSystemResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final CourseScheduleRepository courseScheduleRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExcelImportService excelImportService;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        // 0. Migrar valores antiguos de AttendanceStatus en la base de datos
        migrateOldAttendanceStatuses();

        // Solo sembrar si la base de datos está completamente vacía
        if (userRepository.count() > 0) {
            log.info("La base de datos ya tiene datos. Saltando siembra inicial.");
            return;
        }

        log.info("Starting data generation...");

        // 1. Create Subjects
        List<Subject> subjects = new ArrayList<>();
        String[] subjectNames = {"Matemática", "Lengua", "Historia", "Geografía", "Física", "Química", "Biología", "Educación Física", "Taller"};
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
                .username("admin")
                .password(passwordEncoder.encode("admin"))
                .role(Role.PRINCIPAL)
                .build();
        userRepository.save(admin);

        // 5. Import students from Excel (solo si no hay estudiantes ya cargados)
        if (studentRepository.count() == 0) {
            excelImportService.importStudentsFromExcel();
        } else {
            log.info("Ya existen estudiantes en la base de datos. Saltando importación de Excel.");
        }

        // 7. Seed Course Schedules (Res. 1650/2024 logic with Groups)
        for (Course course : courses) {
            for (java.time.DayOfWeek day : java.time.DayOfWeek.values()) {
                if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) continue;
                
                // Todos tienen AULA (sin importar el grupo, aplica a todos)
                courseScheduleRepository.save(CourseSchedule.builder()
                        .course(course)
                        .groupNumber(null)
                        .dayOfWeek(day)
                        .activityType(ActivityType.AULA)
                        .build());

                // Educación Física según el año (para todo el curso)
                boolean hasEF = false;
                if (course.getYear() == 1 && (day == java.time.DayOfWeek.MONDAY || day == java.time.DayOfWeek.FRIDAY)) hasEF = true;
                if (course.getYear() == 2 && (day == java.time.DayOfWeek.TUESDAY || day == java.time.DayOfWeek.THURSDAY)) hasEF = true;
                if (course.getYear() == 3 && day == java.time.DayOfWeek.WEDNESDAY) hasEF = true;
                if (course.getYear() >= 4 && day == java.time.DayOfWeek.WEDNESDAY) hasEF = true;

                if (hasEF) {
                    courseScheduleRepository.save(CourseSchedule.builder()
                            .course(course)
                            .groupNumber(null)
                            .dayOfWeek(day)
                            .activityType(ActivityType.EDUCACION_FISICA)
                            .build());
                }

                // Taller dividido por grupos (solo para 4to, 5to y 6to)
                if (course.getYear() >= 4) {
                    if (day == java.time.DayOfWeek.TUESDAY) {
                        courseScheduleRepository.save(CourseSchedule.builder()
                                .course(course)
                                .groupNumber("1")
                                .dayOfWeek(day)
                                .activityType(ActivityType.TALLER)
                                .build());
                    }
                    if (day == java.time.DayOfWeek.WEDNESDAY) {
                        courseScheduleRepository.save(CourseSchedule.builder()
                                .course(course)
                                .groupNumber("2")
                                .dayOfWeek(day)
                                .activityType(ActivityType.TALLER)
                                .build());
                    }
                }
            }
        }

        // 8. Load Holidays
        try {
            FileSystemResource holidayResource = new FileSystemResource("scripts/holidays_2026.sql");
            if (holidayResource.exists()) {
                ScriptUtils.executeSqlScript(dataSource.getConnection(), holidayResource);
                log.info("Feriados cargados exitosamente desde holidays_2026.sql");
            } else {
                log.warn("Archivo scripts/holidays_2026.sql no encontrado. No se cargaron feriados adicionales.");
            }
        } catch (Exception e) {
            log.error("Error al ejecutar el script de feriados", e);
        }

        log.info("Data setup complete. Users: {}", userRepository.count());
    }

    /**
     * Migra los valores antiguos de AttendanceStatus que ya no existen en el enum.
     * - RETIRO_ANTICIPADO → RETIRO_1_2
     * - JUSTIFICADA → AUSENTE_J
     * Usa JdbcTemplate para hacer UPDATE directo en la tabla sin pasar por JPA/Hibernate.
     */
    private void migrateOldAttendanceStatuses() {
        try {
            // Forzamos la columna a VARCHAR para eliminar restricciones de ENUM antiguas en H2.
            // Esto permite guardar los nuevos valores aunque el esquema no se haya actualizado totalmente.
            jdbcTemplate.execute("ALTER TABLE activity_attendance ALTER COLUMN status VARCHAR(255)");

            // Intentamos migrar valores antiguos usando CAST para mayor seguridad
            jdbcTemplate.execute("UPDATE activity_attendance SET status = 'RETIRO_1_2' WHERE CAST(status AS VARCHAR) = 'RETIRO_ANTICIPADO'");
            jdbcTemplate.execute("UPDATE activity_attendance SET status = 'AUSENTE_J' WHERE CAST(status AS VARCHAR) = 'JUSTIFICADA'");
        } catch (Exception e) {
            // Es normal que falle si la tabla no existe o si los valores ya no están presentes
            log.debug("Migración de estados antiguos saltada o no necesaria.");
        }
    }
}

