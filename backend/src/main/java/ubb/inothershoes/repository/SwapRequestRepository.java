package ubb.inothershoes.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.SwapRequest;
import ubb.inothershoes.entity.SwapRequestStatus;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

    List<SwapRequest> findByRequesterHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    List<SwapRequest> findByTargetHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

    boolean existsByRequesterHome_IdAndTargetHome_IdAndStatus(
            Long requesterHomeId, Long targetHomeId, SwapRequestStatus status);

    long countByRequesterHome_Owner_IdAndStatus(Long ownerId, SwapRequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM SwapRequest r WHERE r.id = :requestId")
    Optional<SwapRequest> findByIdForUpdate(@Param("requestId") Long requestId);

    @Query("""
      SELECT COUNT(r) > 0 FROM SwapRequest r
      WHERE r.status = :status
      AND (r.requesterHome.id IN :homeIds OR r.targetHome.id IN :homeIds)
      AND r.startDate <= :endDate
      AND r.endDate >= :startDate
      """)
    boolean existsConflictingAcceptedSwap(
            @Param("homeIds") List<Long> homeIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") SwapRequestStatus status);
}
