package com.school.attendance.repository;

import com.school.attendance.model.Course;
import com.school.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByCourse(Course course);
    Optional<Student> findByDni(String dni);
}
