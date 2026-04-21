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
    private Integer age;
    private String nationality;
    private String birthPlace;
    private LocalDate birthDate;
    private String address;
    private String locality;
    private String phone;
    private String fileNumber;

    private List<Long> courseIds;
    private List<String> courseNames;
    private List<Integer> orderNumbers; // Corresponding to courseIds

    // Teacher fields
    private String specialty;
    private List<String> subjects;

    // Preceptor fields
    private List<String> assignedCourses;
}
