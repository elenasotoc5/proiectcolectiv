package ubb.inothershoes.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Activity;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.ActivityDto;
import ubb.inothershoes.model.UserProfileRequest;
import ubb.inothershoes.model.UserProfileResponse;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class ProfileService {

  private final UserRepository userRepository;
  private final HomeRepository homeRepository;
  private final CountyService countyService;

  public ProfileService(
      UserRepository userRepository, HomeRepository homeRepository, CountyService countyService) {
    this.userRepository = userRepository;
    this.homeRepository = homeRepository;
    this.countyService = countyService;
  }

  @Transactional(readOnly = true)
  public UserProfileResponse getProfile(Long userId) {
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
    }

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found with id: " + userId));
    return toResponse(user);
  }

  @Transactional
  public UserProfileResponse updateProfile(Long userId, UserProfileRequest request) {
    if (userId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
    }

    verifyUserOwnership(userId);

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found with id: " + userId));

    if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
      user.setFirstName(request.getFirstName().trim());
    }
    if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
      user.setLastName(request.getLastName().trim());
    }

    if (request.getGender() != null) {
      user.setGender(request.getGender().getValue());
    }

    user.setBio(request.getBio());
    user.setOccupation(request.getOccupation());
    if (request.getLocation() != null) {
      user.setLocation(request.getLocation().trim());
    }
    user.setAvatarUrl(request.getAvatarUrl());
    if (request.getPreferences() != null) {
      user.setPreferences(new LinkedHashSet<>(request.getPreferences()));
    }
    if (request.getPreferredCounties() != null) {
      Set<String> validatedCounties = new LinkedHashSet<>();
      for (String c : request.getPreferredCounties()) {
        if (c == null || c.trim().isEmpty()) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST, "County identifier cannot be blank");
        }
        String normalized = c.trim().toUpperCase();
        if (!countyService.isValidCountyCode(normalized)) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST, "Invalid county identifier in preferences: " + c);
        }
        if (!validatedCounties.add(normalized)) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Duplicate county entries in preferences are not allowed: " + normalized);
        }
      }
      user.setPreferredCounties(validatedCounties);
    }
    user.setUpdatedAt(OffsetDateTime.now());

    if (request.getActivities() != null) {
      user.getActivities().clear();
      for (ActivityDto dto : request.getActivities()) {
        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
          user.getActivities()
              .add(
                  new Activity(
                      user,
                      dto.getTitle().trim(),
                      dto.getDescription() != null ? dto.getDescription().trim() : "",
                      dto.getCategory() != null ? dto.getCategory().trim() : "General"));
        }
      }
    }

    User saved = userRepository.save(user);
    return toResponse(saved);
  }

  private UserProfileResponse toResponse(User user) {
    UserProfileResponse res = new UserProfileResponse();
    res.setUserId(user.getId());
    res.setFirstName(user.getFirstName());
    res.setLastName(user.getLastName());
    if (user.getGender() != null) {
      res.setGender(UserProfileResponse.GenderEnum.fromValue(user.getGender()));
    }
    res.setEmail(user.getEmail());
    res.setBio(user.getBio());
    res.setOccupation(user.getOccupation());
    res.setLocation(user.getLocation());
    res.setAvatarUrl(user.getAvatarUrl());
    res.setPreferences(new ArrayList<>(user.getPreferences()));
    res.setPreferredCounties(new ArrayList<>(user.getPreferredCounties()));

    List<ActivityDto> activityDtos =
        user.getActivities().stream()
            .map(a -> {
              ActivityDto dto = new ActivityDto();
              dto.setId(a.getId());
              dto.setTitle(a.getTitle());
              dto.setDescription(a.getDescription());
              dto.setCategory(a.getCategory());
              return dto;
            })
            .collect(Collectors.toList());
    res.setActivities(activityDtos);
    res.setHasHome(!homeRepository.findByOwnerId(user.getId()).isEmpty());

    return res;
  }

  private void verifyUserOwnership(Long targetUserId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
      if (!principal.getId().equals(targetUserId)) {
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN, "You are not authorized to modify another user's profile.");
      }
    }
  }
}
