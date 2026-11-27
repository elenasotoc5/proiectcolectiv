package ubb.inothershoes.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.SwapRequest;
import ubb.inothershoes.entity.SwapRequestStatus;

public interface SwapRequestRepository extends JpaRepository<SwapRequest, Long> {

  List<SwapRequest> findByRequesterHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

  List<SwapRequest> findByTargetHome_Owner_IdOrderByCreatedAtDesc(Long ownerId);

  boolean existsByRequesterHome_IdAndTargetHome_IdAndStatus(
      Long requesterHomeId, Long targetHomeId, SwapRequestStatus status);

  long countByRequesterHome_Owner_IdAndStatus(Long ownerId, SwapRequestStatus status);
}
