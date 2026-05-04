package com.school.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String dni;
    private LocalDate birthDate;
    private String address;
    private String city;
    private String nationality;
    private String birthPlace;
    private String studentFileId;
    private String guardianName;
    private String guardianPhone;
    private Integer age;
    private Long courseId;
    private String courseName;
    private String courseShift;
    private Integer orderNumber;
    private String groupNumber;
    private String qrToken;
    private boolean active;
}
