package ubb.inothershoes.controller;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import ubb.inothershoes.model.ErrorResponse;

public class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void handleMaxUploadSize_shouldReturnBadRequest() {
    MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(5000000L);
    ResponseEntity<ErrorResponse> response = handler.handleMaxUploadSize(ex);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals(400, response.getBody().getErrorCode());
    assertTrue(response.getBody().getMessage().contains("maximum allowed limit of 5 MB"));
  }
}
