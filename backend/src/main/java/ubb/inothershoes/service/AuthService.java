package ubb.inothershoes.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.LoginRequest;
import ubb.inothershoes.model.RegisterRequest;
import ubb.inothershoes.model.UserResponse;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.JwtService;

@Service
public class AuthService {
  private static final String DUMMY_HASH =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @Transactional
  public UserResponse register(RegisterRequest request) {
    String normalizedEmail = request.getEmail().toLowerCase().trim();

    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
    }

    User user = new User();
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setFirstName(request.getFirstName().trim());
    user.setLastName(request.getLastName().trim());

    User saved;

    try {
      saved = userRepository.saveAndFlush(user);
    } catch (DataIntegrityViolationException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
    }

    UserResponse response = createUserResponse(saved);
    return response;
  }

  @Transactional(readOnly = true)
  public UserResponse login(LoginRequest request) {
    String normalizedEmail = request.getEmail().toLowerCase().trim();

    User user = userRepository.findByEmail(normalizedEmail).orElse(null);

    if (user == null) {
      passwordEncoder.matches(request.getPassword(), DUMMY_HASH);
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    UserResponse response = createUserResponse(user);
    response.setAccessToken(jwtService.generateToken(user));
    return response;
  }

  private UserResponse createUserResponse(User user) {
    UserResponse response = new UserResponse();

    response.setId(user.getId());
    response.setFirstName(user.getFirstName());
    response.setLastName(user.getLastName());
    response.setEmail(user.getEmail());
    response.setCreatedAt(user.getCreatedAt());

    return response;
  }
}
