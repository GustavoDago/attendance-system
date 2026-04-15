package com.school.attendance.controller;

import com.school.attendance.dto.*;
import com.school.attendance.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping
    public ResponseEntity<AttendanceResponse> recordAttendance(@RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.recordAttendance(request.getStudentId(), request.getType()));
    }

    @GetMapping("/present")
    public ResponseEntity<List<AttendanceResponse>> getPresentUsers() {
        return ResponseEntity.ok(attendanceService.getPresentUsers());
    }

    @GetMapping("/history")
    public ResponseEntity<List<AttendanceResponse>> getHistory() {
        return ResponseEntity.ok(attendanceService.getAllRecords());
    }

    @GetMapping(value = "/export", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportToCsv() {
        String csv = attendanceService.exportToCsv();
        byte[] csvBytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=asistencia_" + java.time.LocalDate.now() + ".csv")
                .body(csvBytes);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(Principal principal) {
        return ResponseEntity.ok(attendanceService.getDashboardStats(principal.getName()));
    }
}
