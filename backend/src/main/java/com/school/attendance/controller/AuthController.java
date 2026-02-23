package com.school.attendance.controller;

import com.school.attendance.dto.AuthRequest;
import com.school.attendance.dto.AuthResponse;
import com.school.attendance.dto.UserDTO;
import com.school.attendance.model.User;
import com.school.attendance.repository.UserRepository;
import com.school.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getDni(),
                        request.getPassword()));

        User user = userRepository.findByDni(request.getDni())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwtToken = jwtService.generateToken(user);

        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .dni(user.getDni())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwtToken)
                .user(userDTO)
                .build());
    }
}
