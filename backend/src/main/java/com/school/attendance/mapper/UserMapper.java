package com.school.attendance.mapper;

import com.school.attendance.dto.CourseDTO;
import com.school.attendance.dto.StudentDTO;
import com.school.attendance.dto.SubjectDTO;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.model.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDTO toUserDTO(User user) {
        if (user == null) return null;

        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .username(user.getUsername())
                .role(user.getRole());

        if (user instanceof Teacher teacher) {
            builder.specialty(teacher.getSpecialty());
            if (teacher.getSubjects() != null) {
                builder.subjects(teacher.getSubjects().stream()
                        .map(Subject::getName)
                        .collect(Collectors.toList()));
            }
        } else if (user instanceof Preceptor preceptor) {
            if (preceptor.getAssignedCourses() != null) {
                builder.assignedCourses(preceptor.getAssignedCourses().stream()
                        .map(c -> c.getYearLabel() + " " + c.getDivision())
                        .collect(Collectors.toList()));
            }
        }

        return builder.build();
    }

    public StudentDTO toStudentDTO(Student student) {
        if (student == null) return null;

        StudentDTO.StudentDTOBuilder builder = StudentDTO.builder()
                .id(student.getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .dni(student.getDni())
                .birthDate(student.getBirthDate())
                .age(student.getAge())
                .address(student.getAddress())
                .city(student.getCity())
                .nationality(student.getNationality())
                .birthPlace(student.getBirthPlace())
                .studentFileId(student.getStudentFileId())
                .guardianName(student.getGuardianName())
                .guardianPhone(student.getGuardianPhone())
                .qrToken(student.getQrToken())
                .active(student.isActive());

        if (student.getStudentCourses() != null && !student.getStudentCourses().isEmpty()) {
            // For now, if multiple, we take the first or consolidate
            // In a classic management app, a student usually belongs to one main course per year
            StudentCourse sc = student.getStudentCourses().get(0);
            builder.courseId(sc.getCourse().getId())
                    .courseName(sc.getCourse().getYearLabel() + " " + sc.getCourse().getDivision())
                    .orderNumber(sc.getOrderNumber())
                    .groupNumber(sc.getGroupNumber());
            if (sc.getCourse().getShift() != null) {
                builder.courseShift(sc.getCourse().getShift().name());
            }
        }

        return builder.build();
    }

    public Student toStudentEntity(StudentDTO dto) {
        if (dto == null) return null;

        return Student.builder()
                .id(dto.getId())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .dni(dto.getDni())
                .birthDate(dto.getBirthDate())
                .address(dto.getAddress())
                .city(dto.getCity())
                .nationality(dto.getNationality())
                .birthPlace(dto.getBirthPlace())
                .studentFileId(dto.getStudentFileId())
                .guardianName(dto.getGuardianName())
                .guardianPhone(dto.getGuardianPhone())
                .qrToken(dto.getQrToken())
                .active(dto.isActive())
                .build();
    }

    public CourseDTO toCourseDTO(Course course) {
        if (course == null) return null;
        return CourseDTO.builder()
                .id(course.getId())
                .year(course.getYear())
                .division(course.getDivision())
                .shift(course.getShift() != null ? course.getShift().name() : null)
                .yearLabel(course.getYearLabel())
                .build();
    }

    public SubjectDTO toSubjectDTO(Subject subject) {
        if (subject == null) return null;
        return SubjectDTO.builder()
                .id(subject.getId())
                .name(subject.getName())
                .build();
    }
}
