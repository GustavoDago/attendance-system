package com.school.attendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String dni;

    private LocalDate birthDate;
    private String address;
    private String city;           // Localidad (ej: "Ramallo")
    private String nationality;    // Nacionalidad (ej: "Argentina")
    private String birthPlace;     // Lugar de Nacimiento (ej: "San Nicolás")
    private String studentFileId;  // Legajo (ej: "2/26")
    private String guardianName;
    private String guardianPhone;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
}
