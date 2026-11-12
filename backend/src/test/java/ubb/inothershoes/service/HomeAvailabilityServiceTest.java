
package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;

@ExtendWith(MockitoExtension.class)
class HomeAvailabilityServiceTest {

  @Mock
  private HomeAvailabilityRepository homeAvailabilityRepository;

  @Mock
  private HomeRepository homeRepository;

  @InjectMocks
  private HomeAvailabilityService homeAvailabilityService;

  private final LocalDate startDate = LocalDate.of(2027, 7, 10);
  private final LocalDate endDate = LocalDate.of(2027, 7, 20);

  @Test
  void validateAvailability_shouldSucceed_whenPeriodIsValid() {
    when(homeRepository.existsById(1L)).thenReturn(true);
    when(homeAvailabilityRepository.findOverlappingPeriods(
        1L, startDate, endDate)).thenReturn(List.of());

    assertDoesNotThrow(() ->
        homeAvailabilityService.validateAvailability(1L, startDate, endDate));
  }

  @Test
  void validateAvailability_shouldThrowException_whenStartDateIsNull() {
    assertThrows(IllegalArgumentException.class, () ->
        homeAvailabilityService.validateAvailability(1L, null, endDate));

    verifyNoInteractions(homeRepository, homeAvailabilityRepository);
  }

  @Test
  void validateAvailability_shouldThrowException_whenEndDateIsNull() {
    assertThrows(IllegalArgumentException.class, () ->
        homeAvailabilityService.validateAvailability(1L, startDate, null));

    verifyNoInteractions(homeRepository, homeAvailabilityRepository);
  }

  @Test
  void validateAvailability_shouldThrowException_whenEndDateIsBeforeStartDate() {
    LocalDate invalidEndDate = LocalDate.of(2027, 7, 5);

    assertThrows(IllegalArgumentException.class, () ->
        homeAvailabilityService.validateAvailability(
            1L, startDate, invalidEndDate));

    verifyNoInteractions(homeRepository, homeAvailabilityRepository);
  }

  @Test
  void validateAvailability_shouldThrowException_whenHomeDoesNotExist() {
    when(homeRepository.existsById(1L)).thenReturn(false);

    assertThrows(IllegalArgumentException.class, () ->
        homeAvailabilityService.validateAvailability(1L, startDate, endDate));

    verifyNoInteractions(homeAvailabilityRepository);
  }

  @Test
  void validateAvailability_shouldThrowException_whenPeriodOverlaps() {
    when(homeRepository.existsById(1L)).thenReturn(true);
    when(homeAvailabilityRepository.findOverlappingPeriods(
        1L, startDate, endDate))
        .thenReturn(List.of(new HomeAvailability()));

    assertThrows(IllegalArgumentException.class, () ->
        homeAvailabilityService.validateAvailability(1L, startDate, endDate));
  }
}
