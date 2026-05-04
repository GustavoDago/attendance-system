package com.school.attendance.dto;

import com.school.attendance.model.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseScheduleDTO {
    private Long id;
    private Long courseId;
    private Integer groupNumber;
    private DayOfWeek dayOfWeek;
    private ActivityType activityType;
}
