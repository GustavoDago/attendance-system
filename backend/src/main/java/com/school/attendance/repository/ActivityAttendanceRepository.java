package com.school.attendance.repository;

import com.school.attendance.model.ActivityAttendance;
import com.school.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActivityAttendanceRepository extends JpaRepository<ActivityAttendance, Long> {
    List<ActivityAttendance> findByStudentAndDateBetween(Student student, LocalDate startDate, LocalDate endDate);
    List<ActivityAttendance> findByDateBetween(LocalDate startDate, LocalDate endDate);
}
