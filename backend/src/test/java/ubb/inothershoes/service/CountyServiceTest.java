package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ubb.inothershoes.entity.County;
import ubb.inothershoes.model.CountyResponse;
import ubb.inothershoes.repository.CountyRepository;

@ExtendWith(MockitoExtension.class)
public class CountyServiceTest {

  @Mock private CountyRepository countyRepository;

  private CountyService countyService;

  @BeforeEach
  void setUp() {
    countyService = new CountyService(countyRepository);
  }

  @Test
  void testGetAllCountiesFromRepository() {
    County c1 = new County("CJ", "Cluj");
    County c2 = new County("B", "București");
    when(countyRepository.findAllByOrderByNameAsc()).thenReturn(List.of(c2, c1));

    countyService.refreshCache();

    List<CountyResponse> counties = countyService.getAllCounties();
    assertEquals(2, counties.size());
    assertTrue(countyService.isValidCountyCode("CJ"));
    assertTrue(countyService.isValidCountyCode("cj"));
    assertTrue(countyService.isValidCountyCode("B"));
    assertFalse(countyService.isValidCountyCode("UNKNOWN"));
    assertFalse(countyService.isValidCountyCode(null));
    assertFalse(countyService.isValidCountyCode(""));

    Optional<CountyResponse> cjOpt = countyService.getCountyByCode("cj");
    assertTrue(cjOpt.isPresent());
    assertEquals("Cluj", cjOpt.get().getName());
  }

  @Test
  void testCanonicalFallbackWhenRepositoryEmptyOrFails() {
    when(countyRepository.findAllByOrderByNameAsc()).thenReturn(List.of());

    countyService.refreshCache();

    List<CountyResponse> counties = countyService.getAllCounties();
    assertEquals(42, counties.size());
    assertTrue(countyService.isValidCountyCode("CJ"));
    assertTrue(countyService.isValidCountyCode("B"));
    assertTrue(countyService.isValidCountyCode("TM"));
  }

  @Test
  void testGetCountyByCodeNull() {
    Optional<CountyResponse> opt = countyService.getCountyByCode(null);
    assertTrue(opt.isEmpty());
  }
}
