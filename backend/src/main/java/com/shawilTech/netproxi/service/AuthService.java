package com.shawilTech.netproxi.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shawilTech.netproxi.dto.AuthResponse;
import com.shawilTech.netproxi.dto.LoginRequest;
import com.shawilTech.netproxi.dto.RegisterClientRequest;
import com.shawilTech.netproxi.dto.RegisterCompanyRequest;
import com.shawilTech.netproxi.entity.Client;
import com.shawilTech.netproxi.entity.Company;
import com.shawilTech.netproxi.entity.Employee;
import com.shawilTech.netproxi.entity.Role;
import com.shawilTech.netproxi.entity.User;
import com.shawilTech.netproxi.repository.ClientRepository;
import com.shawilTech.netproxi.repository.CompanyRepository;
import com.shawilTech.netproxi.repository.EmployeeRepository;
import com.shawilTech.netproxi.repository.RoleRepository;
import com.shawilTech.netproxi.repository.UserRepository;
import com.shawilTech.netproxi.security.JwtTokenProvider;
import com.shawilTech.netproxi.dto.GeocodingResult;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final CompanyRepository companyRepository;
        private final ClientRepository clientRepository;
        private final EmployeeRepository employeeRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtProvider;

        @Autowired
        private NominatimGeocodingService geocodingService;

        /**
         * Authenticate a user with username/email and password.
         * Returns an AuthResponse containing access token and user info.
         * Checks both User and Client entities for authentication.
         */
        public AuthResponse login(LoginRequest request) {

                String passwordToMatch = null;
                String username = null;
                UUID id = null;
                UUID companyId = null;
                List<String> roles = Collections.emptyList();
                String role = null;
                
                if (request.getUserType() == null || "company".equalsIgnoreCase(request.getUserType())) {
                        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
                        if (user != null) {
                                passwordToMatch = user.getPassword();
                                username = user.getUsername();
                                id = user.getId();
                                companyId = user.getCompany() != null ? user.getCompany().getId() : null;
                                roles = user.getRoles() == null ? Collections.emptyList()
                                                : user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
                                if (!roles.isEmpty()) role = roles.get(0);
                        }
                }
                
                if (passwordToMatch == null && (request.getUserType() == null || "client".equalsIgnoreCase(request.getUserType()))) {
                        Client client = clientRepository.findByEmail(request.getEmail()).orElse(null);
                        if (client != null) {
                                passwordToMatch = client.getPassword();
                                username = client.getEmail();
                                id = client.getId();
                                roles = List.of("ROLE_CLIENT");
                                role = "CLIENT";
                        }
                }
                
                if (passwordToMatch == null && (request.getUserType() == null || "employee".equalsIgnoreCase(request.getUserType()))) {
                        Employee employee = employeeRepository.findByEmail(request.getEmail()).orElse(null);
                        if (employee != null) {
                                passwordToMatch = employee.getPassword();
                                username = employee.getEmail();
                                id = employee.getId();
                                companyId = employee.getCompany() != null ? employee.getCompany().getId() : null;
                                roles = List.of("ROLE_EMPLOYEE");
                                role = "EMPLOYEE";
                        }
                }
                
                if (passwordToMatch == null) {
                        throw new RuntimeException("Invalid username or password");
                }

                System.out.println("Login attempt: " + request.getEmail());
                if (!passwordEncoder.matches(request.getPassword(), passwordToMatch)) {
                        throw new RuntimeException("Invalid username or password");
                }

                String token = jwtProvider.generateToken(username);

                return AuthResponse.builder()
                                .token(token)
                                .accessToken(token)
                                .username(username)
                                .email(request.getEmail())
                                .role(role)
                                .roles(roles)
                                .companyId(companyId)
                                .id(id)
                                .message("Login successful!")
                                .build();
        }

/**
           * Register a new client user with ROLE_CLIENT.
           * Also creates a Client profile entity for booking ownership.
           */
        @Transactional
        public AuthResponse registerClient(RegisterClientRequest request) {
                Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                                .orElseThrow(() -> new RuntimeException("Role ROLE_CLIENT not found"));

                // Create User entity for authentication
                User user = User.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .address(request.getAddress())
                                .enabled(true)
                                .roles(Collections.singleton(clientRole))
                                .build();

                userRepository.save(user);

                // Create Client profile entity for bookings - linked by email
                Client client = Client.builder()
                                .name(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .address(request.getAddress())
                                .build();
                clientRepository.save(client);

                String token = jwtProvider.generateToken(user.getUsername());

                return AuthResponse.builder()
                                .token(token)
                                .accessToken(token)
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role("CLIENT")
                                .roles(List.of("ROLE_CLIENT"))
                                .id(client.getId())
                                .message("Client registered successfully")
                                .build();
        }

        /**
         * Register a new company tenant with a ROLE_COMPANY_ADMIN user.
         * Creates the company (tenant) and the admin user in a single transaction.
         */
        @Transactional
        public AuthResponse registerCompany(RegisterCompanyRequest request) {
                Role companyAdminRole = roleRepository.findByName("ROLE_COMPANY")
                                .orElseThrow(() -> new RuntimeException("Role ROLE_COMPANY not found"));

                // Geocode the company address
                GeocodingResult geo = geocodingService.geocode(request.getAddress());
                Double lat = geo.success() ? geo.latitude() : null;
                Double lng = geo.success() ? geo.longitude() : null;



                System.out.println("LAT=" + lat + " LNG=" + lng);
                
                // Create the tenant company
                Company company = Company.builder()
                                .name(request.getCompanyName())
                                .address(request.getAddress())
                                .latitude(lat)
                                .longitude(lng)
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .website(request.getWebsite())
                                .description(request.getDescription())
                                .active(true)
                                .build();

                Company savedCompany = companyRepository.save(company);

                // Create the admin user linked to the company
                User user = User.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .enabled(true)
                                .company(savedCompany)
                                .roles(Collections.singleton(companyAdminRole))
                                .build();

                userRepository.save(user);

                String token = jwtProvider.generateToken(user.getUsername());

                return AuthResponse.builder()
                                .token(token)
                                .accessToken(token)
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .phone(user.getPhone())
                                .role("COMPANY")
                                .roles(List.of(companyAdminRole.getName()))
                                .companyId(savedCompany.getId())
                                .message("Company registered successfully")
                                .build();
        }
}
