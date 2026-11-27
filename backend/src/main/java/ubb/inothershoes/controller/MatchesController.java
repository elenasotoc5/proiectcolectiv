package ubb.inothershoes.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.MatchesApi;
import ubb.inothershoes.model.MatchResponse;
import ubb.inothershoes.service.MatchingService;

@RestController
public class MatchesController implements MatchesApi {
  private final MatchingService matchingService;

  public MatchesController(MatchingService matchingService) {
    this.matchingService = matchingService;
  }

  @Override
  public ResponseEntity<List<MatchResponse>> getMatches() {
    return ResponseEntity.ok(matchingService.findMatches());
  }
}
