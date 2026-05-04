package com.school.attendance.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMonthlyReportDTO {
    private Long studentId;
    private String lastName;
    private String firstName;
    private String orderNumber;
    
    // Key is the day of the month (1-31)
    private Map<Integer, DailySummaryDTO> dailyRecords;
    
    private Double monthlyTotal;
    private Double annualTotal;
}
