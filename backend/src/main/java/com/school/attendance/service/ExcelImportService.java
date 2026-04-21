package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.StudentCourseRepository;
import com.school.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelImportService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final StudentCourseRepository studentCourseRepository;

    @Transactional
    public List<Student> importStudentsFromExcel() {
        List<Student> importedStudents = new ArrayList<>();
        try {
            ClassPathResource resource = new ClassPathResource("data/alumnos.xlsx");
            try (InputStream is = resource.getInputStream();
                 Workbook workbook = new XSSFWorkbook(is)) {

                for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                    Sheet sheet = workbook.getSheetAt(i);
                    log.info("Processing sheet: {}", sheet.getSheetName());
                    importedStudents.addAll(processSheet(sheet));
                }
            }
            log.info("Successfully imported {} students from Excel.", importedStudents.size());
        } catch (Exception e) {
            log.error("Error reading Excel file: {}", e.getMessage(), e);
        }
        return importedStudents;
    }

    private List<Student> processSheet(Sheet sheet) {
        List<Student> students = new ArrayList<>();
        // Assuming first row is header
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            try {
                Student student = parseRow(row);
                if (student != null) {
                    students.add(student);
                }
            } catch (Exception e) {
                log.error("Error parsing row {} in sheet {}: {}", i + 1, sheet.getSheetName(), e.getMessage());
            }
        }
        return students;
    }

    private Student parseRow(Row row) {
        // Columns mapping based on inspection:
        // 0: Año, 1: División, 2: Turno, 3: N° Orden, 4: Grupo, 5: Apellidos, 6: Nombres, 7: DNI,
        // 8: Nacionalidad, 9: Lugar de nacimiento, 10: Fecha de nacimiento, 11: Domicilio,
        // 12: Localidad, 13: Teléfono, 14: Legajo

        String yearStr = getCellValueAsString(row.getCell(0));
        String division = getCellValueAsString(row.getCell(1));
        String shiftStr = getCellValueAsString(row.getCell(2));
        String orderNumStr = getCellValueAsString(row.getCell(3));
        String groupNumStr = getCellValueAsString(row.getCell(4));
        String lastName = getCellValueAsString(row.getCell(5));
        String firstName = getCellValueAsString(row.getCell(6));
        String dni = normalizeDni(getCellValueAsString(row.getCell(7)));
        String nationality = getCellValueAsString(row.getCell(8));
        String birthPlace = getCellValueAsString(row.getCell(9));
        LocalDate birthDate = getCellValueAsDate(row.getCell(10));
        String address = getCellValueAsString(row.getCell(11));
        String city = getCellValueAsString(row.getCell(12));
        String phone = getCellValueAsString(row.getCell(13));
        String studentFileId = getCellValueAsString(row.getCell(14));

        if (dni == null || dni.isEmpty() || firstName.isEmpty() || lastName.isEmpty()) {
            return null;
        }

        // Normalize division: "Única" -> "U"
        if ("Única".equalsIgnoreCase(division) || "Unica".equalsIgnoreCase(division)) {
            division = "U";
        }

        // Parse numeric values
        Integer year = parseInteger(yearStr);
        Integer orderNumber = parseInteger(orderNumStr);
        Integer groupNumber = parseInteger(groupNumStr);

        Shift shift = parseShift(shiftStr);

        // Find or create course
        Course course = findOrCreateCourse(year, division, shift);

        // Check if student exists
        final String finalDni = dni;
        Student student = studentRepository.findByDni(finalDni)
                .orElseGet(() -> studentRepository.save(Student.builder()
                        .dni(finalDni)
                        .firstName(firstName)
                        .lastName(lastName)
                        .nationality(nationality)
                        .birthPlace(birthPlace)
                        .birthDate(birthDate)
                        .address(address)
                        .city(city)
                        .guardianPhone(phone)
                        .studentFileId(studentFileId)
                        .build()));

        if (course != null) {
            final Long studentId = student.getId();
            final Long courseId = course.getId();

            if (studentCourseRepository.findById(new StudentCourseId(studentId, courseId)).isEmpty()) {
                StudentCourse sc = StudentCourse.builder()
                        .id(new StudentCourseId(studentId, courseId))
                        .student(student)
                        .course(course)
                        .orderNumber(orderNumber)
                        .groupNumber(groupNumber)
                        .build();
                studentCourseRepository.save(sc);
            }
        }

        return student;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                // Handle whole numbers without .0
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }

    private LocalDate getCellValueAsDate(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                return LocalDate.parse(cell.getStringCellValue().trim());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private Integer parseInteger(String val) {
        if (val == null || val.isEmpty()) return null;
        try {
            // Remove any .0 from numeric strings
            if (val.endsWith(".0")) val = val.substring(0, val.length() - 2);
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Shift parseShift(String shiftStr) {
        if (shiftStr == null || shiftStr.isEmpty()) return null;
        return switch (shiftStr.toLowerCase()) {
            case "mañana", "manana", "morning" -> Shift.MORNING;
            case "tarde", "afternoon" -> Shift.AFTERNOON;
            case "noche", "vespertino", "evening" -> Shift.EVENING;
            default -> Shift.MORNING;
        };
    }

    private String normalizeDni(String dni) {
        if (dni == null) return null;
        return dni.replaceAll("[^0-9]", "");
    }

    private Course findOrCreateCourse(Integer year, String division, Shift shift) {
        if (year == null || division == null || division.isEmpty()) return null;
        String div = division.trim();
        return courseRepository.findByYearAndDivisionAndShift(year, div, shift)
                .orElseGet(() -> courseRepository.save(
                        Course.builder()
                                .year(year)
                                .division(div)
                                .shift(shift)
                                .build()));
    }

    private boolean isRowEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK)
                return false;
        }
        return true;
    }
}
