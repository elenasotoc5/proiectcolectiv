package ubb.inothershoes.repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.Home;

public interface HomeRepository extends JpaRepository<Home, Long> {

    List<Home> findByOwnerId(Long ownerId);

    List<Home> findByCountyIgnoreCase(String county);

    List<Home> findByCountyIn(List<String> countyCodes);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Home h WHERE h.id = :homeId")
    Optional<Home> findByIdForUpdate(@Param("homeId") Long homeId);
}