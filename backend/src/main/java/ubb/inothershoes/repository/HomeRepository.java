package ubb.inothershoes.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.Home;

public interface HomeRepository extends JpaRepository<Home, Long> {

  List<Home> findByOwnerId(Long ownerId);
}
