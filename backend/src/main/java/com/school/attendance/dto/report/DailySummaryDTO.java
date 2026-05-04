package com.school.attendance.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySummaryDTO {
    private String statusLabel; // "P", "A", "0.5", "1.0", "H", "-"
    private Double absenceValue; // 0.0, 0.5, 1.0
}
