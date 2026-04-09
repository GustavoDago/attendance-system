package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.findByDni(userDTO.getDni()).isPresent()) {
            throw new RuntimeException("DNI already exists");
        }
        
        // For simplicity in this first evolution step, we create a generic User
        // Real logic should use specific builders based on role
        User user = User.builder()
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .dni(userDTO.getDni())
                .password(passwordEncoder.encode(userDTO.getDni())) // Default password is DNI
                .role(userDTO.getRole())
                .build();
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(this::mapToDTO);
    }

    private UserDTO mapToDTO(User user) {
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .role(user.getRole());

        if (user instanceof Student student) {
            builder.guardianName(student.getGuardianName())
                    .guardianPhone(student.getGuardianPhone())
                    .birthDate(student.getBirthDate())
                    .address(student.getAddress());
            if (student.getCourse() != null) {
                builder.courseId(student.getCourse().getId())
                        .courseName(student.getCourse().getName() + " " + student.getCourse().getDivision());
            }
        } else if (user instanceof Teacher teacher) {
            builder.specialty(teacher.getSpecialty());
            if (teacher.getSubjects() != null) {
                builder.subjects(teacher.getSubjects().stream()
                        .map(Subject::getName)
                        .collect(Collectors.toList()));
            }
        } else if (user instanceof Preceptor preceptor) {
            if (preceptor.getAssignedCourses() != null) {
                builder.assignedCourses(preceptor.getAssignedCourses().stream()
                        .map(c -> c.getName() + " " + c.getDivision())
                        .collect(Collectors.toList()));
            }
        }

        return builder.build();
    }
}
