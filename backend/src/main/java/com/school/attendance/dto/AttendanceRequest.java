package com.school.attendance.dto;

import com.school.attendance.model.AttendanceType;
import lombok.Data;

@Data
public class AttendanceRequest {
    private Long studentId;
    private String qrToken;
    private AttendanceType type;
}
