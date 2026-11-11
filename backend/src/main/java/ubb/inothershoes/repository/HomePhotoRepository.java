package ubb.inothershoes.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.HomePhoto;

public interface HomePhotoRepository extends JpaRepository<HomePhoto, Long> {

  List<HomePhoto> findByHomeIdOrderByDisplayOrderAscIdAsc(Long homeId);

  long countByHomeId(Long homeId);
}
