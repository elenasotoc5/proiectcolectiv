package ubb.inothershoes.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.LocationsApi;
import ubb.inothershoes.model.CountyResponse;
import ubb.inothershoes.service.CountyService;

@RestController
public class CountyController implements LocationsApi {

  private final CountyService countyService;

  public CountyController(CountyService countyService) {
    this.countyService = countyService;
  }

  @Override
  public ResponseEntity<List<CountyResponse>> getCounties() {
    List<CountyResponse> counties = countyService.getAllCounties();
    return ResponseEntity.ok(counties);
  }
}
