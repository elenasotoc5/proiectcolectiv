package ubb.inothershoes.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import ubb.inothershoes.model.CountyResponse;
import ubb.inothershoes.service.CountyService;

@ExtendWith(MockitoExtension.class)
public class CountyControllerTest {

  @Mock private CountyService countyService;

  @InjectMocks private CountyController countyController;

  @Test
  void testGetCounties() {
    CountyResponse c1 = new CountyResponse();
    c1.setId("CJ");
    c1.setName("Cluj");

    CountyResponse c2 = new CountyResponse();
    c2.setId("B");
    c2.setName("București");

    when(countyService.getAllCounties()).thenReturn(List.of(c1, c2));

    ResponseEntity<List<CountyResponse>> response = countyController.getCounties();
    assertEquals(200, response.getStatusCode().value());
    assertEquals(2, response.getBody().size());
    assertEquals("CJ", response.getBody().get(0).getId());
  }
}
