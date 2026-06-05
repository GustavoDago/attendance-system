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
import java.util.Set;
import java.util.HashMap;
import java.util.HashSet;
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
        
        StudentCourse studentCourse = student.getStudentCourses().stream()
                .findFirst()
                .orElse(null);
        if (studentCourse == null) {
            return 0.0;
        }

        // Fetch schedules for the course once to avoid N+1 queries
        List<CourseSchedule> courseSchedules = scheduleRepository.findByCourse(studentCourse.getCourse());

        double total = 0;
        for (ActivityAttendance record : records) {
            Set<ActivityType> active = courseSchedules.stream()
                    .filter(cs -> cs.getDayOfWeek() == record.getDate().getDayOfWeek() &&
                            (cs.getGroupNumber() == null || cs.getGroupNumber().equals(studentCourse.getGroupNumber())))
                    .map(CourseSchedule::getActivityType)
                    .collect(Collectors.toSet());

            total += calculateRecordWeight(record, active);
        }
        return total;
    }

    /**
     * Calcula el peso de un registro individual basado en las actividades activas del día.
     */
    public double calculateRecordWeight(ActivityAttendance record) {
        StudentCourse studentCourse = record.getStudent().getStudentCourses().stream()
                .findFirst()
                .orElse(null);
        if (studentCourse == null) {
            return 0.0;
        }
        List<CourseSchedule> schedules = scheduleRepository.findRelevantSchedules(
                studentCourse.getCourse(),
                record.getDate().getDayOfWeek(),
                studentCourse.getGroupNumber()
        );
        Set<ActivityType> active = schedules.stream()
                .map(CourseSchedule::getActivityType)
                .collect(Collectors.toSet());
        return calculateRecordWeight(record, active);
    }

    public double calculateRecordWeight(ActivityAttendance record, List<ActivityAttendance> dailyRecords) {
        AttendanceStatus status = record.getStatus();

        // Presente y No Aplica no generan falta
        if (status.isPresent()) {
            return 0.0;
        }

        // Determinar las actividades activas en el día
        Set<ActivityType> active = dailyRecords.stream()
                .filter(r -> r.getStatus() != AttendanceStatus.NO_APLICA)
                .map(ActivityAttendance::getActivityType)
                .collect(Collectors.toSet());

        // Si por alguna razón la actividad actual no está activa, no genera falta
        if (!active.contains(record.getActivityType())) {
            return 0.0;
        }

        double baseWeight = getBaseWeight(record.getActivityType(), active);
        return status.getDefaultWeight() * baseWeight;
    }

    public double calculateRecordWeight(ActivityAttendance record, Set<ActivityType> active) {
        AttendanceStatus status = record.getStatus();

        // Presente y No Aplica no generan falta
        if (status.isPresent()) {
            return 0.0;
        }

        // Si por alguna razón la actividad actual no está activa, no genera falta
        if (active == null || !active.contains(record.getActivityType())) {
            return 0.0;
        }

        double baseWeight = getBaseWeight(record.getActivityType(), active);
        return status.getDefaultWeight() * baseWeight;
    }

    private double getBaseWeight(ActivityType type, Set<ActivityType> active) {
        boolean hasTaller = active.contains(ActivityType.TALLER);
        boolean hasEdFisica = active.contains(ActivityType.EDUCACION_FISICA);

        double aulaWeight = 1.0;
        if (hasTaller || hasEdFisica) {
            aulaWeight = 0.5;
        }

        if (type == ActivityType.AULA || type == ActivityType.INSTITUCIONAL) {
            return aulaWeight;
        } else if (type == ActivityType.TALLER) {
            return hasEdFisica ? 0.25 : 0.5;
        } else if (type == ActivityType.EDUCACION_FISICA) {
            return hasTaller ? 0.25 : 0.5;
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

        // Initialize maps to calculate daily totals based on actual weights
        Map<Integer, Double> dailyPresentWeights = new java.util.HashMap<>();
        Map<Integer, Double> dailyAbsentWeights = new java.util.HashMap<>();
        Map<Integer, Set<Long>> dailyRegisteredStudents = new java.util.HashMap<>();
        for (int day = 1; day <= daysInMonth; day++) {
            dailyPresentWeights.put(day, 0.0);
            dailyAbsentWeights.put(day, 0.0);
            dailyRegisteredStudents.put(day, new java.util.HashSet<>());
        }

        // Fetch schedules for the course once to avoid N+1 queries
        List<CourseSchedule> courseSchedules = scheduleRepository.findByCourse(course);

        List<com.school.attendance.dto.report.StudentMonthlyReportDTO> studentReports = students.stream().map(student -> {
            Map<Integer, com.school.attendance.dto.report.DailySummaryDTO> dailyRecords = new java.util.HashMap<>();
            
            // Get student's course assignment to know their group number
            StudentCourse sc = student.getStudentCourses().stream()
                    .filter(c -> c.getCourse().getId().equals(courseId))
                    .findFirst().orElse(null);

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
                
                // Determine active activities from schedule for the student on this day of the week
                final StudentCourse currentSc = sc;
                final Set<ActivityType> active = (currentSc == null) ? java.util.Collections.emptySet() :
                        courseSchedules.stream()
                            .filter(cs -> cs.getDayOfWeek() == currentDate.getDayOfWeek() &&
                                    (cs.getGroupNumber() == null || cs.getGroupNumber().equals(currentSc.getGroupNumber())))
                            .map(CourseSchedule::getActivityType)
                            .collect(Collectors.toSet());

                List<ActivityAttendance> dailyAttendances = attendanceRepository.findByStudentAndDateBetween(student, currentDate, currentDate);
                if (dailyAttendances.isEmpty() || active.isEmpty()) {
                    dailyRecords.put(day, new com.school.attendance.dto.report.DailySummaryDTO("-", 0.0));
                    continue;
                }

                double dailyAbsence = 0.0;
                double dailyPresence = 0.0;
                boolean hasRegisteredActivity = false;
                for (ActivityAttendance record : dailyAttendances) {
                    if (active.contains(record.getActivityType())) {
                        double baseWeight = getBaseWeight(record.getActivityType(), active);
                        dailyAbsence += record.getStatus().getDefaultWeight() * baseWeight;
                        dailyPresence += (1.0 - record.getStatus().getDefaultWeight()) * baseWeight;
                        hasRegisteredActivity = true;
                    }
                }

                if (hasRegisteredActivity) {
                    dailyPresentWeights.put(day, dailyPresentWeights.get(day) + dailyPresence);
                    dailyAbsentWeights.put(day, dailyAbsentWeights.get(day) + dailyAbsence);
                    dailyRegisteredStudents.get(day).add(student.getId());
                }

                // Build the label using the status label from the first significant record
                String label;
                if (dailyAbsence == 0.0) {
                    label = "P";
                } else {
                    // Find the most significant status for display
                    AttendanceStatus mainStatus = dailyAttendances.stream()
                            .filter(r -> active.contains(r.getActivityType()))
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
                        .presentCount(0.0).absentCount(0.0).totalStudents(0).build());
                continue;
            }
            
            boolean isHoliday = holidays.stream().anyMatch(h -> h.getDate().equals(currentDate));
            if (isHoliday) {
                dailyTotals.put(day, DailyCourseSummaryDTO.builder()
                        .presentCount(0.0).absentCount(0.0).totalStudents(0).build());
                continue;
            }

            double presentWeight = dailyPresentWeights.getOrDefault(day, 0.0);
            double absentWeight = dailyAbsentWeights.getOrDefault(day, 0.0);
            int studentCount = dailyRegisteredStudents.getOrDefault(day, java.util.Collections.emptySet()).size();
            
            dailyTotals.put(day, DailyCourseSummaryDTO.builder()
                    .presentCount(presentWeight)
                    .absentCount(absentWeight)
                    .totalStudents(studentCount)
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
