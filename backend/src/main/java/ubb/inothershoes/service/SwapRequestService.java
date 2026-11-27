package ubb.inothershoes.service;

import java.time.LocalDate;
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

  /** Maximum number of PENDING requests a user can have sent at the same time. */
  static final int MAX_PENDING_REQUESTS = 10;

  private final SwapRequestRepository swapRequestRepository;
  private final HomeRepository homeRepository;
  private final HomeAvailabilityRepository availabilityRepository;
  private final HomeService homeService;

  public SwapRequestService(
      SwapRequestRepository swapRequestRepository,
      HomeRepository homeRepository,
      HomeAvailabilityRepository availabilityRepository,
      HomeService homeService) {
    this.swapRequestRepository = swapRequestRepository;
    this.homeRepository = homeRepository;
    this.availabilityRepository = availabilityRepository;
    this.homeService = homeService;
  }

  @Transactional(readOnly = true)
  public List<SwapRequestResponse> getSentSwapRequests() {
    Long userId = authenticatedUserId();
    return swapRequestRepository.findByRequesterHome_Owner_IdOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<SwapRequestResponse> getReceivedSwapRequests() {
    Long userId = authenticatedUserId();
    return swapRequestRepository.findByTargetHome_Owner_IdOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  /** Returns 404 for non-participants too, so the request's existence is not revealed. */
  @Transactional(readOnly = true)
  public SwapRequestResponse getSwapRequestById(Long swapRequestId) {
    Long userId = authenticatedUserId();
    return swapRequestRepository
        .findById(swapRequestId)
        .filter(
            r ->
                r.getRequesterHome().getOwner().getId().equals(userId)
                    || r.getTargetHome().getOwner().getId().equals(userId))
        .map(this::toResponse)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Swap request not found"));
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
    if (swapRequestRepository.existsByRequesterHome_IdAndTargetHome_IdAndStatus(
        requesterHome.getId(), targetHome.getId(), SwapRequestStatus.PENDING)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "You already have a pending request for this home");
    }
    if (swapRequestRepository.countByRequesterHome_Owner_IdAndStatus(
            userId, SwapRequestStatus.PENDING)
        >= MAX_PENDING_REQUESTS) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "You can have at most " + MAX_PENDING_REQUESTS + " pending swap requests at a time");
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
        .requesterHome(homeService.getHomeById(swapRequest.getRequesterHome().getId()))
        .targetHome(homeService.getHomeById(swapRequest.getTargetHome().getId()))
        .startDate(swapRequest.getStartDate())
        .endDate(swapRequest.getEndDate())
        .status(SwapRequestResponse.StatusEnum.fromValue(swapRequest.getStatus().name()))
        .createdAt(swapRequest.getCreatedAt());
  }
}
