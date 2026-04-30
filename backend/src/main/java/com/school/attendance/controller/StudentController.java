package com.school.attendance.controller;

import com.school.attendance.dto.StudentDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.Student;
import com.school.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentRepository studentRepository;
    private final UserMapper userMapper;

    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Integer groupNumber) {
        
        List<Student> students;
        if (courseId != null) {
            students = studentRepository.findAll().stream()
                    .filter(s -> s.getStudentCourses().stream()
                            .anyMatch(sc -> sc.getCourse().getId().equals(courseId) && 
                                           (groupNumber == null || groupNumber.equals(sc.getGroupNumber()))))
                    .collect(Collectors.toList());
        } else {
            students = studentRepository.findAll();
        }

        List<StudentDTO> dtos = students.stream()
                .map(userMapper::toStudentDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return studentRepository.findById(id)
                .map(userMapper::toStudentDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/qr/{token}")
    public ResponseEntity<StudentDTO> getStudentByQrToken(@PathVariable String token) {
        return studentRepository.findByQrToken(token)
                .map(userMapper::toStudentDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
