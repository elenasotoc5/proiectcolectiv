package ubb.inothershoes.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
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

  public HomeService(
      HomeRepository homeRepository,
      UserRepository userRepository,
      HomePhotoService homePhotoService) {
    this.homeRepository = homeRepository;
    this.userRepository = userRepository;
    this.homePhotoService = homePhotoService;
  }

  @Transactional
  public HomeResponse createHome(CreateHomeRequest request) {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    UserPrincipal principal = (UserPrincipal) auth.getPrincipal();

    User owner =
        userRepository
            .findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (!homeRepository.findByOwnerId(owner.getId()).isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Users can only have one home. Please update your existing home.");
    }

    if (isBlank(request.getTitle())
        || isBlank(request.getCity())
        || isBlank(request.getAddress())
        || isBlank(request.getDescription())
        || isBlank(request.getHousingType())
        || request.getGuestCapacity() == null
        || request.getGuestCapacity() < 1) {

      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Please complete all required home details");
    }

    Home home = new Home();

    home.setOwner(owner);
    home.setTitle(request.getTitle().trim());
    home.setCity(request.getCity().trim());
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

    HomeResponse response = new HomeResponse();

    response.setId(savedHome.getId());
    response.setOwnerId(owner.getId());
    response.setTitle(savedHome.getTitle());
    response.setCity(savedHome.getCity());
    response.setAddress(savedHome.getAddress());
    response.setDescription(savedHome.getDescription());
    response.setHousingType(savedHome.getHousingType());
    response.setGuestCapacity(savedHome.getGuestCapacity());
    response.setAmenities(savedHome.getAmenities());
    response.setCreatedAt(savedHome.getCreatedAt());

    return response;
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
      HomeResponse response = new HomeResponse();

      response.setId(home.getId());
      response.setOwnerId(home.getOwner().getId());
      response.setTitle(home.getTitle());
      response.setCity(home.getCity());
      response.setAddress(home.getAddress());
      response.setDescription(home.getDescription());
      response.setHousingType(home.getHousingType());
      response.setGuestCapacity(home.getGuestCapacity());
      response.setAmenities(home.getAmenities());
      response.setCreatedAt(home.getCreatedAt());

      responses.add(response);
    }

    return responses;
  }

  @Transactional
  public HomeResponse updateHome(Long homeId, CreateHomeRequest request) {

    Home home = getOwnedHome(homeId);

    if (request == null
        || isBlank(request.getTitle())
        || isBlank(request.getCity())
        || isBlank(request.getAddress())
        || isBlank(request.getDescription())
        || isBlank(request.getHousingType())
        || request.getGuestCapacity() == null
        || request.getGuestCapacity() < 1) {

      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Please complete all required home details");
    }

    home.setTitle(request.getTitle().trim());
    home.setCity(request.getCity().trim());
    home.setAddress(request.getAddress().trim());
    home.setDescription(request.getDescription().trim());
    home.setHousingType(request.getHousingType().trim());
    home.setGuestCapacity(request.getGuestCapacity());

    home.setAmenities(
        request.getAmenities() != null
            ? new ArrayList<>(request.getAmenities())
            : new ArrayList<>());

    Home savedHome = homeRepository.save(home);

    HomeResponse response = new HomeResponse();

    response.setId(savedHome.getId());
    response.setOwnerId(savedHome.getOwner().getId());
    response.setTitle(savedHome.getTitle());
    response.setCity(savedHome.getCity());
    response.setAddress(savedHome.getAddress());
    response.setDescription(savedHome.getDescription());
    response.setHousingType(savedHome.getHousingType());
    response.setGuestCapacity(savedHome.getGuestCapacity());
    response.setAmenities(savedHome.getAmenities());
    response.setCreatedAt(savedHome.getCreatedAt());

    return response;
  }

  @Transactional
  public void deleteHome(Long homeId) {

    Home home = getOwnedHome(homeId);

    homePhotoService.scheduleHomePhotoCleanup(homeId);

    homeRepository.delete(home);
  }

  private Home getOwnedHome(Long homeId) {

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
    Home home =
        homeRepository
            .findById(homeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    boolean isOwner =
        auth != null
            && auth.getPrincipal() instanceof UserPrincipal principal
            && home.getOwner().getId().equals(principal.getId());

    HomeResponse response = new HomeResponse();
    response.setId(home.getId());
    response.setOwnerId(home.getOwner().getId());
    response.setTitle(home.getTitle());
    response.setCity(home.getCity());
    response.setAddress(isOwner ? home.getAddress() : null);
    response.setDescription(home.getDescription());
    response.setHousingType(home.getHousingType());
    response.setGuestCapacity(home.getGuestCapacity());
    response.setAmenities(home.getAmenities());
    response.setCreatedAt(home.getCreatedAt());

    return response;
  }
}
