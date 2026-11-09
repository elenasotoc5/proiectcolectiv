
package ubb.inothershoes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.Home;

import java.util.List;

public interface HomeRepository extends JpaRepository<Home, Long> {

    List<Home> findByOwnerId(Long ownerId);

}
