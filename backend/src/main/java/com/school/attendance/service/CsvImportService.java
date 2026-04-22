package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.StudentCourseRepository;
import com.school.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CsvImportService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final StudentCourseRepository studentCourseRepository;

    /**
     * Imports students from the CSV file located in the classpath (data/alumnos.csv).
     * Creates courses as needed and links each student to their course.
     *
     * @return the list of imported Student entities
     */
    public List<Student> importStudentsFromCsv() {
        List<Student> importedStudents = new ArrayList<>();

        try {
            ClassPathResource resource = new ClassPathResource("data/alumnos.csv");
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8));

            String headerLine = reader.readLine(); // Skip header
            if (headerLine == null) {
                System.out.println("CSV file is empty.");
                return importedStudents;
            }

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                if (line.isEmpty()) continue;

                try {
                    Student student = parseLine(line);
                    if (student != null) {
                        importedStudents.add(student);
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing CSV line " + lineNumber + ": " + e.getMessage());
                }
            }

            reader.close();
            System.out.println("Successfully imported " + importedStudents.size() + " students from CSV.");
        } catch (Exception e) {
            System.err.println("Error reading CSV file: " + e.getMessage());
        }

        return importedStudents;
    }

    private Student parseLine(String line) {
        // CSV uses semicolon separator
        String[] fields = line.split(";", -1);
        if (fields.length < 13) {
            System.err.println("Skipping line with insufficient fields: " + line);
            return null;
        }

        String lastName = fields[0].trim();
        String firstName = fields[1].trim();
        String dni = fields[2].trim();
        String nationality = fields[3].trim();
        String birthPlace = fields[4].trim();
        String birthDateStr = fields[5].trim();
        String address = fields[6].trim();
        String city = fields[7].trim();
        String phone = normalizePhone(fields[8].trim());
        String studentFileId = fields[9].trim();
        String yearStr = fields[10].trim();
        String division = fields[11].trim();
        String shiftStr = fields[12].trim();

        // Skip if already exists by DNI
        if (studentRepository.findByDni(dni).isPresent()) {
            System.out.println("Student with DNI " + dni + " already exists, skipping.");
            return null;
        }

        // Parse birth date
        LocalDate birthDate = null;
        if (!birthDateStr.isEmpty()) {
            try {
                birthDate = LocalDate.parse(birthDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception e) {
                System.err.println("Could not parse birth date: " + birthDateStr);
            }
        }

        // Parse year
        Integer year = null;
        try {
            year = Integer.parseInt(yearStr);
        } catch (NumberFormatException e) {
            System.err.println("Could not parse year: " + yearStr);
        }

        // Parse shift
        Shift shift = parseShift(shiftStr);

        // Find or create course
        Course course = findOrCreateCourse(year, division, shift);

        Student student = Student.builder()
                .firstName(firstName)
                .lastName(lastName)
                .dni(dni)
                .nationality(nationality)
                .birthPlace(birthPlace)
                .birthDate(birthDate)
                .address(address)
                .city(city)
                .guardianPhone(phone)
                .studentFileId(studentFileId)
                .build();

        student = studentRepository.save(student);

        if (course != null) {
            Integer nextOrder = studentCourseRepository.findMaxOrderNumberByCourseId(course.getId())
                    .map(max -> max + 1)
                    .orElse(1);

            StudentCourse sc = StudentCourse.builder()
                    .id(new StudentCourseId(student.getId(), course.getId()))
                    .student(student)
                    .course(course)
                    .orderNumber(nextOrder)
                    .build();
            studentCourseRepository.save(sc);
            student.getStudentCourses().add(sc);
        }

        return student;
    }

    private Course findOrCreateCourse(Integer year, String division, Shift shift) {
        if (year == null) return null;

        return courseRepository.findByYearAndDivisionAndShift(year, division, shift)
                .orElseGet(() -> courseRepository.save(
                        Course.builder()
                                .year(year)
                                .division(division)
                                .shift(shift)
                                .build()));
    }

    private Shift parseShift(String shiftStr) {
        if (shiftStr == null || shiftStr.isEmpty()) return null;

        return switch (shiftStr.toLowerCase()) {
            case "mañana", "manana", "morning" -> Shift.MORNING;
            case "tarde", "afternoon" -> Shift.AFTERNOON;
            case "noche", "vespertino", "evening" -> Shift.EVENING;
            default -> {
                System.err.println("Unknown shift: " + shiftStr + ", defaulting to MORNING");
                yield Shift.MORNING;
            }
        };
    }

    /**
     * Normalizes phone numbers by removing annotations like "(mamá)", "(Mamá)", etc.
     */
    private String normalizePhone(String phone) {
        if (phone == null || phone.isEmpty()) return phone;
        // Remove parenthetical annotations like (mamá), (Mamá), (papá), etc.
        return phone.replaceAll("\\s*\\([^)]*\\)\\s*$", "").trim();
    }
}
