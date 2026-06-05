package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.repository.ActivityAttendanceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class AttendanceReportServiceTest {

    @Mock
    private ActivityAttendanceRepository attendanceRepository;

    @InjectMocks
    private AttendanceReportService reportService;

    @Test
    void calculateRecordWeight_OnlyAulaActive() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").build();
        LocalDate date = LocalDate.now();

        ActivityAttendance aula = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.AULA)
                .status(AttendanceStatus.AUSENTE)
                .build();

        ActivityAttendance taller = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.TALLER)
                .status(AttendanceStatus.NO_APLICA)
                .build();

        List<ActivityAttendance> daily = Arrays.asList(aula, taller);

        // Under our rules: AULA is active, TALLER is NO_APLICA.
        // AULA weight should be 1.0 (since only AULA/INSTITUCIONAL is active).
        double weight = reportService.calculateRecordWeight(aula, daily);
        assertEquals(1.0, weight, 0.001);
    }

    @Test
    void calculateRecordWeight_AulaAndTallerActive() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").build();
        LocalDate date = LocalDate.now();

        ActivityAttendance aula = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.AULA)
                .status(AttendanceStatus.AUSENTE)
                .build();

        ActivityAttendance taller = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.TALLER)
                .status(AttendanceStatus.AUSENTE)
                .build();

        List<ActivityAttendance> daily = Arrays.asList(aula, taller);

        // AULA and TALLER are both active (AUSENTE != NO_APLICA).
        // Each should have a base weight of 0.5.
        // Since status is AUSENTE (defaultWeight = 1.0), calculated weight is 0.5.
        double weightAula = reportService.calculateRecordWeight(aula, daily);
        double weightTaller = reportService.calculateRecordWeight(taller, daily);

        assertEquals(0.5, weightAula, 0.001);
        assertEquals(0.5, weightTaller, 0.001);
    }

    @Test
    void calculateRecordWeight_AulaTallerAndEdFisicaActive() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").build();
        LocalDate date = LocalDate.now();

        ActivityAttendance aula = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.AULA)
                .status(AttendanceStatus.AUSENTE)
                .build();

        ActivityAttendance taller = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.TALLER)
                .status(AttendanceStatus.AUSENTE)
                .build();

        ActivityAttendance edFisica = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.EDUCACION_FISICA)
                .status(AttendanceStatus.TARDANZA_1_2) // Tardanza 1/2
                .build();

        List<ActivityAttendance> daily = Arrays.asList(aula, taller, edFisica);

        // AULA (0.5), TALLER (0.25), ED_FISICA (0.25) are all active.
        // AULA weight: 1.0 * 0.5 = 0.5
        // TALLER weight: 1.0 * 0.25 = 0.25
        // ED_FISICA weight: 0.5 (TARDANZA_1_2 defaultWeight) * 0.25 = 0.125
        double weightAula = reportService.calculateRecordWeight(aula, daily);
        double weightTaller = reportService.calculateRecordWeight(taller, daily);
        double weightEdFisica = reportService.calculateRecordWeight(edFisica, daily);

        assertEquals(0.5, weightAula, 0.001);
        assertEquals(0.25, weightTaller, 0.001);
        assertEquals(0.125, weightEdFisica, 0.001);
    }

    @Test
    void calculateRecordWeight_InstitucionalActive() {
        Student student = Student.builder().id(1L).firstName("John").lastName("Doe").build();
        LocalDate date = LocalDate.now();

        ActivityAttendance inst = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.INSTITUCIONAL)
                .status(AttendanceStatus.AUSENTE)
                .build();

        ActivityAttendance taller = ActivityAttendance.builder()
                .student(student)
                .date(date)
                .activityType(ActivityType.TALLER)
                .status(AttendanceStatus.AUSENTE)
                .build();

        List<ActivityAttendance> daily = Arrays.asList(inst, taller);

        // INSTITUCIONAL and TALLER are active.
        // INSTITUCIONAL is equivalent to AULA, so weight is 0.5 each.
        double weightInst = reportService.calculateRecordWeight(inst, daily);
        double weightTaller = reportService.calculateRecordWeight(taller, daily);

        assertEquals(0.5, weightInst, 0.001);
        assertEquals(0.5, weightTaller, 0.001);
    }
}
