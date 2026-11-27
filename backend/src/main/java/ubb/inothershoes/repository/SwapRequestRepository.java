package ubb.inothershoes.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.SwapRequest;
import ubb.inothershoes.entity.SwapRequestStatus;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

  List<SwapRequest> findByRequesterHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

  List<SwapRequest> findByTargetHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

  boolean existsByRequesterHome_IdAndTargetHome_IdAndStartDateAndStatus(
      Long requesterHomeId, Long targetHomeId, LocalDate startDate, SwapRequestStatus status);
}
