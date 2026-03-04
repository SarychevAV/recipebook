package com.recipebook.user;

import com.recipebook.common.exception.UserAlreadyExistsException;
import com.recipebook.common.security.JwtService;
import com.recipebook.user.dto.AuthResponse;
import com.recipebook.user.dto.LoginRequest;
import com.recipebook.user.dto.RegisterRequest;
import com.recipebook.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    @Test
    void register_whenValidData_thenReturnsAuthResponse() {
        // given
        RegisterRequest request = new RegisterRequest("johndoe", "john@example.com", "password123");
        UserEntity savedUser = UserEntity.builder()
                .username("johndoe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.USER)
                .build();
        UserResponse userResponse = new UserResponse(UUID.randomUUID(), "johndoe", "john@example.com", Role.USER);

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByUsername(request.username())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any())).thenReturn("jwt-token");
        when(userMapper.toResponse(savedUser)).thenReturn(userResponse);

        // when
        AuthResponse result = userService.register(request);

        // then
        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.user().email()).isEqualTo("john@example.com");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    void register_whenEmailAlreadyExists_thenThrowsUserAlreadyExistsException() {
        // given
        RegisterRequest request = new RegisterRequest("johndoe", "john@example.com", "password123");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        // when + then
        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining(request.email());

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_whenUsernameAlreadyExists_thenThrowsUserAlreadyExistsException() {
        // given
        RegisterRequest request = new RegisterRequest("johndoe", "john@example.com", "password123");
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByUsername(request.username())).thenReturn(true);

        // when + then
        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining(request.username());

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_whenValidCredentials_thenReturnsAuthResponse() {
        // given
        LoginRequest request = new LoginRequest("john@example.com", "password123");
        UserEntity user = UserEntity.builder()
                .username("johndoe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.USER)
                .build();
        UserResponse userResponse = new UserResponse(UUID.randomUUID(), "johndoe", "john@example.com", Role.USER);

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        // when
        AuthResponse result = userService.login(request);

        // then
        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.user().email()).isEqualTo("john@example.com");
    }

    @Test
    void login_whenUserNotFound_thenThrowsBadCredentialsException() {
        // given
        LoginRequest request = new LoginRequest("unknown@example.com", "password123");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        // when + then
        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_whenWrongPassword_thenThrowsBadCredentialsException() {
        // given
        LoginRequest request = new LoginRequest("john@example.com", "wrongpassword");
        UserEntity user = UserEntity.builder()
                .username("johndoe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(Role.USER)
                .build();

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(false);

        // when + then
        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }
}