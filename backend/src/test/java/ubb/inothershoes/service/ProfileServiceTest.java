package ubb.inothershoes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.UserProfileRequest;
import ubb.inothershoes.model.UserProfileResponse;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

  @Mock private UserRepository userRepository;

  @Mock private HomeRepository homeRepository;

  @Mock private CountyService countyService;

  @InjectMocks private ProfileService profileService;

  private User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(1L);
    user.setFirstName("Alice");
    user.setLastName("Smith");
    user.setEmail("alice@example.com");
    user.setLocation("Cluj-Napoca");
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void getProfile_whenUserHasHome_returnsHasHomeTrue() {
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(homeRepository.findByOwnerId(1L)).thenReturn(List.of(new Home()));

    UserProfileResponse response = profileService.getProfile(1L);

    assertThat(response).isNotNull();
    assertThat(response.getUserId()).isEqualTo(1L);
    assertThat(response.getFirstName()).isEqualTo("Alice");
    assertThat(response.getHasHome()).isTrue();
  }

  @Test
  void getProfile_whenUserHasNoHome_returnsHasHomeFalse() {
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(homeRepository.findByOwnerId(1L)).thenReturn(Collections.emptyList());

    UserProfileResponse response = profileService.getProfile(1L);

    assertThat(response).isNotNull();
    assertThat(response.getUserId()).isEqualTo(1L);
    assertThat(response.getHasHome()).isFalse();
  }

  @Test
  void getProfile_whenUserNotFound_throwsNotFound() {
    when(userRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> profileService.getProfile(99L))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("User not found");
  }

  @Test
  void updateProfile_whenAuthorized_updatesAndReturnsHasHome() {
    User currentUser = user;
    if (currentUser == null) {
      throw new AssertionError("Expected user to be initialized");
    }

    UserPrincipal principal = UserPrincipal.create(currentUser);
    UsernamePasswordAuthenticationToken auth =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(auth);

    when(userRepository.findById(1L)).thenReturn(Optional.of(currentUser));
    when(userRepository.save(anyNonNull(User.class))).thenReturn(currentUser);
    when(homeRepository.findByOwnerId(1L)).thenReturn(List.of(new Home()));

    UserProfileRequest request = new UserProfileRequest();
    request.setFirstName("Alicia");
    request.setPreferences(List.of("Quiet", "Plants", "Coffee"));
    request.setPreferredCounties(List.of("CJ", "BV"));

    when(countyService.isValidCountyCode("CJ")).thenReturn(true);
    when(countyService.isValidCountyCode("BV")).thenReturn(true);

    UserProfileResponse response = profileService.updateProfile(1L, request);

    assertThat(response).isNotNull();
    assertThat(currentUser.getFirstName()).isEqualTo("Alicia");
    assertThat(response.getHasHome()).isTrue();
    assertThat(response.getPreferredCounties()).containsExactlyInAnyOrder("CJ", "BV");
    verify(userRepository).save(currentUser);
  }

  @NonNull
  @SuppressWarnings("null")
  private static <T> T anyNonNull(Class<T> type) {
    return any(type);
  }

  @Test
  void updateProfile_whenPreferredCountyInvalid_throwsBadRequest() {
    UserPrincipal principal = UserPrincipal.create(user);
    UsernamePasswordAuthenticationToken auth =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(auth);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(countyService.isValidCountyCode("INVALID")).thenReturn(false);

    UserProfileRequest request = new UserProfileRequest();
    request.setPreferredCounties(List.of("INVALID"));

    assertThatThrownBy(() -> profileService.updateProfile(1L, request))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Invalid county identifier");
  }

  @Test
  void updateProfile_whenPreferredCountiesHasDuplicates_throwsBadRequest() {
    UserPrincipal principal = UserPrincipal.create(user);
    UsernamePasswordAuthenticationToken auth =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(auth);

    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(countyService.isValidCountyCode("CJ")).thenReturn(true);
    when(countyService.isValidCountyCode("BV")).thenReturn(true);

    UserProfileRequest request = new UserProfileRequest();
    request.setPreferredCounties(List.of("CJ", "BV", "CJ"));

    assertThatThrownBy(() -> profileService.updateProfile(1L, request))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("Duplicate county entries in preferences are not allowed");
  }

  @Test
  void updateProfile_whenDifferentUser_throwsForbidden() {
    User otherUser = new User();
    otherUser.setId(2L);
    otherUser.setEmail("other@example.com");

    UserPrincipal principal = UserPrincipal.create(otherUser);
    UsernamePasswordAuthenticationToken auth =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(auth);

    UserProfileRequest request = new UserProfileRequest();

    assertThatThrownBy(() -> profileService.updateProfile(1L, request))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("not authorized");
  }
}
