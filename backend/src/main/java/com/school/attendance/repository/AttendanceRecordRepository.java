package com.school.attendance.repository;

import com.school.attendance.model.AttendanceRecord;
import com.school.attendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByUserOrderByTimestampDesc(User user);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.timestamp = (SELECT MAX(b.timestamp) FROM AttendanceRecord b WHERE b.user = a.user)")
    List<AttendanceRecord> findLatestRecords();
}
