package com.shawilTech.netproxi.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shawilTech.netproxi.entity.Client;
import com.shawilTech.netproxi.entity.Role;
import com.shawilTech.netproxi.entity.User;
import com.shawilTech.netproxi.repository.ClientRepository;
import com.shawilTech.netproxi.repository.UserRepository;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String usernameOrEmail)
            throws UsernameNotFoundException {

        // First try to find a User
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElse(null);

        if (user != null) {
            boolean hasRoleClient = user.getRoles() != null
                    && user.getRoles().stream().anyMatch(role -> "ROLE_CLIENT".equalsIgnoreCase(role.getName()));
            if (hasRoleClient) {
                Client client = clientRepository.findByEmail(user.getEmail()).orElse(null);
                if (client != null) {
                    return new ClientPrincipal(client);
                }
            }
            return new CustomUserDetails(user);
        }

        // If not found, try to find a Client
        Client client = clientRepository.findByEmail(usernameOrEmail).orElse(null);
        if (client != null) {
            return new ClientPrincipal(client);
        }

        throw new UsernameNotFoundException("User not found: " + usernameOrEmail);
    }
}