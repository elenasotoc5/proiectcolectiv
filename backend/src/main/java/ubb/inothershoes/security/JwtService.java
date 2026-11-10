package ubb.inothershoes.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ubb.inothershoes.entity.User;

@Service
public class JwtService {

  @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
  private String secretKey;

  @Value("${jwt.expiration-ms:86400000}")
  private long jwtExpirationMs;

  public JwtService() {}

  public JwtService(String secretKey, long jwtExpirationMs) {
    this.secretKey = secretKey;
    this.jwtExpirationMs = jwtExpirationMs;
  }

  public String generateToken(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", user.getId());
    claims.put("email", user.getEmail());
    if (user.getFirstName() != null) {
      claims.put("firstName", user.getFirstName());
    }
    if (user.getLastName() != null) {
      claims.put("lastName", user.getLastName());
    }

    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

    return Jwts.builder()
        .claims(claims)
        .subject(user.getEmail())
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(getSigningKey())
        .compact();
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  public Claims extractAllClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  public String extractEmail(String token) {
    return extractAllClaims(token).getSubject();
  }

  public Long extractUserId(String token) {
    Object userIdObj = extractAllClaims(token).get("userId");
    if (userIdObj instanceof Number number) {
      return number.longValue();
    } else if (userIdObj instanceof String str) {
      return Long.parseLong(str);
    }
    return null;
  }

  private SecretKey getSigningKey() {
    byte[] keyBytes;
    try {
      keyBytes = Decoders.BASE64.decode(secretKey);
    } catch (Exception e) {
      keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
    }
    if (keyBytes.length < 32) {
      try {
        keyBytes = java.security.MessageDigest.getInstance("SHA-256").digest(keyBytes);
      } catch (Exception ignored) {
      }
    }
    return Keys.hmacShaKeyFor(keyBytes);
  }
}
