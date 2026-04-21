package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.repository.UserRepository;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.StudentCourseRepository;
import com.school.attendance.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.HashSet;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final StudentCourseRepository studentCourseRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.findByDni(userDTO.getDni()).isPresent()) {
            throw new RuntimeException("DNI already exists");
        }
        
        if (userDTO.getRole() == Role.STUDENT) {
            Student student = Student.builder()
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .dni(userDTO.getDni())
                .password(passwordEncoder.encode(userDTO.getDni()))
                .role(Role.STUDENT)
                .nationality(userDTO.getNationality())
                .birthPlace(userDTO.getBirthPlace())
                .birthDate(userDTO.getBirthDate())
                .address(userDTO.getAddress())
                .locality(userDTO.getLocality())
                .phone(userDTO.getPhone())
                .fileNumber(userDTO.getFileNumber())
                .build();

            final Student savedStudent = userRepository.save(student);

            if (userDTO.getCourseIds() != null && !userDTO.getCourseIds().isEmpty()) {
                List<Course> courses = courseRepository.findAllById(userDTO.getCourseIds());
                for (Course course : courses) {
                    Integer nextOrderNumber = studentCourseRepository.findMaxOrderNumberByCourseId(course.getId())
                            .map(max -> max + 1)
                            .orElse(1);

                    StudentCourse sc = StudentCourse.builder()
                            .student(savedStudent)
                            .course(course)
                            .orderNumber(nextOrderNumber)
                            .build();
                    studentCourseRepository.save(sc);
                    savedStudent.getStudentCourses().add(sc);
                }
            }
            return userMapper.toDTO(savedStudent);
        } else {
            User user = User.builder()
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .dni(userDTO.getDni())
                .password(passwordEncoder.encode(userDTO.getDni()))
                .role(userDTO.getRole())
                .build();
            user = userRepository.save(user);
            return userMapper.toDTO(user);
        }
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(userMapper::toDTO);
    }
}
