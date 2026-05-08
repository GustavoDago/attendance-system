package com.school.attendance.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyCourseSummaryDTO {
    private int presentCount;
    private int absentCount;
    private int totalStudents;
}
