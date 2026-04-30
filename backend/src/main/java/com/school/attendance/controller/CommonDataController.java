package com.school.attendance.controller;

import com.school.attendance.model.Course;
import com.school.attendance.model.Subject;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/common")
@RequiredArgsConstructor
public class CommonDataController {

    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;

    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @GetMapping("/subjects")
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }
}
