package com.school.attendance.controller;

import com.school.attendance.dto.CourseDTO;
import com.school.attendance.dto.CourseScheduleDTO;
import com.school.attendance.dto.SubjectDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.Course;
import com.school.attendance.model.CourseSchedule;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.CourseScheduleRepository;
import com.school.attendance.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommonDataController {

    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final CourseScheduleRepository courseScheduleRepository;
    private final UserMapper userMapper;

    @GetMapping("/courses")
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(userMapper::toCourseDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/courses/{courseId}/activities")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CourseScheduleDTO> getCourseActivities(
            @PathVariable Long courseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String groupNumber) {
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        DayOfWeek day = date.getDayOfWeek();
        List<CourseSchedule> schedules = courseScheduleRepository.findByCourseAndDayOfWeek(course, day);
        
        return schedules.stream()
                .map(cs -> CourseScheduleDTO.builder()
                        .id(cs.getId())
                        .courseId(courseId)
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
