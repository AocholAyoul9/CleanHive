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
            return new CustomUserDetails(user);
        }

        // If not found, try to find a Client and create a temporary UserDetails
        Client client = clientRepository.findByEmail(usernameOrEmail).orElse(null);
        if (client != null) {
            // Create a temporary User entity for authentication purposes
            User tempUser = new User();
            tempUser.setUsername(client.getEmail());
            tempUser.setEmail(client.getEmail());
            tempUser.setPassword(client.getPassword());
            // Assign ROLE_CLIENT for clients
            Role clientRole = new Role();
            clientRole.setId(UUID.randomUUID());
            clientRole.setName("ROLE_CLIENT");
            tempUser.setRoles(Collections.singleton(clientRole));
            return new CustomUserDetails(tempUser);
        }

        throw new UsernameNotFoundException("User not found: " + usernameOrEmail);
    }
}