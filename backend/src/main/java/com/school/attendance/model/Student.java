package com.school.attendance.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@DiscriminatorValue("STUDENT")
public class Student extends User {

    private String guardianName;
    private String guardianPhone;
    private LocalDate birthDate;
    private String address;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;
}
