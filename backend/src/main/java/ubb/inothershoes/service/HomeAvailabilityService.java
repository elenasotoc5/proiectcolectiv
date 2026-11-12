package ubb.inothershoes.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;

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

  public void validateAvailability(
      Long homeId,
      LocalDate startDate,
      LocalDate endDate) {

    if (startDate == null || endDate == null) {
      throw new IllegalArgumentException("Start date and end date are required.");
    }

    if (!endDate.isAfter(startDate)) {
      throw new IllegalArgumentException(
          "End date must be after start date.");
    }

    if (!homeRepository.existsById(homeId)) {
      throw new IllegalArgumentException("Home does not exist.");
    }

    List<HomeAvailability> overlappingPeriods =
        homeAvailabilityRepository.findOverlappingPeriods(
            homeId, startDate, endDate);

    if (!overlappingPeriods.isEmpty()) {
      throw new IllegalArgumentException(
          "Availability period overlaps with an existing period.");
    }
  }
}