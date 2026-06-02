package com.shawilTech.identityservice.service;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.repository.*;
import com.shawilTech.netproxi.security.JwtTokenProvider;
import com.shawilTech.netproxi.service.AuthService;
import com.shawilTech.netproxi.service.NominatimGeocodingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private NominatimGeocodingService geocodingService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtProvider;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void injectDependencies() {
        ReflectionTestUtils.setField(authService, "geocodingService", geocodingService);
    }

    @Test
    void login_withValidCredentials_returnsAuthResponse() {
        Role role = Role.builder().name("ROLE_CLIENT").build();
        User user = User.builder()
                .username("testuser")
                .email("testuser@example.com")
                .password("encodedPassword")
                .roles(Collections.singleton(role))
                .build();

        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
        when(jwtProvider.generateToken("testuser")).thenReturn("jwt-token");

        LoginRequest request = new LoginRequest();
        request.setEmail("testuser@example.com");
        request.setPassword("password");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("testuser", response.getUsername());
        assertEquals("ROLE_CLIENT", response.getRole());
        assertEquals("Login successful!", response.getMessage());
    }

    @Test
    void login_withUnknownEmail_throwsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());
        when(clientRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.login(request));
        assertEquals("Invalid username or password", ex.getMessage());
    }

    @Test
    void login_withWrongPassword_throwsException() {
        User user = User.builder()
                .username("testuser")
                .email("testuser@example.com")
                .password("encodedPassword")
                .build();

        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        LoginRequest request = new LoginRequest();
        request.setEmail("testuser@example.com");
        request.setPassword("wrongpassword");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.login(request));
        assertEquals("Invalid username or password", ex.getMessage());
    }

    @Test
    void registerClient_withValidRequest_returnsAuthResponse() {
        Role role = Role.builder().name("ROLE_CLIENT").build();
        when(roleRepository.findByName("ROLE_CLIENT")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtProvider.generateToken("newclient")).thenReturn("jwt-token");

        RegisterClientRequest request = new RegisterClientRequest();
        request.setUsername("newclient");
        request.setEmail("client@example.com");
        request.setPassword("password");

        AuthResponse response = authService.registerClient(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("newclient", response.getUsername());
        assertEquals("CLIENT", response.getRole());
        assertEquals("Client registered successfully", response.getMessage());
    }

    @Test
    void registerClient_whenRoleNotFound_throwsException() {
        when(roleRepository.findByName("ROLE_CLIENT")).thenReturn(Optional.empty());

        RegisterClientRequest request = new RegisterClientRequest();
        request.setUsername("newclient");
        request.setEmail("client@example.com");
        request.setPassword("password");

        assertThrows(RuntimeException.class, () -> authService.registerClient(request));
    }

    @Test
    void registerCompany_withValidRequest_returnsAuthResponse() {
        Role role = Role.builder().name("ROLE_COMPANY").build();
        Company company = Company.builder().name("Test Co").build();

        when(roleRepository.findByName("ROLE_COMPANY")).thenReturn(Optional.of(role));
        when(geocodingService.geocode(anyString())).thenReturn(new GeocodingResult(40.0, -74.0, true, null));
        when(companyRepository.save(any(Company.class))).thenReturn(company);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtProvider.generateToken("companyadmin")).thenReturn("jwt-token");

        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Test Co");
        request.setAddress("123 Main St");
        request.setUsername("companyadmin");
        request.setEmail("admin@testco.com");
        request.setPassword("password");

        AuthResponse response = authService.registerCompany(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("companyadmin", response.getUsername());
        assertEquals("COMPANY", response.getRole());
        assertEquals("Company registered successfully", response.getMessage());
    }

    @Test
    void registerCompany_whenRoleNotFound_throwsException() {
        when(roleRepository.findByName("ROLE_COMPANY")).thenReturn(Optional.empty());

        RegisterCompanyRequest request = new RegisterCompanyRequest();
        request.setCompanyName("Test Co");
        request.setAddress("123 Main St");
        request.setUsername("admin");
        request.setEmail("admin@testco.com");
        request.setPassword("password");

        assertThrows(RuntimeException.class, () -> authService.registerCompany(request));
    }
}
