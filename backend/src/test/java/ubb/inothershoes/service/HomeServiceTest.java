package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.CreateHomeRequest;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
public class HomeServiceTest {

  @Mock private HomeRepository homeRepository;

  @Mock private UserRepository userRepository;

  @Mock private HomePhotoService homePhotoService;

  @Mock private CountyService countyService;

  @InjectMocks private HomeService homeService;

  private User owner;
  private UserPrincipal ownerPrincipal;

  @BeforeEach
  void setUp() {
    owner = new User();
    owner.setId(10L);
    owner.setEmail("owner@example.com");

    ownerPrincipal = UserPrincipal.create(owner);
    SecurityContextHolder.getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                ownerPrincipal, null, ownerPrincipal.getAuthorities()));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void createHome_shouldThrowException_whenUserAlreadyHasHome() {
    CreateHomeRequest request = new CreateHomeRequest();
    request.setTitle("Cozy Loft");
    request.setCity("Cluj");
    request.setCounty("CJ");
    request.setAddress("Strada Memorandumului 1");
    request.setDescription("Nice view");
    request.setHousingType("Apartment");
    request.setGuestCapacity(2);

    when(userRepository.findById(10L)).thenReturn(Optional.of(owner));
    when(homeRepository.findByOwnerId(10L)).thenReturn(List.of(new Home()));

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> homeService.createHome(request));

    assertTrue(ex.getMessage().contains("Users can only have one home"));
    verify(homeRepository, never()).save(any());
  }

  @Test
  void createHome_shouldThrowException_whenCountyIsInvalid() {
    CreateHomeRequest request = new CreateHomeRequest();
    request.setTitle("Cozy Loft");
    request.setCity("Cluj");
    request.setCounty("INVALID");
    request.setAddress("Strada Memorandumului 1");
    request.setDescription("Nice view");
    request.setHousingType("Apartment");
    request.setGuestCapacity(2);

    when(userRepository.findById(10L)).thenReturn(Optional.of(owner));
    when(homeRepository.findByOwnerId(10L)).thenReturn(Collections.emptyList());
    when(countyService.isValidCountyCode("INVALID")).thenReturn(false);

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> homeService.createHome(request));

    assertTrue(ex.getMessage().contains("Invalid county identifier"));
    verify(homeRepository, never()).save(any());
  }

  @Test
  void createHome_shouldSucceed_whenUserHasNoHomes() {
    CreateHomeRequest request = new CreateHomeRequest();
    request.setTitle("Cozy Loft");
    request.setCity("Cluj");
    request.setCounty("CJ");
    request.setAddress("Strada Memorandumului 1");
    request.setDescription("Nice view");
    request.setHousingType("Apartment");
    request.setGuestCapacity(2);
    request.setAmenities(List.of("Wi-Fi"));

    when(userRepository.findById(10L)).thenReturn(Optional.of(owner));
    when(homeRepository.findByOwnerId(10L)).thenReturn(Collections.emptyList());
    when(countyService.isValidCountyCode("CJ")).thenReturn(true);
    when(homeRepository.save(any(Home.class)))
        .thenAnswer(invocation -> {
          Home h = invocation.getArgument(0);
          h.setId(100L);
          return h;
        });

    HomeResponse response = homeService.createHome(request);

    assertNotNull(response);
    assertEquals(100L, response.getId());
    assertEquals("Cozy Loft", response.getTitle());
    assertEquals("CJ", response.getCounty());
    assertEquals("Strada Memorandumului 1", response.getAddress());
    verify(homeRepository).save(any(Home.class));
  }

  @Test
  void getHomeById_shouldIncludeAddress_forOwner() {
    Home home = new Home();
    home.setId(100L);
    home.setOwner(owner);
    home.setTitle("My Flat");
    home.setCity("Cluj");
    home.setAddress("Private Address 123");
    home.setDescription("Desc");
    home.setHousingType("Flat");
    home.setGuestCapacity(2);

    when(homeRepository.findById(100L)).thenReturn(Optional.of(home));

    HomeResponse response = homeService.getHomeById(100L);

    assertNotNull(response);
    assertEquals("Private Address 123", response.getAddress());
  }

  @Test
  void getHomeById_shouldMaskAddress_forNonOwner() {
    User otherOwner = new User();
    otherOwner.setId(99L);

    Home home = new Home();
    home.setId(100L);
    home.setOwner(otherOwner);
    home.setTitle("Other Flat");
    home.setCity("Cluj");
    home.setAddress("Private Address 123");
    home.setDescription("Desc");
    home.setHousingType("Flat");
    home.setGuestCapacity(2);

    when(homeRepository.findById(100L)).thenReturn(Optional.of(home));

    HomeResponse response = homeService.getHomeById(100L);

    assertNotNull(response);
    assertNull(response.getAddress(), "Address should be masked for non-owners");
    assertEquals("Cluj", response.getCity());
  }

  @Test
  void deleteHome_shouldSchedulePhotoCleanup_andDelete() {
    Home home = new Home();
    home.setId(100L);
    home.setOwner(owner);

    when(homeRepository.findById(100L)).thenReturn(Optional.of(home));

    homeService.deleteHome(100L);

    verify(homePhotoService).scheduleHomePhotoCleanup(100L);
    verify(homeRepository).delete(home);
  }
}
