package com.school.attendance.controller;

import com.school.attendance.model.ActivityAttendance;
import com.school.attendance.model.AttendanceStatus;
import com.school.attendance.model.Student;
import com.school.attendance.repository.ActivityAttendanceRepository;
import com.school.attendance.repository.StudentRepository;
import com.school.attendance.repository.SubjectRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activity-attendance")
@RequiredArgsConstructor
public class ActivityAttendanceController {

    private final ActivityAttendanceRepository repository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;

    @PostMapping("/batch")
    public ResponseEntity<?> saveBatch(@RequestBody BatchAttendanceRequest request) {
        LocalDate date = request.getDate();
        Long subjectId = request.getSubjectId();
        
        List<ActivityAttendance> records = request.getRecords().stream().map(r -> {
            Student student = studentRepository.findById(r.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            
            return ActivityAttendance.builder()
                    .student(student)
                    .subject(subjectId != null ? subjectRepository.findById(subjectId).orElse(null) : null)
                    .date(date)
                    .activityType(request.getActivityType())
                    .status(r.getStatus())
                    .build();
        }).toList();

        repository.saveAll(records);
        return ResponseEntity.ok("Registros guardados correctamente");
    }

    @Data
    public static class BatchAttendanceRequest {
        private LocalDate date;
        private com.school.attendance.model.ActivityType activityType;
        private Long subjectId;
        private List<StudentStatusRecord> records;
    }

    @Data
    public static class StudentStatusRecord {
        private Long studentId;
        private AttendanceStatus status;
    }
}
