package ubb.inothershoes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.DefaultApi;
import ubb.inothershoes.model.Health200Response;

@RestController
public class HealthController implements DefaultApi {

    @Override
    public ResponseEntity<Health200Response> health() {
        Health200Response response = new Health200Response();
        response.setStatus("UP");
        return ResponseEntity.ok(response);
    }
}