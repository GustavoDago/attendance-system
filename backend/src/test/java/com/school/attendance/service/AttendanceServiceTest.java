package com.school.attendance.service;

import com.school.attendance.dto.AttendanceRequest;
import com.school.attendance.dto.AttendanceResponse;
import com.school.attendance.dto.StudentDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.*;
import com.school.attendance.repository.AttendanceRecordRepository;
import com.school.attendance.repository.StudentRepository;
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

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void recordAttendance_UserExists_RecordsAttendance() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").dni("123456").build();
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        AttendanceRecord record = new AttendanceRecord(1L, student, LocalDateTime.now(), AttendanceType.ENTRY);
        when(attendanceRecordRepository.save(any(AttendanceRecord.class))).thenReturn(record);

        StudentDTO studentDTO = StudentDTO.builder().id(1L).firstName("John").lastName("Doe").dni("123456").build();
        when(userMapper.toStudentDTO(student)).thenReturn(studentDTO);

        AttendanceRequest request = new AttendanceRequest();
        request.setStudentId(1L);
        request.setType(AttendanceType.ENTRY);
        AttendanceResponse response = attendanceService.recordAttendance(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getStudent().getFirstName());
        assertEquals(AttendanceType.ENTRY, response.getType());
    }

    @Test
    void getPresentUsers_ReturnsUsersWithEntryAsLatestRecord() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").dni("123456").build();
        AttendanceRecord record = new AttendanceRecord(1L, student, LocalDateTime.now(), AttendanceType.ENTRY);

        when(attendanceRecordRepository.findLatestRecords()).thenReturn(Collections.singletonList(record));

        StudentDTO studentDTO = StudentDTO.builder().id(1L).firstName("John").lastName("Doe").dni("123456").build();
        when(userMapper.toStudentDTO(student)).thenReturn(studentDTO);

        List<AttendanceResponse> presentUsers = attendanceService.getPresentUsers();

        assertEquals(1, presentUsers.size());
        assertEquals("John", presentUsers.get(0).getStudent().getFirstName());
    }
}
