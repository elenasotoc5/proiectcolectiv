
package ubb.inothershoes.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ubb.inothershoes.entity.HomeAvailability;

public interface HomeAvailabilityRepository
    extends JpaRepository<HomeAvailability, Long> {

  List<HomeAvailability> findByHome_IdOrderByStartDateAsc(Long homeId);

  @Query("""
      SELECT ha
      FROM HomeAvailability ha
      WHERE ha.home.id = :homeId
      AND ha.startDate <= :endDate
      AND ha.endDate >= :startDate
      """)
  List<HomeAvailability> findOverlappingPeriods(
      @Param("homeId") Long homeId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  @Query("""
      SELECT ha
      FROM HomeAvailability ha
      WHERE ha.home.id = :homeId
      AND ha.id <> :availabilityId
      AND ha.startDate <= :endDate
      AND ha.endDate >= :startDate
      """)
  List<HomeAvailability> findOverlappingPeriodsForUpdate(
      @Param("homeId") Long homeId,
      @Param("availabilityId") Long availabilityId,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);
}
