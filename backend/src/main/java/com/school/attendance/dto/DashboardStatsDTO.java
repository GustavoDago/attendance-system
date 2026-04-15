package com.school.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private int totalStudents;
    private int presentCount;
    private int absentCount;
    private List<CourseStatDTO> courseStats;
    private List<StudentDTO> absentStudents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseStatDTO {
        private Long id;
        private String name;
        private String division;
        private String shift;
        private int total;
        private int present;
        private int absent;
        private double percentage;
    }
}
