package com.school.attendance.service;

import com.school.attendance.dto.StudentDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.Course;
import com.school.attendance.model.Student;
import com.school.attendance.model.StudentCourse;
import com.school.attendance.model.StudentCourseId;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.StudentCourseRepository;
import com.school.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final UserMapper userMapper;

    public List<StudentDTO> getAllStudents(boolean onlyActive) {
        List<Student> students = onlyActive ? studentRepository.findAllByActiveTrue() : studentRepository.findAll();
        return students.stream()
                .map(userMapper::toStudentDTO)
                .collect(Collectors.toList());
    }

    public List<StudentDTO> getStudentsByCourse(Long courseId, String groupNumber, boolean onlyActive) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Student> students;
        if (onlyActive) {
            students = studentRepository.findByCourseAndActiveTrue(course);
        } else {
            students = studentRepository.findByCourse(course);
        }

        if (groupNumber != null) {
            students = students.stream()
                    .filter(s -> s.getStudentCourses().stream()
                            .anyMatch(sc -> sc.getCourse().getId().equals(courseId) && groupNumber.equals(sc.getGroupNumber())))
                    .collect(Collectors.toList());
        }

        return students.stream()
                .map(userMapper::toStudentDTO)
                .collect(Collectors.toList());
    }

    public Optional<StudentDTO> getStudentById(Long id) {
        return studentRepository.findById(id).map(userMapper::toStudentDTO);
    }

    public Optional<StudentDTO> getStudentByQrToken(String token) {
        return studentRepository.findByQrToken(token).map(userMapper::toStudentDTO);
    }

    @Transactional
    public StudentDTO createStudent(StudentDTO dto) {
        Student student = userMapper.toStudentEntity(dto);
        student.setActive(true);
        student = studentRepository.save(student);

        if (dto.getCourseId() != null) {
            assignToCourse(student, dto.getCourseId(), dto.getOrderNumber(), dto.getGroupNumber());
        }

        return userMapper.toStudentDTO(student);
    }

    @Transactional
    public StudentDTO updateStudent(Long id, StudentDTO dto) {
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
            assignToCourse(student, dto.getCourseId(), dto.getOrderNumber(), dto.getGroupNumber());
        }

        student = studentRepository.save(student);
        return userMapper.toStudentDTO(student);
    }

    @Transactional
    public void deactivateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setActive(false);
        studentRepository.save(student);
    }

    @Transactional
    public void activateStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setActive(true);
        studentRepository.save(student);
    }

    private void assignToCourse(Student student, Long courseId, Integer orderNumber, String groupNumber) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if already assigned to this course
        Optional<StudentCourse> existing = studentCourseRepository.findById(new StudentCourseId(student.getId(), courseId));
        
        if (existing.isPresent()) {
            StudentCourse sc = existing.get();
            sc.setOrderNumber(orderNumber);
            sc.setGroupNumber(groupNumber);
            studentCourseRepository.save(sc);
        } else {
            // Remove from other courses if necessary (usually a student is in one course at a time)
            // studentCourseRepository.deleteAll(student.getStudentCourses());
            
            StudentCourse sc = StudentCourse.builder()
                    .id(new StudentCourseId(student.getId(), courseId))
                    .student(student)
                    .course(course)
                    .orderNumber(orderNumber)
                    .groupNumber(groupNumber != null ? groupNumber : "1")
                    .build();
            studentCourseRepository.save(sc);
        }
    }
}
