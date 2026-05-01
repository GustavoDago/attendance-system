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
    private final UserMapper userMapper;

    @GetMapping("/courses")
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(userMapper::toCourseDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/subjects")
    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(userMapper::toSubjectDTO)
                .collect(Collectors.toList());
    }
}
