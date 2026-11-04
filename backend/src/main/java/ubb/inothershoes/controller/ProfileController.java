package ubb.inothershoes.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.ProfileApi;
import ubb.inothershoes.model.UserProfileRequest;
import ubb.inothershoes.model.UserProfileResponse;
import ubb.inothershoes.service.ProfileService;

@RestController
public class ProfileController implements ProfileApi {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @Override
    public ResponseEntity<UserProfileResponse> getUserProfile(Long userId) {
        UserProfileResponse response = profileService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<UserProfileResponse> updateUserProfile(Long userId, @Valid UserProfileRequest userProfileRequest) {
        UserProfileResponse response = profileService.updateProfile(userId, userProfileRequest);
        return ResponseEntity.ok(response);
    }
}
