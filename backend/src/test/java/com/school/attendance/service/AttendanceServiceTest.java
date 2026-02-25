package com.school.attendance.service;

import com.school.attendance.dto.AttendanceResponse;
import com.school.attendance.model.AttendanceRecord;
import com.school.attendance.model.AttendanceType;
import com.school.attendance.model.Role;
import com.school.attendance.model.User;
import com.school.attendance.repository.AttendanceRecordRepository;
import com.school.attendance.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void recordAttendance_UserExists_RecordsAttendance() {
        User user = new User(1L, "John", "Doe", "123456", "123456", Role.STUDENT);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        AttendanceRecord record = new AttendanceRecord(1L, user, LocalDateTime.now(), AttendanceType.ENTRY);
        when(attendanceRecordRepository.save(any(AttendanceRecord.class))).thenReturn(record);

        AttendanceResponse response = attendanceService.recordAttendance(1L, AttendanceType.ENTRY);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getUser().getFirstName());
        assertEquals(AttendanceType.ENTRY, response.getType());
    }

    @Test
    void getPresentUsers_ReturnsUsersWithEntryAsLatestRecord() {
        User user = new User(1L, "John", "Doe", "123456", "123456", Role.STUDENT);
        AttendanceRecord record = new AttendanceRecord(1L, user, LocalDateTime.now(), AttendanceType.ENTRY);

        when(attendanceRecordRepository.findLatestRecords()).thenReturn(Collections.singletonList(record));

        List<AttendanceResponse> presentUsers = attendanceService.getPresentUsers();

        assertEquals(1, presentUsers.size());
        assertEquals("John", presentUsers.get(0).getUser().getFirstName());
    }
}
