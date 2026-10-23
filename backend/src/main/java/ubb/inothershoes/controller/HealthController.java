package ubb.inothershoes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.HealthApi;
import ubb.inothershoes.model.HealthResponse;

@RestController
public class HealthController implements HealthApi {

    @Override
    public ResponseEntity<HealthResponse> health() {
        HealthResponse response = new HealthResponse();
        response.setStatus("UP");
        return ResponseEntity.ok(response);
    }
}