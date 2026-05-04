package com.school.attendance.controller;

import com.school.attendance.dto.StudentDTO;
import com.school.attendance.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String groupNumber,
            @RequestParam(defaultValue = "true") boolean onlyActive) {
        
        if (courseId != null) {
            return ResponseEntity.ok(studentService.getStudentsByCourse(courseId, groupNumber, onlyActive));
        }
        return ResponseEntity.ok(studentService.getAllStudents(onlyActive));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/qr/{token}")
    public ResponseEntity<StudentDTO> getStudentByQrToken(@PathVariable String token) {
        return studentService.getStudentByQrToken(token)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<StudentDTO> createStudent(@RequestBody StudentDTO dto) {
        return ResponseEntity.ok(studentService.createStudent(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentDTO> updateStudent(@PathVariable Long id, @RequestBody StudentDTO dto) {
        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateStudent(@PathVariable Long id) {
        studentService.deactivateStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateStudent(@PathVariable Long id) {
        studentService.activateStudent(id);
        return ResponseEntity.noContent().build();
    }
}
