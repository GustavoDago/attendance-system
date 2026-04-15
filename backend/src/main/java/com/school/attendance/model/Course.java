package com.school.attendance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_year")
    private Integer year;      // Año: 1, 2, 3, 4, 5
    private String division;   // División: "A", "B"

    @Enumerated(EnumType.STRING)
    private Shift shift;       // Turno: MORNING, AFTERNOON, EVENING

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentCourse> studentCourses = new ArrayList<>();

    /**
     * Returns the display label for the year (e.g., "1ro", "2do", "3ro").
     */
    public String getYearLabel() {
        if (year == null) return "";
        return switch (year) {
            case 1 -> "1ro";
            case 2 -> "2do";
            case 3 -> "3ro";
            case 4 -> "4to";
            case 5 -> "5to";
            case 6 -> "6to";
            default -> year + "°";
        };
    }
}
