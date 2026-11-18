package ubb.inothershoes.service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ubb.inothershoes.entity.County;
import ubb.inothershoes.model.CountyResponse;
import ubb.inothershoes.repository.CountyRepository;

@Service
public class CountyService {

  private static final Logger log = LoggerFactory.getLogger(CountyService.class);

  private static final List<CountyResponse> CANONICAL_COUNTIES =
      List.of(
          createResponse("AB", "Alba"),
          createResponse("AR", "Arad"),
          createResponse("AG", "Argeș"),
          createResponse("BC", "Bacău"),
          createResponse("BH", "Bihor"),
          createResponse("BN", "Bistrița-Năsăud"),
          createResponse("BT", "Botoșani"),
          createResponse("BV", "Brașov"),
          createResponse("BR", "Brăila"),
          createResponse("B", "București"),
          createResponse("BZ", "Buzău"),
          createResponse("CL", "Călărași"),
          createResponse("CS", "Caraș-Severin"),
          createResponse("CJ", "Cluj"),
          createResponse("CT", "Constanța"),
          createResponse("CV", "Covasna"),
          createResponse("DB", "Dâmbovița"),
          createResponse("DJ", "Dolj"),
          createResponse("GL", "Galați"),
          createResponse("GR", "Giurgiu"),
          createResponse("GJ", "Gorj"),
          createResponse("HR", "Harghita"),
          createResponse("HD", "Hunedoara"),
          createResponse("IL", "Ialomița"),
          createResponse("IS", "Iași"),
          createResponse("IF", "Ilfov"),
          createResponse("MM", "Maramureș"),
          createResponse("MH", "Mehedinți"),
          createResponse("MS", "Mureș"),
          createResponse("NT", "Neamț"),
          createResponse("OT", "Olt"),
          createResponse("PH", "Prahova"),
          createResponse("SM", "Satu Mare"),
          createResponse("SJ", "Sălaj"),
          createResponse("SB", "Sibiu"),
          createResponse("SV", "Suceava"),
          createResponse("TR", "Teleorman"),
          createResponse("TM", "Timiș"),
          createResponse("TL", "Tulcea"),
          createResponse("VS", "Vaslui"),
          createResponse("VL", "Vâlcea"),
          createResponse("VN", "Vrancea"));

  private final CountyRepository countyRepository;
  private final Map<String, CountyResponse> cacheByCode = new ConcurrentHashMap<>();
  private final List<CountyResponse> cachedList = new CopyOnWriteArrayList<>();

  public CountyService(CountyRepository countyRepository) {
    this.countyRepository = countyRepository;
  }

  @PostConstruct
  public void init() {
    refreshCache();
  }

  public synchronized void refreshCache() {
    cacheByCode.clear();
    cachedList.clear();

    try {
      List<County> entities = countyRepository.findAllByOrderByNameAsc();
      if (!entities.isEmpty()) {
        for (County entity : entities) {
          CountyResponse dto = createResponse(entity.getCode(), entity.getName());
          cacheByCode.put(dto.getId().toUpperCase(), dto);
          cachedList.add(dto);
        }
        log.info("Loaded {} Romanian counties from database cache", cachedList.size());
        return;
      }
    } catch (Exception e) {
      log.warn(
          "Could not load counties from database: {}. Using canonical fallback.", e.getMessage());
    }

    for (CountyResponse dto : CANONICAL_COUNTIES) {
      cacheByCode.put(dto.getId().toUpperCase(), dto);
      cachedList.add(dto);
    }
    log.info("Initialized {} Romanian counties from canonical fallback", cachedList.size());
  }

  public List<CountyResponse> getAllCounties() {
    return Collections.unmodifiableList(cachedList);
  }

  public boolean isValidCountyCode(String code) {
    if (code == null || code.trim().isEmpty()) {
      return false;
    }
    return cacheByCode.containsKey(code.trim().toUpperCase());
  }

  public Optional<CountyResponse> getCountyByCode(String code) {
    if (code == null) {
      return Optional.empty();
    }
    return Optional.ofNullable(cacheByCode.get(code.trim().toUpperCase()));
  }

  private static CountyResponse createResponse(String id, String name) {
    CountyResponse response = new CountyResponse();
    response.setId(id);
    response.setName(name);
    return response;
  }
}
