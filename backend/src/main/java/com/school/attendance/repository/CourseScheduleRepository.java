package com.school.attendance.repository;

import com.school.attendance.model.Course;
import com.school.attendance.model.CourseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseScheduleRepository extends JpaRepository<CourseSchedule, Long> {
    List<CourseSchedule> findByCourseAndDayOfWeekAndGroupNumber(Course course, DayOfWeek dayOfWeek, String groupNumber);
    List<CourseSchedule> findByCourseAndDayOfWeek(Course course, DayOfWeek dayOfWeek);
    
    @Query("SELECT cs FROM CourseSchedule cs WHERE cs.course = :course AND cs.dayOfWeek = :dayOfWeek " +
           "AND (cs.groupNumber = :groupNumber OR cs.groupNumber IS NULL) " +
           "ORDER BY cs.groupNumber DESC")
    List<CourseSchedule> findRelevantSchedules(@Param("course") Course course, 
                                               @Param("dayOfWeek") DayOfWeek dayOfWeek, 
                                               @Param("groupNumber") String groupNumber);
}
