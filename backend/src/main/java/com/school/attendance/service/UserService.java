package com.school.attendance.service;

import com.school.attendance.model.*;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.mapper.UserMapper;
import com.school.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.findByDni(userDTO.getDni()).isPresent()) {
            throw new RuntimeException("DNI already exists");
        }
        if (userDTO.getUsername() != null && userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        // For simplicity in this first evolution step, we create a generic User
        // Real logic should use specific builders based on role
        User user = User.builder()
                .firstName(userDTO.getFirstName())
                .lastName(userDTO.getLastName())
                .dni(userDTO.getDni())
                .username(userDTO.getUsername() != null ? userDTO.getUsername() : userDTO.getDni())
                .password(passwordEncoder.encode(userDTO.getDni())) // Default password is DNI
                .role(userDTO.getRole())
                .build();
        user = userRepository.save(user);
        return userMapper.toUserDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserDTO)
                .toList();
    }

    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(userMapper::toUserDTO);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }
}
