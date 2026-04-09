package com.school.attendance.service;

import com.school.attendance.dto.AttendanceResponse;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.model.*;
import com.school.attendance.repository.AttendanceRecordRepository;
import com.school.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
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

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();

        Optional<AttendanceRecord> lastRecordOpt = attendanceRecordRepository
                .findTopByUserAndTimestampAfterOrderByTimestampDesc(user, startOfDay);

        if (lastRecordOpt.isPresent()) {
            AttendanceRecord lastRecord = lastRecordOpt.get();
            // Check if attempting same action (Note: ENTRY and LATE are treated as same
            // action for entry logic)
            boolean isSameAction = lastRecord.getType() == type ||
                    (type == AttendanceType.ENTRY && lastRecord.getType() == AttendanceType.LATE);

            if (isSameAction) {
                long minutesPassed = Duration.between(lastRecord.getTimestamp(), now).toMinutes();
                if (minutesPassed < 60) {
                    throw new RuntimeException("Espere al menos 1 hora para registrar la misma acción.");
                }
            }
        }

        AttendanceType finalType = type;
        if (type == AttendanceType.ENTRY && lastRecordOpt.isEmpty()) {
            // First entry of the day, check if it's LATE (e.g. after 07:45 AM)
            LocalTime cutoff = LocalTime.of(7, 45);
            if (now.toLocalTime().isAfter(cutoff)) {
                finalType = AttendanceType.LATE;
            }
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .user(user)
                .type(finalType)
                .timestamp(now)
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

    public String exportToCsv() {
        List<AttendanceRecord> records = attendanceRecordRepository.findAll().stream()
                .sorted(Comparator.comparing(AttendanceRecord::getTimestamp).reversed())
                .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder();
        csv.append('\uFEFF'); // UTF-8 BOM so Excel opens it with right encoding
        csv.append("Fecha,Hora,DNI,Nombre,Apellido,Rol,Tipo\n");

        for (AttendanceRecord r : records) {
            String date = r.getTimestamp().toLocalDate().toString();
            String time = r.getTimestamp().toLocalTime().withNano(0).toString();
            String dni = r.getUser().getDni();
            String firstName = r.getUser().getFirstName().replace(",", " ");
            String lastName = r.getUser().getLastName().replace(",", " ");
            String role = r.getUser().getRole() != null ? r.getUser().getRole().name() : "";
            String actionType = r.getType().toString();

            csv.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                    date, time, dni, firstName, lastName, role, actionType));
        }

        return csv.toString();
    }

    public List<AttendanceResponse> getPresentUsers() {
        List<AttendanceRecord> latestRecords = attendanceRecordRepository.findLatestRecords();
        return latestRecords.stream()
                .filter(record -> record.getType() == AttendanceType.ENTRY || record.getType() == AttendanceType.LATE)
                .map(this::mapToResponse)
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
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .role(user.getRole());

        if (user instanceof Student student) {
            builder.guardianName(student.getGuardianName())
                    .guardianPhone(student.getGuardianPhone())
                    .birthDate(student.getBirthDate())
                    .address(student.getAddress());
            if (student.getCourse() != null) {
                builder.courseId(student.getCourse().getId())
                        .courseName(student.getCourse().getName() + " " + student.getCourse().getDivision());
            }
        } else if (user instanceof Teacher teacher) {
            builder.specialty(teacher.getSpecialty());
            if (teacher.getSubjects() != null) {
                builder.subjects(teacher.getSubjects().stream()
                        .map(Subject::getName)
                        .collect(Collectors.toList()));
            }
        } else if (user instanceof Preceptor preceptor) {
            if (preceptor.getAssignedCourses() != null) {
                builder.assignedCourses(preceptor.getAssignedCourses().stream()
                        .map(c -> c.getName() + " " + c.getDivision())
                        .collect(Collectors.toList()));
            }
        }

        return builder.build();
    }
}
