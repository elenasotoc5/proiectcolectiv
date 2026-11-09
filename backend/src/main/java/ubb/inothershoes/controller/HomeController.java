
package ubb.inothershoes.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import ubb.inothershoes.api.HomesApi;
import ubb.inothershoes.model.CreateHomeRequest;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.service.HomeService;

@RestController
public class HomeController implements HomesApi {

    private final HomeService homeService;

    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    @Override
    public ResponseEntity<HomeResponse> createHome(
            @Valid CreateHomeRequest createHomeRequest) {

        HomeResponse response = homeService.createHome(createHomeRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @Override
    public ResponseEntity<List<HomeResponse>> getMyHomes() {

        List<HomeResponse> homes = homeService.getMyHomes();

        return ResponseEntity.ok(homes);
    }

}
