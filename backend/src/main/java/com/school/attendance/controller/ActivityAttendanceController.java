package com.school.attendance.controller;

import com.school.attendance.model.*;
import com.school.attendance.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activity-attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActivityAttendanceController {

    private final ActivityAttendanceRepository repository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;

    @GetMapping
    public List<ActivityAttendance> getAttendance(
            @RequestParam LocalDate date,
            @RequestParam Long courseId) {
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        List<Student> students = studentRepository.findByCourse(course);
        return repository.findByDateAndStudentIn(date, students);
    }

    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<?> saveBatch(@RequestBody BatchAttendanceRequest request) {
        LocalDate date = request.getDate();
        Long subjectId = request.getSubjectId();
        Subject subject = subjectId != null ? subjectRepository.findById(subjectId).orElse(null) : null;
        
        for (StudentStatusRecord r : request.getRecords()) {
            Student student = studentRepository.findById(r.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            // Validation: Taller is only for 4th year and above
            if (r.getActivityType() == ActivityType.TALLER) {
                boolean isEligible = student.getStudentCourses().stream()
                        .anyMatch(sc -> sc.getCourse().getYear() >= 4);
                if (!isEligible) continue;
            }
            
            ActivityAttendance attendance = repository.findByStudentAndDateAndActivityType(student, date, r.getActivityType())
                    .orElse(ActivityAttendance.builder()
                            .student(student)
                            .date(date)
                            .activityType(r.getActivityType())
                            .build());
            
            attendance.setStatus(r.getStatus());
            attendance.setSubject(subject);
            attendance.setCalculatedAbsence(calculateAbsenceWeight(r.getActivityType(), r.getStatus()));
            
            repository.save(attendance);
        }

        return ResponseEntity.ok("Registros guardados correctamente");
    }

    private Double calculateAbsenceWeight(ActivityType type, AttendanceStatus status) {
        if (status == AttendanceStatus.PRESENTE) return 0.0;
        
        double weight = 0.0;
        if (status == AttendanceStatus.AUSENTE || status == AttendanceStatus.JUSTIFICADA) {
            weight = switch (type) {
                case AULA -> 1.0;
                case TALLER, EDUCACION_FISICA -> 0.5;
                default -> 0.0;
            };
        } else if (status == AttendanceStatus.TARDANZA_1_4) {
            weight = 0.25;
        } else if (status == AttendanceStatus.TARDANZA_1_2 || status == AttendanceStatus.RETIRO_ANTICIPADO) {
            weight = 0.5;
        }
        return weight;
    }

    @Data
    public static class BatchAttendanceRequest {
        private LocalDate date;
        private Long subjectId;
        private List<StudentStatusRecord> records;
    }

    @Data
    public static class StudentStatusRecord {
        private Long studentId;
        private ActivityType activityType;
        private AttendanceStatus status;
    }
}
