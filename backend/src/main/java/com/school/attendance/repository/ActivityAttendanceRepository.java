package com.school.attendance.repository;

import com.school.attendance.model.ActivityAttendance;
import com.school.attendance.model.ActivityType;
import com.school.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityAttendanceRepository extends JpaRepository<ActivityAttendance, Long> {
    List<ActivityAttendance> findByStudentAndDateBetween(Student student, LocalDate startDate, LocalDate endDate);
    List<ActivityAttendance> findByDateBetween(LocalDate startDate, LocalDate endDate);
    Optional<ActivityAttendance> findByStudentAndDateAndActivityType(Student student, LocalDate date, ActivityType activityType);
    List<ActivityAttendance> findByDateAndStudentIn(LocalDate date, List<Student> students);
}
