package com.school.attendance.model;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Table(name = "preceptors")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@DiscriminatorValue("PRECEPTOR")
public class Preceptor extends User {

    @ManyToMany
    @JoinTable(
        name = "preceptor_courses",
        joinColumns = @JoinColumn(name = "preceptor_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private List<Course> assignedCourses;
}
