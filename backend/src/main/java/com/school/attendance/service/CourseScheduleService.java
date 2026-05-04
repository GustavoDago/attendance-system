package com.school.attendance.service;

import com.school.attendance.dto.CourseScheduleDTO;
import com.school.attendance.model.Course;
import com.school.attendance.model.CourseSchedule;
import com.school.attendance.repository.CourseRepository;
import com.school.attendance.repository.CourseScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseScheduleService {

    private final CourseScheduleRepository courseScheduleRepository;
    private final CourseRepository courseRepository;

    public List<CourseScheduleDTO> getSchedulesByCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        return courseScheduleRepository.findAll().stream()
                .filter(cs -> cs.getCourse().getId().equals(courseId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public CourseScheduleDTO addSchedule(CourseScheduleDTO dto) {
        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        // Verificar si ya existe esa misma actividad para ese grupo en ese día
        boolean exists = courseScheduleRepository.findAll().stream()
                .anyMatch(cs -> cs.getCourse().getId().equals(dto.getCourseId()) &&
                        cs.getDayOfWeek() == dto.getDayOfWeek() &&
                        cs.getActivityType() == dto.getActivityType() &&
                        ((cs.getGroupNumber() == null && dto.getGroupNumber() == null) ||
                         (cs.getGroupNumber() != null && cs.getGroupNumber().equals(dto.getGroupNumber()))));

        if (exists) {
            throw new RuntimeException("Esa actividad ya está programada para ese día y grupo.");
        }

        CourseSchedule schedule = CourseSchedule.builder()
                .course(course)
                .groupNumber(dto.getGroupNumber())
                .dayOfWeek(dto.getDayOfWeek())
                .activityType(dto.getActivityType())
                .build();

        return toDTO(courseScheduleRepository.save(schedule));
    }

    public void deleteSchedule(Long id) {
        courseScheduleRepository.deleteById(id);
    }

    private CourseScheduleDTO toDTO(CourseSchedule entity) {
        return CourseScheduleDTO.builder()
                .id(entity.getId())
                .courseId(entity.getCourse().getId())
                .groupNumber(entity.getGroupNumber())
                .dayOfWeek(entity.getDayOfWeek())
                .activityType(entity.getActivityType())
                .build();
    }
}
