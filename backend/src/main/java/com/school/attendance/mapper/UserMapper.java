package com.school.attendance.mapper;

import com.school.attendance.dto.UserDTO;
import com.school.attendance.model.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) return null;

        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .role(user.getRole());

        if (user instanceof Student student) {
            builder.nationality(student.getNationality())
                    .birthPlace(student.getBirthPlace())
                    .birthDate(student.getBirthDate())
                    .age(student.getAge())
                    .address(student.getAddress())
                    .locality(student.getLocality())
                    .phone(student.getPhone())
                    .fileNumber(student.getFileNumber());

            if (student.getStudentCourses() != null) {
                builder.courseIds(student.getStudentCourses().stream()
                        .map(sc -> sc.getCourse().getId())
                        .collect(Collectors.toList()));
                builder.courseNames(student.getStudentCourses().stream()
                        .map(sc -> sc.getCourse().getName() + " " + sc.getCourse().getDivision())
                        .collect(Collectors.toList()));
                builder.orderNumbers(student.getStudentCourses().stream()
                        .map(StudentCourse::getOrderNumber)
                        .collect(Collectors.toList()));
            }
        } else if (user instanceof Teacher teacher) {
            builder.specialty(teacher.getSpecialty());
            if (teacher.getSubjects() != null) {
                builder.subjects(teacher.getSubjects().stream()
                        .map(Subject::getName)
                        .collect(Collectors.toList()));
            }
        } else if (user instanceof Preceptor preceptor) {
            if (preceptor.getAssignedCourses() != null) {
                builder.assignedCourses(preceptor.getAssignedCourses().stream()
                        .map(c -> c.getName() + " " + c.getDivision())
                        .collect(Collectors.toList()));
            }
        }

        return builder.build();
    }
}
