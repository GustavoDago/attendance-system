package com.school.attendance.service;

import com.school.attendance.dto.AttendanceRequest;
import com.school.attendance.dto.AttendanceResponse;
import com.school.attendance.dto.DashboardStatsDTO;
import com.school.attendance.dto.StudentDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.model.*;
import com.school.attendance.repository.AttendanceRecordRepository;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.StudentRepository;
import com.school.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserMapper userMapper;

    public AttendanceResponse recordAttendance(AttendanceRequest request) {
        Student student;
        if (request.getQrToken() != null && !request.getQrToken().isEmpty()) {
            student = studentRepository.findByQrToken(request.getQrToken())
                    .orElseThrow(() -> new RuntimeException("Código QR inválido o estudiante no encontrado"));
        } else if (request.getStudentId() != null) {
            student = studentRepository.findById(request.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
        } else {
            throw new RuntimeException("Debe proporcionar un ID de estudiante o un Token QR");
        }

        AttendanceType type = request.getType();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();

        Optional<AttendanceRecord> lastRecordOpt = attendanceRecordRepository
                .findTopByStudentAndTimestampAfterOrderByTimestampDesc(student, startOfDay);

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
                .student(student)
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
        csv.append("Fecha,Hora,DNI,Nombre,Apellido,Curso,Tipo\n");

        for (AttendanceRecord r : records) {
            String date = r.getTimestamp().toLocalDate().toString();
            String time = r.getTimestamp().toLocalTime().withNano(0).toString();
            String dni = r.getStudent().getDni();
            String firstName = r.getStudent().getFirstName().replace(",", " ");
            String lastName = r.getStudent().getLastName().replace(",", " ");
            String courseName = "";
            if (!r.getStudent().getStudentCourses().isEmpty()) {
                Course c = r.getStudent().getStudentCourses().get(0).getCourse();
                courseName = c.getYearLabel() + " " + c.getDivision();
            }
            String actionType = r.getType().toString();

            csv.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                    date, time, dni, firstName, lastName, courseName, actionType));
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

    public DashboardStatsDTO getDashboardStats(String userDni) {
        User user = userRepository.findByDni(userDni)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));

        List<Course> targetCourses;
        if (user.getRole() == Role.PRINCIPAL) {
            targetCourses = courseRepository.findAll();
        } else if (user instanceof Preceptor preceptor) {
            targetCourses = preceptor.getAssignedCourses();
        } else {
            targetCourses = Collections.emptyList();
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<AttendanceRecord> todayRecords = attendanceRecordRepository.findByTimestampAfter(startOfDay);
        
        // Filter only Entry/Late records
        Set<Long> presentStudentIds = todayRecords.stream()
                .filter(r -> r.getType() == AttendanceType.ENTRY || r.getType() == AttendanceType.LATE)
                .map(r -> r.getStudent().getId())
                .collect(Collectors.toSet());

        List<DashboardStatsDTO.CourseStatDTO> courseStatsList = new ArrayList<>();
        List<StudentDTO> allAbsentStudents = new ArrayList<>();
        int totalStudents = 0;
        int totalPresent = 0;

        for (Course course : targetCourses) {
            List<Student> courseStudents = studentRepository.findByCourse(course);
            int courseTotal = courseStudents.size();
            int coursePresent = 0;
            
            for (Student student : courseStudents) {
                if (presentStudentIds.contains(student.getId())) {
                    coursePresent++;
                } else {
                    allAbsentStudents.add(userMapper.toStudentDTO(student));
                }
            }

            int courseAbsent = courseTotal - coursePresent;
            double percentage = courseTotal > 0 ? (double) coursePresent / courseTotal * 100 : 0;

            String shiftLabel = course.getShift() != null ? course.getShift().name() : "";

            courseStatsList.add(DashboardStatsDTO.CourseStatDTO.builder()
                    .id(course.getId())
                    .name(course.getYearLabel())
                    .division(course.getDivision())
                    .shift(shiftLabel)
                    .total(courseTotal)
                    .present(coursePresent)
                    .absent(courseAbsent)
                    .percentage(percentage)
                    .build());

            totalStudents += courseTotal;
            totalPresent += coursePresent;
        }

        return DashboardStatsDTO.builder()
                .totalStudents(totalStudents)
                .presentCount(totalPresent)
                .absentCount(totalStudents - totalPresent)
                .courseStats(courseStatsList)
                .absentStudents(allAbsentStudents)
                .build();
    }

    private AttendanceResponse mapToResponse(AttendanceRecord record) {
        return AttendanceResponse.builder()
                .id(record.getId())
                .student(userMapper.toStudentDTO(record.getStudent()))
                .timestamp(record.getTimestamp())
                .type(record.getType())
                .build();
    }
}
