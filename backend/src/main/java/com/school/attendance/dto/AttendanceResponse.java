package com.school.attendance.dto;

import com.school.attendance.model.AttendanceType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AttendanceResponse {
    private Long id;
    private UserDTO user;
    private LocalDateTime timestamp;
    private AttendanceType type;
}
