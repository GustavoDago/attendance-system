package com.school.attendance.controller;

import com.school.attendance.model.Student;
import com.school.attendance.repository.StudentRepository;
import com.school.attendance.service.AttendanceReportService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AttendanceReportService reportService;
    private final StudentRepository studentRepository;

    @GetMapping("/institutional")
    public ResponseEntity<?> getInstitutionalReport(
            @RequestParam Long studentId,
            @RequestParam String start,
            @RequestParam String end) {
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        LocalDate startDate = LocalDate.parse(start);
        LocalDate endDate = LocalDate.parse(end);
        
        double totalAbsences = reportService.calculateTotalAbsences(student, startDate, endDate);
        Map<String, Double> subjectAttendance = reportService.calculateAttendancePerSubject(student, startDate, endDate);
        
        return ResponseEntity.ok(InstitutionalReportResponse.builder()
                .studentId(studentId)
                .studentName(student.getFirstName() + " " + student.getLastName())
                .totalAbsences(totalAbsences)
                .subjectAttendance(subjectAttendance)
                .build());
    }

    @GetMapping("/monthly")
    public ResponseEntity<com.school.attendance.dto.report.MonthlyReportDTO> getMonthlyReport(
            @RequestParam Long courseId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(reportService.generateMonthlyReport(courseId, year, month));
    }

    @Data
    @Builder
    public static class InstitutionalReportResponse {
        private Long studentId;
        private String studentName;
        private double totalAbsences;
        private Map<String, Double> subjectAttendance;
    }
}
