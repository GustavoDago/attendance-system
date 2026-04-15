package com.school.attendance.repository;

import com.school.attendance.model.AttendanceRecord;
import com.school.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByStudentOrderByTimestampDesc(Student student);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.timestamp = (SELECT MAX(b.timestamp) FROM AttendanceRecord b WHERE b.student = a.student)")
    List<AttendanceRecord> findLatestRecords();

    // Custom query to find the most recent record for a student since a specific time
    // (e.g., start of day)
    Optional<AttendanceRecord> findTopByStudentAndTimestampAfterOrderByTimestampDesc(Student student,
            LocalDateTime startOfDay);

    List<AttendanceRecord> findByTimestampAfter(LocalDateTime startOfDay);
}
