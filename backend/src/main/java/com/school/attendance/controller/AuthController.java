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
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            System.out.println("Login attempt for username: " + request.getUsername());
            
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));
 
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
 
            String jwtToken = jwtService.generateToken(user);
 
            UserDTO userDTO = UserDTO.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .dni(user.getDni())
                    .role(user.getRole())
                    .build();
 
            System.out.println("Login successful for username: " + request.getUsername());
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(jwtToken)
                    .user(userDTO)
                    .build());
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to let GlobalExceptionHandler handle it, but now we have the trace in logs
        }
    }
}
