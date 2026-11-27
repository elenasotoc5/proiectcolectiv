package ubb.inothershoes.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ubb.inothershoes.api.SwapRequestsApi;
import ubb.inothershoes.model.CreateSwapRequestRequest;
import ubb.inothershoes.model.SwapRequestResponse;
import ubb.inothershoes.service.SwapRequestService;

@RestController
public class SwapRequestController implements SwapRequestsApi {

  private final SwapRequestService swapRequestService;

  public SwapRequestController(SwapRequestService swapRequestService) {
    this.swapRequestService = swapRequestService;
  }

  @Override
  public ResponseEntity<SwapRequestResponse> createSwapRequest(
      @Valid CreateSwapRequestRequest createSwapRequestRequest) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(swapRequestService.createSwapRequest(createSwapRequestRequest));
  }
}
