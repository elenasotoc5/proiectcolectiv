
package ubb.inothershoes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ubb.inothershoes.entity.HomePhoto;

import java.util.List;

public interface HomePhotoRepository
        extends JpaRepository<HomePhoto, Long> {

    List<HomePhoto> findByHomeIdOrderByDisplayOrderAscIdAsc(
            Long homeId
    );

    long countByHomeId(Long homeId);
}
