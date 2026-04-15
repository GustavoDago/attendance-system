package com.school.attendance.repository;

import com.school.attendance.model.Course;
import com.school.attendance.model.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByYearAndDivisionAndShift(Integer year, String division, Shift shift);
}
