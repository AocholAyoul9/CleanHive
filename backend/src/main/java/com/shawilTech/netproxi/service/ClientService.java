package com.shawilTech.netproxi.service;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.repository.ClientRepository;
import com.shawilTech.netproxi.repository.UserRepository;
import com.shawilTech.netproxi.security.JwtTokenProvider;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtProvider;

    @Transactional
    public ClientResponseDto registerClient(ClientRequestDto clientDto) {
        // Create Client profile entity for bookings
        Client client = new Client();
        client.setName(clientDto.getName());
        client.setEmail(clientDto.getEmail());
        client.setPassword(clientDto.getPassword());
        client.setPhone(clientDto.getPhone());
        client.setAddress(clientDto.getAddress());

        String token = jwtProvider.generateToken(clientDto.getEmail());
        client.setToken(token);

        Client savedClient = clientRepository.save(client);

        return ClientResponseDto.builder()
                .id(savedClient.getId())
                .name(savedClient.getName())
                .email(savedClient.getEmail())
                .phone(savedClient.getPhone())
                .address(savedClient.getAddress())
                .token(savedClient.getToken())
                .build();
    }

    public ClientResponseDto loginClient(ClientLoginRequestDto dto) {

        Client client = clientRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), client.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtProvider.generateToken(dto.getEmail());
        client.setToken(token);
        clientRepository.save(client);

        return ClientResponseDto.builder()
                .id(client.getId())
                .name(client.getName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .address(client.getAddress())
                .token(client.getToken())
                .build();
    }

    public ClientResponseDto getClientProfile() {
        // Get client from JWT-authenticated user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return ClientResponseDto.builder()
                .id(client.getId())
                .name(client.getName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .address(client.getAddress())
                .token(client.getToken())
                .build();
    }

    public Client getClientByEmail(String email) {
        return clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }
}