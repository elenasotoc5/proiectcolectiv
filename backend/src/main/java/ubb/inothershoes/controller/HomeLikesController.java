package ubb.inothershoes.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.HomeLikesApi;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.service.HomeLikeService;

@RestController
public class HomeLikesController implements HomeLikesApi {
  private final HomeLikeService homeLikeService;

  public HomeLikesController(HomeLikeService homeLikeService) {
    this.homeLikeService = homeLikeService;
  }

  @Override
  public ResponseEntity<List<HomeResponse>> getLikedHomes() {
    return ResponseEntity.ok(homeLikeService.getMyLikedHomes());
  }

  @Override
  public ResponseEntity<Void> likeHome(Long homeId) {
    return homeLikeService.likeHome(homeId)
        ? ResponseEntity.status(HttpStatus.CREATED).build()
        : ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<Void> unlikeHome(Long homeId) {
    homeLikeService.unlikeHome(homeId);
    return ResponseEntity.noContent().build();
  }
}
