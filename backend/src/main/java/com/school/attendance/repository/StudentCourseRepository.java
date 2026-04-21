package com.school.attendance.repository;

import com.school.attendance.model.StudentCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentCourseRepository extends JpaRepository<StudentCourse, Long> {
    @Query("SELECT MAX(sc.orderNumber) FROM StudentCourse sc WHERE sc.course.id = :courseId")
    Optional<Integer> findMaxOrderNumberByCourseId(@Param("courseId") Long courseId);
}
