package com.school.attendance.dto;

import com.school.attendance.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String username;
    private Role role;

    // Teacher fields
    private String specialty;
    private List<String> subjects;

    // Preceptor fields
    private List<String> assignedCourses;
}
