package ubb.inothershoes.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ubb.inothershoes.entity.County;

@Repository
public interface CountyRepository extends JpaRepository<County, String> {

  List<County> findAllByOrderByNameAsc();
}
