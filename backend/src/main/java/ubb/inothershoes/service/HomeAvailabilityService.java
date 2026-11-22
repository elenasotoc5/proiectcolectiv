
package ubb.inothershoes.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.model.CreateHomeAvailabilityRequest;
import ubb.inothershoes.model.HomeAvailabilityResponse;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class HomeAvailabilityService {

  private final HomeAvailabilityRepository homeAvailabilityRepository;
  private final HomeRepository homeRepository;

  public HomeAvailabilityService(
      HomeAvailabilityRepository homeAvailabilityRepository,
      HomeRepository homeRepository) {
    this.homeAvailabilityRepository = homeAvailabilityRepository;
    this.homeRepository = homeRepository;
  }

  @Transactional(readOnly = true)
  public List<HomeAvailabilityResponse> getHomeAvailability(Long homeId) {

    if (!homeRepository.existsById(homeId)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND, "Home not found.");
    }

    List<HomeAvailability> availabilities =
        homeAvailabilityRepository.findByHome_IdOrderByStartDateAsc(homeId);

    List<HomeAvailabilityResponse> responses = new ArrayList<>();

    for (HomeAvailability availability : availabilities) {
      responses.add(toResponse(availability));
    }

    return responses;
  }

  @Transactional
  public HomeAvailabilityResponse createHomeAvailability(
      Long homeId,
      CreateHomeAvailabilityRequest request) {

    Home home = getOwnedHome(homeId);

    validateDates(request.getStartDate(), request.getEndDate());
    validateNoOverlap(
        homeId, request.getStartDate(), request.getEndDate());

    HomeAvailability availability = new HomeAvailability();
    availability.setHome(home);
    availability.setStartDate(request.getStartDate());
    availability.setEndDate(request.getEndDate());

    HomeAvailability saved =
        homeAvailabilityRepository.save(availability);

    return toResponse(saved);
  }

  @Transactional
  public HomeAvailabilityResponse updateHomeAvailability(
      Long homeId,
      Long availabilityId,
      CreateHomeAvailabilityRequest request) {

    getOwnedHome(homeId);

    validateDates(request.getStartDate(), request.getEndDate());

    HomeAvailability availability =
        getAvailability(homeId, availabilityId);

    List<HomeAvailability> overlappingPeriods =
        homeAvailabilityRepository.findOverlappingPeriodsForUpdate(
            homeId,
            availabilityId,
            request.getStartDate(),
            request.getEndDate());

    if (!overlappingPeriods.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Availability period overlaps with an existing period.");
    }

    availability.setStartDate(request.getStartDate());
    availability.setEndDate(request.getEndDate());

    HomeAvailability updated =
        homeAvailabilityRepository.save(availability);

    return toResponse(updated);
  }

  @Transactional
  public void deleteHomeAvailability(Long homeId, Long availabilityId) {

    getOwnedHome(homeId);

    HomeAvailability availability =
        getAvailability(homeId, availabilityId);

    homeAvailabilityRepository.delete(availability);
  }

  private Home getOwnedHome(Long homeId) {

    Authentication authentication =
        SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null
        || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "Authentication required.");
    }

    Home home = homeRepository.findById(homeId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Home not found."));

    if (!home.getOwner().getId().equals(principal.getId())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "You are not authorized to modify this home.");
    }

    return home;
  }

  private HomeAvailability getAvailability(
      Long homeId, Long availabilityId) {

    HomeAvailability availability =
        homeAvailabilityRepository.findById(availabilityId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Availability not found."));

    if (!availability.getHome().getId().equals(homeId)) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND, "Availability not found for this home.");
    }

    return availability;
  }

  private void validateDates(LocalDate startDate, LocalDate endDate) {

    if (startDate == null || endDate == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Start date and end date are required.");
    }

    if (!endDate.isAfter(startDate)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "End date must be after start date.");
    }
  }

  private void validateNoOverlap(
      Long homeId, LocalDate startDate, LocalDate endDate) {

    List<HomeAvailability> overlappingPeriods =
        homeAvailabilityRepository.findOverlappingPeriods(
            homeId, startDate, endDate);

    if (!overlappingPeriods.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Availability period overlaps with an existing period.");
    }
  }

  private HomeAvailabilityResponse toResponse(
      HomeAvailability availability) {

    HomeAvailabilityResponse response = new HomeAvailabilityResponse();

    response.setId(availability.getId());
    response.setHomeId(availability.getHome().getId());
    response.setStartDate(availability.getStartDate());
    response.setEndDate(availability.getEndDate());

    return response;
  }
}
