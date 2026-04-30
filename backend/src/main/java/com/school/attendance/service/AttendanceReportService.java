package com.school.attendance.service;

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
     */
    public double calculateRecordWeight(ActivityAttendance record) {
        if (record.getStatus() == AttendanceStatus.PRESENTE || record.getStatus() == AttendanceStatus.JUSTIFICADA) {
            return 0.0;
        }

        if (record.getStatus() == AttendanceStatus.TARDANZA_1_4) {
            return 0.25;
        }

        if (record.getStatus() == AttendanceStatus.TARDANZA_1_2 || record.getStatus() == AttendanceStatus.RETIRO_ANTICIPADO) {
            return 0.50;
        }

        if (record.getStatus() == AttendanceStatus.AUSENTE) {
            // Obtener configuración del día para el curso y grupo del alumno
            StudentCourse studentCourse = record.getStudent().getStudentCourses().get(0);
            Course course = studentCourse.getCourse();
            Integer groupNumber = studentCourse.getGroupNumber();
            DayOfWeek day = record.getDate().getDayOfWeek();
            
            // Buscar horario específico del grupo o general del curso
            List<CourseSchedule> schedules = scheduleRepository.findRelevantSchedules(course, day, groupNumber);
            
            int activityCount = schedules.isEmpty() ? 1 : schedules.get(0).getActivityCount();

            if (activityCount == 1) {
                return 1.0;
            } else {
                return 0.5;
            }
        }

        return 0.0;
    }

    /**
     * Calcula el porcentaje de asistencia por materia.
     * @return Mapa de Subject Name -> Porcentaje (0-100)
     */
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
                                            .filter(r -> r.getStatus() == AttendanceStatus.PRESENTE || r.getStatus() == AttendanceStatus.JUSTIFICADA)
                                            .count();
                                    return totalClasses > 0 ? (double) presents / totalClasses * 100 : 100.0;
                                }
                        )
                ));
    }
}
