package com.school.attendance.dto;

import com.school.attendance.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String dni;
    private Role role;

    // Student fields
    private String guardianName;
    private String guardianPhone;
    private LocalDate birthDate;
    private String address;
    private Long courseId;
    private String courseName;

    // Teacher fields
    private String specialty;
    private List<String> subjects;

    // Preceptor fields
    private List<String> assignedCourses;
}
