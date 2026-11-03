package ubb.inothershoes.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Activity;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.model.ActivityDto;
import ubb.inothershoes.model.UserProfileRequest;
import ubb.inothershoes.model.UserProfileResponse;
import ubb.inothershoes.repository.UserRepository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + userId));
        return toResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + userId));

        if (request.getPreferences() == null || request.getPreferences().size() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please add at least 3 preferences for matching.");
        }

        if (request.getActivities() == null || request.getActivities().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide at least 1 host activity for the swap partner.");
        }

        user.setBio(request.getBio());
        user.setOccupation(request.getOccupation());
        user.setUniversity(request.getUniversity());
        user.setFieldOfStudy(request.getFieldOfStudy());
        user.setStudyYear(request.getStudyYear());
        user.setLocation(request.getLocation());
        user.setHousingType(request.getHousingType());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setPreferences(new LinkedHashSet<>(request.getPreferences()));
        user.setUpdatedAt(OffsetDateTime.now());

        user.getActivities().clear();
        for (ActivityDto dto : request.getActivities()) {
            if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
                user.getActivities().add(new Activity(
                        user,
                        dto.getTitle().trim(),
                        dto.getDescription() != null ? dto.getDescription().trim() : "",
                        dto.getCategory() != null ? dto.getCategory().trim() : "General"
                ));
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
        res.setEmail(user.getEmail());
        res.setBio(user.getBio());
        res.setOccupation(user.getOccupation());
        res.setUniversity(user.getUniversity());
        res.setFieldOfStudy(user.getFieldOfStudy());
        res.setStudyYear(user.getStudyYear());
        res.setLocation(user.getLocation());
        res.setHousingType(user.getHousingType());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setPreferences(new ArrayList<>(user.getPreferences()));

        List<ActivityDto> activityDtos = user.getActivities().stream().map(a -> {
            ActivityDto dto = new ActivityDto();
            dto.setId(a.getId());
            dto.setTitle(a.getTitle());
            dto.setDescription(a.getDescription());
            dto.setCategory(a.getCategory());
            return dto;
        }).collect(Collectors.toList());
        res.setActivities(activityDtos);

        return res;
    }
}
