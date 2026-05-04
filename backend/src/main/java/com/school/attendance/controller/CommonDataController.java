package com.school.attendance.controller;

import com.school.attendance.dto.CourseDTO;
import com.school.attendance.dto.SubjectDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonDataController {

    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final com.school.attendance.repository.CourseScheduleRepository courseScheduleRepository;
    private final UserMapper userMapper;

    @GetMapping("/courses")
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(userMapper::toCourseDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/courses/{courseId}/activities")
    public List<com.school.attendance.dto.CourseScheduleDTO> getCourseActivities(
            @org.springframework.web.bind.annotation.PathVariable Long courseId,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer groupNumber) {
        
        com.school.attendance.model.Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        java.time.DayOfWeek day = date.getDayOfWeek();
        List<com.school.attendance.model.CourseSchedule> schedules = courseScheduleRepository.findByCourseAndDayOfWeek(course, day);
        
        return schedules.stream()
                .map(cs -> com.school.attendance.dto.CourseScheduleDTO.builder()
                        .id(cs.getId())
                        .courseId(cs.getCourse().getId())
                        .groupNumber(cs.getGroupNumber())
                        .dayOfWeek(cs.getDayOfWeek())
                        .activityType(cs.getActivityType())
                        .build())
                .collect(Collectors.toList());
    }

    @GetMapping("/subjects")
    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(userMapper::toSubjectDTO)
                .collect(Collectors.toList());
    }
}
