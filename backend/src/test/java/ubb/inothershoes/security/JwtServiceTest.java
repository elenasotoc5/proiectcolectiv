package ubb.inothershoes.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ubb.inothershoes.entity.User;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970", 3600000L);
    }

    @Test
    void shouldGenerateAndValidateTokenSuccessfully() {
        User user = new User();
        user.setId(42L);
        user.setEmail("test@example.com");
        user.setFirstName("Jane");
        user.setLastName("Doe");

        String token = jwtService.generateToken(user);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        assertTrue(jwtService.validateToken(token));
        assertEquals("test@example.com", jwtService.extractEmail(token));
        assertEquals(42L, jwtService.extractUserId(token));
    }

    @Test
    void shouldRejectInvalidOrTamperedToken() {
        assertFalse(jwtService.validateToken("invalid.token.here"));
        assertFalse(jwtService.validateToken(""));
        assertFalse(jwtService.validateToken(null));

        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");
        String token = jwtService.generateToken(user);

        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";
        assertFalse(jwtService.validateToken(tamperedToken));
    }
}
