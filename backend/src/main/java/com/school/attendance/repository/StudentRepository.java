package com.school.attendance.repository;

import com.school.attendance.model.Course;
import com.school.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query("SELECT s FROM Student s JOIN s.studentCourses sc WHERE sc.course = :course")
    List<Student> findByCourse(@Param("course") Course course);

    Optional<Student> findByDni(String dni);
    Optional<Student> findByQrToken(String qrToken);
}
