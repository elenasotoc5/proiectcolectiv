package ubb.inothershoes.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.CreateHomeRequest;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class HomeService {

  private final HomeRepository homeRepository;
  private final UserRepository userRepository;
  private final HomePhotoService homePhotoService;
  private final CountyService countyService;

  public HomeService(
      HomeRepository homeRepository,
      UserRepository userRepository,
      HomePhotoService homePhotoService,
      CountyService countyService) {
    this.homeRepository = homeRepository;
    this.userRepository = userRepository;
    this.homePhotoService = homePhotoService;
    this.countyService = countyService;
  }

  @Transactional
  public HomeResponse createHome(CreateHomeRequest request) {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

    Long userId = principal.getId();
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    User owner =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!homeRepository.findByOwnerId(owner.getId()).isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Users can only have one home. Please update your existing home.");
    }

    if (isBlank(request.getTitle())
        || isBlank(request.getCity())
        || isBlank(request.getCounty())
        || isBlank(request.getAddress())
        || isBlank(request.getDescription())
        || isBlank(request.getHousingType())
        || request.getGuestCapacity() == null
        || request.getGuestCapacity() < 1) {

      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Please complete all required home details");
    }

    if (!countyService.isValidCountyCode(request.getCounty())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Invalid county identifier: " + request.getCounty());
    }

    Home home = new Home();

    home.setOwner(owner);
    home.setTitle(request.getTitle().trim());
    home.setCity(request.getCity().trim());
    home.setCounty(request.getCounty().trim().toUpperCase());
    home.setAddress(request.getAddress().trim());
    home.setDescription(request.getDescription().trim());
    home.setHousingType(request.getHousingType().trim());
    home.setGuestCapacity(request.getGuestCapacity());

    List<String> amenities =
        request.getAmenities() != null
            ? new ArrayList<>(request.getAmenities())
            : new ArrayList<>();

    home.setAmenities(amenities);

    Home savedHome = homeRepository.save(home);

    return homeToHomeResponse(savedHome);
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }

  @Transactional(readOnly = true)
  public List<HomeResponse> getMyHomes() {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

    List<Home> homes = homeRepository.findByOwnerId(principal.getId());

    List<HomeResponse> responses = new ArrayList<>();

    for (Home home : homes) {
      responses.add(homeToHomeResponse(home));
    }

    return responses;
  }

  @Transactional
  public HomeResponse updateHome(Long homeId, CreateHomeRequest request) {

    Home home = getOwnedHome(homeId);

    if (request == null
        || isBlank(request.getTitle())
        || isBlank(request.getCity())
        || isBlank(request.getCounty())
        || isBlank(request.getAddress())
        || isBlank(request.getDescription())
        || isBlank(request.getHousingType())
        || request.getGuestCapacity() == null
        || request.getGuestCapacity() < 1) {

      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Please complete all required home details");
    }

    if (!countyService.isValidCountyCode(request.getCounty())) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Invalid county identifier: " + request.getCounty());
    }

    home.setTitle(request.getTitle().trim());
    home.setCity(request.getCity().trim());
    home.setCounty(request.getCounty().trim().toUpperCase());
    home.setAddress(request.getAddress().trim());
    home.setDescription(request.getDescription().trim());
    home.setHousingType(request.getHousingType().trim());
    home.setGuestCapacity(request.getGuestCapacity());

    home.setAmenities(
        request.getAmenities() != null
            ? new ArrayList<>(request.getAmenities())
            : new ArrayList<>());

    Home savedHome = homeRepository.save(home);

    return homeToHomeResponse(savedHome);
  }

  @Transactional
  public void deleteHome(Long homeId) {

    Home home = getOwnedHome(homeId);

    homePhotoService.scheduleHomePhotoCleanup(homeId);

    homeRepository.delete(home);
  }

  private @NonNull Home getOwnedHome(Long homeId) {

    if (homeId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Home ID is required");
    }

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {

      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    Home home =
        homeRepository
            .findById(homeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));

    if (!home.getOwner().getId().equals(principal.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "You are not authorized to modify this home");
    }

    return home;
  }

  @Transactional(readOnly = true)
  public HomeResponse getHomeById(Long homeId) {
    if (homeId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Home ID is required");
    }

    Home home =
        homeRepository
            .findById(homeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isOwner =
        auth != null
            && auth.getPrincipal() instanceof UserPrincipal principal
            && home.getOwner().getId().equals(principal.getId());

    return homeToHomeResponse(home, isOwner);
  }

  private HomeResponse homeToHomeResponse(Home home) {
    return homeToHomeResponse(home, true);
  }

  private HomeResponse homeToHomeResponse(Home home, boolean includeAddress) {
    HomeResponse response = new HomeResponse();
    response.setId(home.getId());
    response.setOwnerId(home.getOwner().getId());
    response.setTitle(home.getTitle());
    response.setCity(home.getCity());
    response.setCounty(home.getCounty());
    response.setAddress(includeAddress ? home.getAddress() : null);
    response.setDescription(home.getDescription());
    response.setHousingType(home.getHousingType());
    response.setGuestCapacity(home.getGuestCapacity());
    response.setAmenities(home.getAmenities());
    response.setCreatedAt(home.getCreatedAt());
    return response;
  }
}
