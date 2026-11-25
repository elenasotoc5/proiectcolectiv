package ubb.inothershoes.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.service.HomeLikeService;

@RestController
@RequestMapping("/api/v1/homes")
public class HomeLikesController {
    private final HomeLikeService homeLikeService;

    public HomeLikesController(HomeLikeService homeLikeService) {
        this.homeLikeService = homeLikeService;
    }

    @GetMapping("/liked")
    public ResponseEntity<List<HomeResponse>> getLikedHomes() {
        return ResponseEntity.ok(homeLikeService.getMyLikedHomes());
    }

    @PostMapping("/{homeId}/like")
    public ResponseEntity<Void> likeHome(@PathVariable Long homeId) {
        return homeLikeService.likeHome(homeId)
                ? ResponseEntity.status(HttpStatus.CREATED).build()
                : ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{homeId}/like")
    public ResponseEntity<Void> unlikeHome(@PathVariable Long homeId) {
        homeLikeService.unlikeHome(homeId);
        return ResponseEntity.noContent().build();
    }
}
