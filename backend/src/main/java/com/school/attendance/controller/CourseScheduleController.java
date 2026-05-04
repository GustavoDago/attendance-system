package com.school.attendance.controller;

import com.school.attendance.dto.CourseScheduleDTO;
import com.school.attendance.service.CourseScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class CourseScheduleController {

    private final CourseScheduleService courseScheduleService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseScheduleDTO>> getSchedulesByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseScheduleService.getSchedulesByCourse(courseId));
    }

    @PostMapping
    public ResponseEntity<CourseScheduleDTO> addSchedule(@RequestBody CourseScheduleDTO dto) {
        return ResponseEntity.ok(courseScheduleService.addSchedule(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        courseScheduleService.deleteSchedule(id);
        return ResponseEntity.ok().build();
    }
}
