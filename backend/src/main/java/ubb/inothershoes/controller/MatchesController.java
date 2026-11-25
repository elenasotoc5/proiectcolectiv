package ubb.inothershoes.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.dto.MatchResponse;
import ubb.inothershoes.service.MatchingService;

@RestController
@RequestMapping("/api/v1/matches")
public class MatchesController {
    private final MatchingService matchingService;

    public MatchesController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping
    public ResponseEntity<List<MatchResponse>> getMatches() {
        return ResponseEntity.ok(matchingService.findMatches());
    }
}
