package com.school.attendance.service;

import com.school.attendance.dto.report.DailyCourseSummaryDTO;
import com.school.attendance.model.*;
import com.school.attendance.repository.ActivityAttendanceRepository;
import com.school.attendance.repository.CourseScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceReportService {

    private final ActivityAttendanceRepository attendanceRepository;
    private final CourseScheduleRepository scheduleRepository;
    private final com.school.attendance.repository.StudentRepository studentRepository;
    private final com.school.attendance.repository.HolidayRepository holidayRepository;
    private final com.school.attendance.repository.CourseRepository courseRepository;

    /**
     * Calcula la inasistencia institucional total de un alumno en un rango de fechas.
     */
    public double calculateTotalAbsences(Student student, LocalDate start, LocalDate end) {
        List<ActivityAttendance> records = attendanceRepository.findByStudentAndDateBetween(student, start, end);
        
        double total = 0;
        for (ActivityAttendance record : records) {
            total += calculateRecordWeight(record);
        }
        return total;
    }

    /**
     * Calcula el peso de un registro individual basado en la normativa Res. 1650/2024.
     * Los estados justificados (_J) cuentan con el mismo peso que los injustificados.
     */
    public double calculateRecordWeight(ActivityAttendance record) {
        AttendanceStatus status = record.getStatus();

        // Presente y No Aplica no generan falta
        if (status.isPresent()) {
            return 0.0;
        }

        // Tardanza 1/4 (justificada o no)
        if (status == AttendanceStatus.TARDANZA_1_4 || status == AttendanceStatus.TARDANZA_1_4_J) {
            return 0.25;
        }

        // Tardanza 1/2 (justificada o no)
        if (status == AttendanceStatus.TARDANZA_1_2 || status == AttendanceStatus.TARDANZA_1_2_J) {
            return 0.50;
        }

        // Retiro 1/2 (justificado o no)
        if (status == AttendanceStatus.RETIRO_1_2 || status == AttendanceStatus.RETIRO_1_2_J) {
            return 0.50;
        }

        // Retiro 1/4 (justificado o no)
        if (status == AttendanceStatus.RETIRO_1_4 || status == AttendanceStatus.RETIRO_1_4_J) {
            return 0.25;
        }

        // Ausente (justificada o no) — peso depende del turno/actividades del día
        if (status == AttendanceStatus.AUSENTE || status == AttendanceStatus.AUSENTE_J) {
            // Obtener configuración del día para el curso y grupo del alumno
            StudentCourse studentCourse = record.getStudent().getStudentCourses().get(0);
            Course course = studentCourse.getCourse();
            String groupNumber = studentCourse.getGroupNumber();
            DayOfWeek day = record.getDate().getDayOfWeek();
            
            // Buscar horario específico del grupo o general del curso
            List<CourseSchedule> schedules = scheduleRepository.findRelevantSchedules(course, day, groupNumber);
            
            int activityCount = schedules.isEmpty() ? 1 : schedules.size();

            if (activityCount == 1) {
                return 1.0;
            } else {
                return 0.5;
            }
        }

        return 0.0;
    }

    public Map<String, Double> calculateAttendancePerSubject(Student student, LocalDate start, LocalDate end) {
        List<ActivityAttendance> records = attendanceRepository.findByStudentAndDateBetween(student, start, end);
        
        return records.stream()
                .filter(r -> r.getSubject() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getSubject().getName(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    long totalClasses = list.size();
                                    long presents = list.stream()
                                            .filter(r -> r.getStatus().isPresent())
                                            .count();
                                    return totalClasses > 0 ? (double) presents / totalClasses * 100 : 100.0;
                                }
                        )
                ));
    }

    public com.school.attendance.dto.report.MonthlyReportDTO generateMonthlyReport(Long courseId, int year, int month) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        LocalDate startDate = LocalDate.of(year, month, 1);
        int daysInMonth = startDate.lengthOfMonth();
        LocalDate endDate = LocalDate.of(year, month, daysInMonth);
        LocalDate annualStart = LocalDate.of(year, 3, 1);

        List<Student> students = studentRepository.findAll().stream()
                .filter(s -> s.getStudentCourses().stream().anyMatch(sc -> sc.getCourse().getId().equals(courseId)))
                .collect(Collectors.toList());

        List<Holiday> holidays = holidayRepository.findAll();

        // Track daily totals for the whole course
        Map<Integer, DailyCourseSummaryDTO> dailyTotals = new java.util.HashMap<>();

        List<com.school.attendance.dto.report.StudentMonthlyReportDTO> studentReports = students.stream().map(student -> {
            Map<Integer, com.school.attendance.dto.report.DailySummaryDTO> dailyRecords = new java.util.HashMap<>();
            
            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate currentDate = LocalDate.of(year, month, day);
                
                if (currentDate.getDayOfWeek() == DayOfWeek.SATURDAY || currentDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    dailyRecords.put(day, new com.school.attendance.dto.report.DailySummaryDTO("-", 0.0));
                    continue;
                }
                
                boolean isHoliday = holidays.stream().anyMatch(h -> h.getDate().equals(currentDate));
                if (isHoliday) {
                    dailyRecords.put(day, new com.school.attendance.dto.report.DailySummaryDTO("H", 0.0));
                    continue;
                }
                
                List<ActivityAttendance> dailyAttendances = attendanceRepository.findByStudentAndDateBetween(student, currentDate, currentDate);
                if (dailyAttendances.isEmpty()) {
                    dailyRecords.put(day, new com.school.attendance.dto.report.DailySummaryDTO("-", 0.0));
                    continue;
                }

                double dailyAbsence = 0.0;
                for (ActivityAttendance record : dailyAttendances) {
                    dailyAbsence += calculateRecordWeight(record);
                }

                // Build the label using the status label from the first significant record
                String label;
                if (dailyAbsence == 0.0) {
                    label = "P";
                } else {
                    // Find the most significant status for display
                    AttendanceStatus mainStatus = dailyAttendances.stream()
                            .map(ActivityAttendance::getStatus)
                            .filter(s -> !s.isPresent())
                            .findFirst()
                            .orElse(AttendanceStatus.PRESENTE);
                    label = mainStatus.getLabel();
                }

                dailyRecords.put(day, new com.school.attendance.dto.report.DailySummaryDTO(label, dailyAbsence));
            }

            double monthlyTotal = calculateTotalAbsences(student, startDate, endDate);
            double annualTotal = calculateTotalAbsences(student, annualStart, endDate);

            StudentCourse sc = student.getStudentCourses().stream()
                    .filter(c -> c.getCourse().getId().equals(courseId))
                    .findFirst().orElse(null);
            
            String orderNum = (sc != null && sc.getOrderNumber() != null) ? String.valueOf(sc.getOrderNumber()) : "";

            return com.school.attendance.dto.report.StudentMonthlyReportDTO.builder()
                    .studentId(student.getId())
                    .lastName(student.getLastName())
                    .firstName(student.getFirstName())
                    .orderNumber(orderNum)
                    .dailyRecords(dailyRecords)
                    .monthlyTotal(monthlyTotal)
                    .annualTotal(annualTotal)
                    .build();
        }).collect(Collectors.toList());

        // Calculate daily totals (present/absent counts per day)
        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate currentDate = LocalDate.of(year, month, day);
            
            if (currentDate.getDayOfWeek() == DayOfWeek.SATURDAY || currentDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
                dailyTotals.put(day, DailyCourseSummaryDTO.builder()
                        .presentCount(0).absentCount(0).totalStudents(0).build());
                continue;
            }
            
            boolean isHoliday = holidays.stream().anyMatch(h -> h.getDate().equals(currentDate));
            if (isHoliday) {
                dailyTotals.put(day, DailyCourseSummaryDTO.builder()
                        .presentCount(0).absentCount(0).totalStudents(0).build());
                continue;
            }

            int presentCount = 0;
            int absentCount = 0;
            
            for (com.school.attendance.dto.report.StudentMonthlyReportDTO studentReport : studentReports) {
                com.school.attendance.dto.report.DailySummaryDTO dailySummary = studentReport.getDailyRecords().get(day);
                if (dailySummary == null || "-".equals(dailySummary.getStatusLabel()) || "H".equals(dailySummary.getStatusLabel())) {
                    continue;
                }
                
                if ("P".equals(dailySummary.getStatusLabel())) {
                    presentCount++;
                } else {
                    absentCount++;
                }
            }
            
            dailyTotals.put(day, DailyCourseSummaryDTO.builder()
                    .presentCount(presentCount)
                    .absentCount(absentCount)
                    .totalStudents(presentCount + absentCount)
                    .build());
        }

        return com.school.attendance.dto.report.MonthlyReportDTO.builder()
                .courseId(course.getId())
                .courseName(course.getYearLabel() + " " + course.getDivision() + " " + course.getShift())
                .year(year)
                .month(month)
                .daysInMonth(daysInMonth)
                .students(studentReports)
                .dailyTotals(dailyTotals)
                .build();
    }
}
