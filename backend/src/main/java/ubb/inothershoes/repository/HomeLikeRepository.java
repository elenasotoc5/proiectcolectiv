package ubb.inothershoes.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.HomeLike;

public interface HomeLikeRepository extends JpaRepository<HomeLike, Long> {
    List<HomeLike> findByUser_IdOrderByIdDesc(Long userId);
    Optional<HomeLike> findByUser_IdAndHome_Id(Long userId, Long homeId);
}
