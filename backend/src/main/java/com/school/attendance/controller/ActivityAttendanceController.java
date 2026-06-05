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
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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
        
        // Group records by studentId to validate and calculate weights
        Map<Long, List<StudentStatusRecord>> recordsByStudent = request.getRecords().stream()
                .collect(Collectors.groupingBy(StudentStatusRecord::getStudentId));

        for (Map.Entry<Long, List<StudentStatusRecord>> entry : recordsByStudent.entrySet()) {
            Long studentId = entry.getKey();
            List<StudentStatusRecord> studentRecords = entry.getValue();

            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

            // Determine active activities in this batch request for the student
            Set<ActivityType> active = studentRecords.stream()
                    .filter(r -> r.getStatus() != AttendanceStatus.NO_APLICA)
                    .map(StudentStatusRecord::getActivityType)
                    .collect(Collectors.toSet());

            if (active.contains(ActivityType.AULA) && active.contains(ActivityType.INSTITUCIONAL)) {
                throw new RuntimeException("No pueden coexistir las actividades AULA e INSTITUCIONAL en el mismo día para un alumno (" 
                        + student.getLastName() + ", " + student.getFirstName() + ").");
            }

            for (StudentStatusRecord r : studentRecords) {
                ActivityAttendance attendance = repository.findByStudentAndDateAndActivityType(student, date, r.getActivityType())
                        .orElse(ActivityAttendance.builder()
                                .student(student)
                                .date(date)
                                .activityType(r.getActivityType())
                                .build());

                attendance.setStatus(r.getStatus());
                attendance.setSubject(subject);

                // Calculate weight using the active set
                double calculatedAbsence = 0.0;
                if (!r.getStatus().isPresent() && active.contains(r.getActivityType())) {
                    double baseWeight = getBaseWeight(r.getActivityType(), active);
                    calculatedAbsence = r.getStatus().getDefaultWeight() * baseWeight;
                }
                attendance.setCalculatedAbsence(calculatedAbsence);

                repository.save(attendance);
            }
        }

        return ResponseEntity.ok("Registros guardados correctamente");
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
