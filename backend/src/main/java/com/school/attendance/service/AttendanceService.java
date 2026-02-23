package com.school.attendance.service;

import com.school.attendance.dto.AttendanceResponse;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.model.AttendanceRecord;
import com.school.attendance.model.AttendanceType;
import com.school.attendance.model.User;
import com.school.attendance.repository.AttendanceRecordRepository;
import com.school.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private UserRepository userRepository;

    public AttendanceResponse recordAttendance(Long userId, AttendanceType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AttendanceRecord record = AttendanceRecord.builder()
                .user(user)
                .type(type)
                .timestamp(LocalDateTime.now())
                .build();
        
        record = attendanceRecordRepository.save(record);

        return mapToResponse(record);
    }

    public List<AttendanceResponse> getAllRecords() {
        return attendanceRecordRepository.findAll().stream()
                .sorted(Comparator.comparing(AttendanceRecord::getTimestamp).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getPresentUsers() {
        List<AttendanceRecord> latestRecords = attendanceRecordRepository.findLatestRecords();
        return latestRecords.stream()
                .filter(record -> record.getType() == AttendanceType.ENTRY)
                .map(record -> mapToUserDTO(record.getUser()))
                .collect(Collectors.toList());
    }

    private AttendanceResponse mapToResponse(AttendanceRecord record) {
        return AttendanceResponse.builder()
                .id(record.getId())
                .user(mapToUserDTO(record.getUser()))
                .timestamp(record.getTimestamp())
                .type(record.getType())
                .build();
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .role(user.getRole())
                .build();
    }
}
