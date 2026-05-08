package com.school.attendance.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyReportDTO {
    private Long courseId;
    private String courseName;
    private Integer year;
    private Integer month;
    private Integer daysInMonth;
    private List<StudentMonthlyReportDTO> students;

    // Key is the day of the month (1-31), value is present/absent counts for the whole course
    private Map<Integer, DailyCourseSummaryDTO> dailyTotals;
}
