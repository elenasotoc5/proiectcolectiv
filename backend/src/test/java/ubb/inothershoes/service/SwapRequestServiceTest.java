package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.entity.SwapRequest;
import ubb.inothershoes.entity.SwapRequestStatus;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.CreateSwapRequestRequest;
import ubb.inothershoes.model.SwapRequestResponse;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.SwapRequestRepository;
import ubb.inothershoes.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class SwapRequestServiceTest {

  @Mock private SwapRequestRepository swapRequestRepository;
  @Mock private HomeRepository homeRepository;
  @Mock private HomeAvailabilityRepository availabilityRepository;

  @InjectMocks private SwapRequestService service;

  private final LocalDate start = LocalDate.now().plusDays(10);
  private Home myHome;
  private Home otherHome;

  @BeforeEach
  void setUp() {
    User me = user(1L);
    myHome = home(100L, me);
    otherHome = home(200L, user(2L));

    UserPrincipal principal = UserPrincipal.create(me);
    SecurityContextHolder.getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void createsPendingSevenDayRequest() {
    stubHomes();
    stubAvailability(myHome, start.minusDays(1), start.plusDays(10));
    stubAvailability(otherHome, start, start.plusDays(6));
    when(swapRequestRepository.save(any(SwapRequest.class))).thenAnswer(i -> i.getArgument(0));

    SwapRequestResponse response = service.createSwapRequest(request(myHome, otherHome, start));

    assertEquals(SwapRequestResponse.StatusEnum.PENDING, response.getStatus());
    assertEquals(start, response.getStartDate());
    assertEquals(start.plusDays(6), response.getEndDate());
    assertEquals(100L, response.getRequesterHomeId());
    assertEquals(200L, response.getTargetHomeId());
  }

  @Test
  void rejectsOfferingSomeoneElsesHome() {
    stubHomes();
    assertStatus(HttpStatus.FORBIDDEN, request(otherHome, myHome, start));
  }

  @Test
  void rejectsSwapWithOwnHome() {
    Home mySecondHome = home(101L, myHome.getOwner());
    when(homeRepository.findById(100L)).thenReturn(Optional.of(myHome));
    when(homeRepository.findById(101L)).thenReturn(Optional.of(mySecondHome));
    assertStatus(HttpStatus.BAD_REQUEST, request(myHome, mySecondHome, start));
  }

  @Test
  void rejectsMissingHome() {
    when(homeRepository.findById(anyLong())).thenReturn(Optional.empty());
    assertStatus(HttpStatus.NOT_FOUND, request(myHome, otherHome, start));
  }

  @Test
  void rejectsPastStartDate() {
    assertStatus(HttpStatus.BAD_REQUEST, request(myHome, otherHome, LocalDate.now().minusDays(1)));
  }

  @Test
  void rejectsWhenTargetHomeIsNotAvailableForAllSevenDays() {
    stubHomes();
    stubAvailability(myHome, start, start.plusDays(6));
    stubAvailability(otherHome, start, start.plusDays(5));
    assertStatus(HttpStatus.BAD_REQUEST, request(myHome, otherHome, start));
  }

  @Test
  void rejectsWhenOwnHomeIsNotAvailable() {
    stubHomes();
    when(availabilityRepository.findByHome_IdOrderByStartDateAsc(100L)).thenReturn(List.of());
    assertStatus(HttpStatus.BAD_REQUEST, request(myHome, otherHome, start));
  }

  @Test
  void rejectsDuplicatePendingRequest() {
    stubHomes();
    stubAvailability(myHome, start, start.plusDays(6));
    stubAvailability(otherHome, start, start.plusDays(6));
    when(swapRequestRepository.existsByRequesterHome_IdAndTargetHome_IdAndStartDateAndStatus(
            100L, 200L, start, SwapRequestStatus.PENDING))
        .thenReturn(true);

    assertStatus(HttpStatus.CONFLICT, request(myHome, otherHome, start));
    verify(swapRequestRepository, never()).save(any());
  }

  @Test
  void doesNotRequireAMatch() {
    // Homes in counties neither user prefers can still be swapped.
    myHome.setCounty("Cluj");
    otherHome.setCounty("Constanta");
    stubHomes();
    stubAvailability(myHome, start, start.plusDays(6));
    stubAvailability(otherHome, start, start.plusDays(6));
    when(swapRequestRepository.save(any(SwapRequest.class))).thenAnswer(i -> i.getArgument(0));

    assertNotNull(service.createSwapRequest(request(myHome, otherHome, start)));
  }

  private void assertStatus(HttpStatus expected, CreateSwapRequestRequest request) {
    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> service.createSwapRequest(request));
    assertEquals(expected.value(), ex.getStatusCode().value());
  }

  private void stubHomes() {
    when(homeRepository.findById(100L)).thenReturn(Optional.of(myHome));
    when(homeRepository.findById(200L)).thenReturn(Optional.of(otherHome));
  }

  private void stubAvailability(Home home, LocalDate from, LocalDate to) {
    HomeAvailability availability = new HomeAvailability();
    availability.setHome(home);
    availability.setStartDate(from);
    availability.setEndDate(to);
    when(availabilityRepository.findByHome_IdOrderByStartDateAsc(home.getId()))
        .thenReturn(List.of(availability));
  }

  private static CreateSwapRequestRequest request(Home from, Home to, LocalDate startDate) {
    return new CreateSwapRequestRequest()
        .requesterHomeId(from.getId())
        .targetHomeId(to.getId())
        .startDate(startDate);
  }

  private static User user(Long id) {
    User user = new User();
    user.setId(id);
    user.setEmail("user" + id + "@example.com");
    return user;
  }

  private static Home home(Long id, User owner) {
    Home home = new Home();
    home.setId(id);
    home.setOwner(owner);
    return home;
  }
}
