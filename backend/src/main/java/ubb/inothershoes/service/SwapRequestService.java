package ubb.inothershoes.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.entity.SwapRequest;
import ubb.inothershoes.entity.SwapRequestStatus;
import ubb.inothershoes.model.CreateSwapRequestRequest;
import ubb.inothershoes.model.SwapRequestResponse;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.SwapRequestRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class SwapRequestService {

  private final SwapRequestRepository swapRequestRepository;
  private final HomeRepository homeRepository;
  private final HomeAvailabilityRepository availabilityRepository;

  public SwapRequestService(
      SwapRequestRepository swapRequestRepository,
      HomeRepository homeRepository,
      HomeAvailabilityRepository availabilityRepository) {
    this.swapRequestRepository = swapRequestRepository;
    this.homeRepository = homeRepository;
    this.availabilityRepository = availabilityRepository;
  }

  @Transactional
  public SwapRequestResponse createSwapRequest(CreateSwapRequestRequest request) {
    Long userId = authenticatedUserId();
    LocalDate startDate = request.getStartDate();
    LocalDate endDate = startDate.plusDays(SwapRequest.SWAP_DAYS - 1L);

    if (startDate.isBefore(LocalDate.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date cannot be in the past");
    }

    Home requesterHome = findHome(request.getRequesterHomeId());
    Home targetHome = findHome(request.getTargetHomeId());

    if (!requesterHome.getOwner().getId().equals(userId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "You can only offer a home that you own");
    }
    if (targetHome.getOwner().getId().equals(userId)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "You cannot request a swap with your own home");
    }
    if (!isAvailable(requesterHome.getId(), startDate, endDate)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Your home is not available for the selected period");
    }
    if (!isAvailable(targetHome.getId(), startDate, endDate)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "The requested home is not available for the selected period");
    }
    if (swapRequestRepository.existsByRequesterHome_IdAndTargetHome_IdAndStartDateAndStatus(
        requesterHome.getId(), targetHome.getId(), startDate, SwapRequestStatus.PENDING)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "A pending request for this swap already exists");
    }

    SwapRequest swapRequest = new SwapRequest();
    swapRequest.setRequesterHome(requesterHome);
    swapRequest.setTargetHome(targetHome);
    swapRequest.setStartDate(startDate);
    swapRequest.setEndDate(endDate);
    swapRequest.setStatus(SwapRequestStatus.PENDING);

    return toResponse(swapRequestRepository.save(swapRequest));
  }

  /** A home is available if a single availability period covers the whole range. */
  private boolean isAvailable(Long homeId, LocalDate startDate, LocalDate endDate) {
    List<HomeAvailability> periods = availabilityRepository.findByHome_IdOrderByStartDateAsc(homeId);
    return periods.stream()
        .anyMatch(p -> !p.getStartDate().isAfter(startDate) && !p.getEndDate().isBefore(endDate));
  }

  private Home findHome(Long homeId) {
    return homeRepository
        .findById(homeId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));
  }

  private Long authenticatedUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null
        || !(auth.getPrincipal() instanceof UserPrincipal principal)
        || principal.getId() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return principal.getId();
  }

  private SwapRequestResponse toResponse(SwapRequest swapRequest) {
    return new SwapRequestResponse()
        .id(swapRequest.getId())
        .requesterHomeId(swapRequest.getRequesterHome().getId())
        .targetHomeId(swapRequest.getTargetHome().getId())
        .startDate(swapRequest.getStartDate())
        .endDate(swapRequest.getEndDate())
        .status(SwapRequestResponse.StatusEnum.fromValue(swapRequest.getStatus().name()))
        .createdAt(
            swapRequest.getCreatedAt() == null
                ? null
                : swapRequest.getCreatedAt().atOffset(ZoneOffset.UTC));
  }
}
