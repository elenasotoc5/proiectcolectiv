
package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.entity.User;

import ubb.inothershoes.model.CreateHomeAvailabilityRequest;
import ubb.inothershoes.model.HomeAvailabilityResponse;

import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;

import ubb.inothershoes.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class HomeAvailabilityServiceTest {

  @Mock
  private HomeAvailabilityRepository homeAvailabilityRepository;

  @Mock
  private HomeRepository homeRepository;

  @InjectMocks
  private HomeAvailabilityService homeAvailabilityService;

  private final Long homeId = 1L;
  private final Long availabilityId = 10L;
  private final Long ownerId = 100L;

  private final LocalDate startDate = LocalDate.of(2027, 7, 10);
  private final LocalDate endDate = LocalDate.of(2027, 7, 20);

  private Home home;

  @BeforeEach
  void setUp() {
    User owner = new User();
    owner.setId(ownerId);

    home = new Home();
    home.setId(homeId);
    home.setOwner(owner);

    authenticateAs(ownerId);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void authenticateAs(Long userId) {
    UserPrincipal principal = new UserPrincipal(
        userId,
        "test@example.com",
        "password",
        List.of(new SimpleGrantedAuthority("ROLE_USER")));

    UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
            principal,
            null,
            principal.getAuthorities());

    SecurityContextHolder.getContext()
        .setAuthentication(authentication);
  }

  private CreateHomeAvailabilityRequest createRequest(
      LocalDate startDate,
      LocalDate endDate) {

    CreateHomeAvailabilityRequest request =
        new CreateHomeAvailabilityRequest();

    request.setStartDate(startDate);
    request.setEndDate(endDate);

    return request;
  }

  private HomeAvailability createAvailability() {
    HomeAvailability availability = new HomeAvailability();

    availability.setId(availabilityId);
    availability.setHome(home);
    availability.setStartDate(startDate);
    availability.setEndDate(endDate);

    return availability;
  }

  // GET TESTS

  @Test
  void getHomeAvailability_shouldReturnAvailabilityPeriods() {
    HomeAvailability availability = createAvailability();

    when(homeRepository.existsById(homeId)).thenReturn(true);

    when(homeAvailabilityRepository
        .findByHome_IdOrderByStartDateAsc(homeId))
        .thenReturn(List.of(availability));

    List<HomeAvailabilityResponse> result =
        homeAvailabilityService.getHomeAvailability(homeId);

    assertEquals(1, result.size());
    assertEquals(availabilityId, result.get(0).getId());
    assertEquals(homeId, result.get(0).getHomeId());
    assertEquals(startDate, result.get(0).getStartDate());
    assertEquals(endDate, result.get(0).getEndDate());

    verify(homeAvailabilityRepository)
        .findByHome_IdOrderByStartDateAsc(homeId);
  }

  @Test
  void getHomeAvailability_shouldReturnEmptyList_whenNoAvailabilityExists() {
    when(homeRepository.existsById(homeId)).thenReturn(true);

    when(homeAvailabilityRepository
        .findByHome_IdOrderByStartDateAsc(homeId))
        .thenReturn(List.of());

    List<HomeAvailabilityResponse> result =
        homeAvailabilityService.getHomeAvailability(homeId);

    assertTrue(result.isEmpty());
  }

  @Test
  void getHomeAvailability_shouldThrowNotFound_whenHomeDoesNotExist() {
    when(homeRepository.existsById(homeId)).thenReturn(false);

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.getHomeAvailability(homeId));

    assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

    verifyNoInteractions(homeAvailabilityRepository);
  }

  // CREATE TESTS

  @Test
  void createHomeAvailability_shouldCreateAvailability_whenRequestIsValid() {
    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findOverlappingPeriods(
        homeId, startDate, endDate))
        .thenReturn(List.of());

    when(homeAvailabilityRepository.save(any(HomeAvailability.class)))
        .thenAnswer(invocation -> {
          HomeAvailability saved = invocation.getArgument(0);
          saved.setId(availabilityId);
          return saved;
        });

    HomeAvailabilityResponse result =
        homeAvailabilityService.createHomeAvailability(homeId, request);

    assertEquals(availabilityId, result.getId());
    assertEquals(homeId, result.getHomeId());
    assertEquals(startDate, result.getStartDate());
    assertEquals(endDate, result.getEndDate());

    verify(homeAvailabilityRepository)
        .save(any(HomeAvailability.class));
  }

  @Test
  void createHomeAvailability_shouldThrowBadRequest_whenStartDateIsNull() {
    CreateHomeAvailabilityRequest request =
        createRequest(null, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .save(any(HomeAvailability.class));
  }

  @Test
  void createHomeAvailability_shouldThrowBadRequest_whenEndDateIsBeforeStartDate() {
    LocalDate invalidEndDate = LocalDate.of(2027, 7, 5);

    CreateHomeAvailabilityRequest request =
        createRequest(startDate, invalidEndDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .save(any(HomeAvailability.class));
  }

  @Test
  void createHomeAvailability_shouldThrowConflict_whenPeriodOverlaps() {
    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findOverlappingPeriods(
        homeId, startDate, endDate))
        .thenReturn(List.of(new HomeAvailability()));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .save(any(HomeAvailability.class));
  }

  @Test
  void createHomeAvailability_shouldThrowNotFound_whenHomeDoesNotExist() {
    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.empty());

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

    verifyNoInteractions(homeAvailabilityRepository);
  }

  @Test
  void createHomeAvailability_shouldThrowUnauthorized_whenUserIsNotAuthenticated() {
    SecurityContextHolder.clearContext();

    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());

    verifyNoInteractions(homeRepository, homeAvailabilityRepository);
  }

  @Test
  void createHomeAvailability_shouldThrowForbidden_whenUserDoesNotOwnHome() {
    authenticateAs(999L);

    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.createHomeAvailability(homeId, request));

    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());

    verifyNoInteractions(homeAvailabilityRepository);
  }

  // UPDATE TESTS

  @Test
  void updateHomeAvailability_shouldUpdatePeriod_whenRequestIsValid() {
    CreateHomeAvailabilityRequest request =
        createRequest(
            LocalDate.of(2027, 8, 1),
            LocalDate.of(2027, 8, 15));

    HomeAvailability availability = createAvailability();

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findById(availabilityId))
        .thenReturn(Optional.of(availability));

    when(homeAvailabilityRepository.findOverlappingPeriodsForUpdate(
        homeId,
        availabilityId,
        request.getStartDate(),
        request.getEndDate()))
        .thenReturn(List.of());

    when(homeAvailabilityRepository.save(availability))
        .thenReturn(availability);

    HomeAvailabilityResponse result =
        homeAvailabilityService.updateHomeAvailability(
            homeId, availabilityId, request);

    assertEquals(request.getStartDate(), result.getStartDate());
    assertEquals(request.getEndDate(), result.getEndDate());

    verify(homeAvailabilityRepository).save(availability);
  }

  @Test
  void updateHomeAvailability_shouldThrowConflict_whenPeriodOverlaps() {
    CreateHomeAvailabilityRequest request =
        createRequest(
            LocalDate.of(2027, 8, 1),
            LocalDate.of(2027, 8, 15));

    HomeAvailability availability = createAvailability();

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findById(availabilityId))
        .thenReturn(Optional.of(availability));

    when(homeAvailabilityRepository.findOverlappingPeriodsForUpdate(
        homeId,
        availabilityId,
        request.getStartDate(),
        request.getEndDate()))
        .thenReturn(List.of(new HomeAvailability()));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.updateHomeAvailability(
            homeId, availabilityId, request));

    assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .save(any(HomeAvailability.class));
  }

  @Test
  void updateHomeAvailability_shouldThrowBadRequest_whenDatesAreInvalid() {
    CreateHomeAvailabilityRequest request =
        createRequest(startDate, startDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.updateHomeAvailability(
            homeId, availabilityId, request));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .findById(availabilityId);
  }

  @Test
  void updateHomeAvailability_shouldThrowNotFound_whenAvailabilityDoesNotExist() {
    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findById(availabilityId))
        .thenReturn(Optional.empty());

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.updateHomeAvailability(
            homeId, availabilityId, request));

    assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
  }

  @Test
  void updateHomeAvailability_shouldThrowForbidden_whenUserDoesNotOwnHome() {
    authenticateAs(999L);

    CreateHomeAvailabilityRequest request =
        createRequest(startDate, endDate);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.updateHomeAvailability(
            homeId, availabilityId, request));

    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());

    verifyNoInteractions(homeAvailabilityRepository);
  }

  // DELETE TESTS

  @Test
  void deleteHomeAvailability_shouldDeletePeriod_whenUserOwnsHome() {
    HomeAvailability availability = createAvailability();

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findById(availabilityId))
        .thenReturn(Optional.of(availability));

    assertDoesNotThrow(() ->
        homeAvailabilityService.deleteHomeAvailability(
            homeId, availabilityId));

    verify(homeAvailabilityRepository).delete(availability);
  }

  @Test
  void deleteHomeAvailability_shouldThrowNotFound_whenAvailabilityDoesNotExist() {
    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    when(homeAvailabilityRepository.findById(availabilityId))
        .thenReturn(Optional.empty());

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.deleteHomeAvailability(
            homeId, availabilityId));

    assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());

    verify(homeAvailabilityRepository, never())
        .delete(any(HomeAvailability.class));
  }

  @Test
  void deleteHomeAvailability_shouldThrowForbidden_whenUserDoesNotOwnHome() {
    authenticateAs(999L);

    when(homeRepository.findById(homeId))
        .thenReturn(Optional.of(home));

    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> homeAvailabilityService.deleteHomeAvailability(
            homeId, availabilityId));

    assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());

    verifyNoInteractions(homeAvailabilityRepository);
  }
}
