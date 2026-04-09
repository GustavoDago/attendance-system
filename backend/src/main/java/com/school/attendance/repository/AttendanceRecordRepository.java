package com.school.attendance.repository;

import com.school.attendance.model.AttendanceRecord;
import com.school.attendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByUserOrderByTimestampDesc(User user);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.timestamp = (SELECT MAX(b.timestamp) FROM AttendanceRecord b WHERE b.user = a.user)")
    List<AttendanceRecord> findLatestRecords();

    // Custom query to find the most recent record for a user since a specific time
    // (e.g., start of day)
    Optional<AttendanceRecord> findTopByUserAndTimestampAfterOrderByTimestampDesc(User user,
            java.time.LocalDateTime startOfDay);

    List<AttendanceRecord> findByTimestampAfter(java.time.LocalDateTime startOfDay);
}
