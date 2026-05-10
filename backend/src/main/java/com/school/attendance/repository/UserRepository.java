package com.school.attendance.repository;

import com.school.attendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByDni(String dni);
    Optional<User> findByUsername(String username);
}
