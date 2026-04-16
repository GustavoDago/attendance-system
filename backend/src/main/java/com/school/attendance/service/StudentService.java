package com.school.attendance.service;

import com.school.attendance.dto.StudentDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.*;
import com.school.attendance.repository.StudentCourseRepository;
import com.school.attendance.repository.StudentRepository;
import com.school.attendance.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final CourseRepository courseRepository;
    private final UserMapper userMapper;

    public List<StudentDTO> findAll() {
        return studentRepository.findAll().stream()
                .map(userMapper::toStudentDTO)
                .toList();
    }

    public StudentDTO findById(Long id) {
        return studentRepository.findById(id)
                .map(userMapper::toStudentDTO)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    @Transactional
    public void deleteById(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new RuntimeException("Student not found");
        }
        studentRepository.deleteById(id);
    }

    @Transactional
    public StudentDTO save(StudentDTO dto) {
        Student student = userMapper.toStudentEntity(dto);
        student = studentRepository.save(student);

        if (dto.getCourseId() != null) {
            assignCourse(student, dto.getCourseId(), dto.getOrderNumber());
        }

        return userMapper.toStudentDTO(student);
    }

    @Transactional
    public StudentDTO update(Long id, StudentDTO dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setDni(dto.getDni());
        student.setBirthDate(dto.getBirthDate());
        student.setAddress(dto.getAddress());
        student.setCity(dto.getCity());
        student.setNationality(dto.getNationality());
        student.setBirthPlace(dto.getBirthPlace());
        student.setStudentFileId(dto.getStudentFileId());
        student.setGuardianName(dto.getGuardianName());
        student.setGuardianPhone(dto.getGuardianPhone());

        if (dto.getCourseId() != null) {
            // Simplify for this stage: if course changed or not present, re-assign
            boolean alreadyInCourse = student.getStudentCourses().stream()
                    .anyMatch(sc -> sc.getCourse().getId().equals(dto.getCourseId()));

            if (!alreadyInCourse) {
                // Remove other courses if we want a 1-to-1 main course for now
                student.getStudentCourses().clear();
                assignCourse(student, dto.getCourseId(), dto.getOrderNumber());
            } else if (dto.getOrderNumber() != null) {
                // Update order number in existing course
                student.getStudentCourses().stream()
                        .filter(sc -> sc.getCourse().getId().equals(dto.getCourseId()))
                        .findFirst()
                        .ifPresent(sc -> sc.setOrderNumber(dto.getOrderNumber()));
            }
        }

        student = studentRepository.save(student);
        return userMapper.toStudentDTO(student);
    }

    private void assignCourse(Student student, Long courseId, Integer requestedOrder) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        int orderNumber = requestedOrder != null ? requestedOrder :
                studentCourseRepository.findMaxOrderNumberByCourseId(courseId)
                        .map(max -> max + 1)
                        .orElse(1);

        StudentCourse studentCourse = StudentCourse.builder()
                .id(new StudentCourseId(student.getId(), course.getId()))
                .student(student)
                .course(course)
                .orderNumber(orderNumber)
                .build();

        studentCourseRepository.save(studentCourse);
        student.getStudentCourses().add(studentCourse);
    }
}
