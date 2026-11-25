package ubb.inothershoes.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeLike;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.repository.HomeLikeRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class HomeLikeService {
    private final HomeLikeRepository homeLikeRepository;
    private final HomeRepository homeRepository;
    private final UserRepository userRepository;
    private final HomeService homeService;

    public HomeLikeService(HomeLikeRepository homeLikeRepository, HomeRepository homeRepository,
                           UserRepository userRepository, HomeService homeService) {
        this.homeLikeRepository = homeLikeRepository;
        this.homeRepository = homeRepository;
        this.userRepository = userRepository;
        this.homeService = homeService;
    }

    private Long authenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)
                || principal.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.getId();
    }

    @Transactional
    public boolean likeHome(Long homeId) {
        Long userId = authenticatedUserId();
        Home home = homeRepository.findById(homeId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));
        if (home.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot like your own home");
        }
        if (homeLikeRepository.findByUser_IdAndHome_Id(userId, homeId).isPresent()) {
            return false;
        }
        HomeLike like = new HomeLike();
        like.setUser(userRepository.getReferenceById(userId));
        like.setHome(home);
        homeLikeRepository.save(like);
        return true;
    }

    @Transactional
    public void unlikeHome(Long homeId) {
        Long userId = authenticatedUserId();
        homeLikeRepository.findByUser_IdAndHome_Id(userId, homeId)
                .ifPresent(homeLikeRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<HomeResponse> getMyLikedHomes() {
        Long userId = authenticatedUserId();
        List<HomeResponse> homes = new ArrayList<>();
        for (HomeLike like : homeLikeRepository.findByUser_IdOrderByIdDesc(userId)) {
            homes.add(homeService.getHomeById(like.getHome().getId()));
        }
        return homes;
    }
}
