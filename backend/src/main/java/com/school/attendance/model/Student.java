package com.school.attendance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<StudentCourse> studentCourses = new ArrayList<>();

    @Column(unique = true)
    private String qrToken;

    @PrePersist
    public void generateQrToken() {
        if (this.qrToken == null || this.qrToken.isEmpty()) {
            this.qrToken = UUID.randomUUID().toString();
        }
    }

    @Transient
    public Integer getAge() {
        if (birthDate == null) return null;
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
