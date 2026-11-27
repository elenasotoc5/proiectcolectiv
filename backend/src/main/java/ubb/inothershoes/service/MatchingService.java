package ubb.inothershoes.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.model.MatchResponse;
import ubb.inothershoes.model.SwapPeriod;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomeAvailability;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.repository.HomeAvailabilityRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.repository.UserRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class MatchingService {
    private static final int SWAP_DAYS = 7;

    private final HomeRepository homeRepository;
    private final HomeAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    public MatchingService(
            HomeRepository homeRepository,
            HomeAvailabilityRepository availabilityRepository,
            UserRepository userRepository) {
        this.homeRepository = homeRepository;
        this.availabilityRepository = availabilityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> findMatches() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        List<Home> ownedHomes = homeRepository.findByOwnerId(currentUser.getId());
        if (ownedHomes.isEmpty()) {
            return List.of();
        }

        Home myHome = ownedHomes.get(0);
        Set<String> preferredDestinations = currentUser.getPreferredCounties();
        if (preferredDestinations == null || preferredDestinations.isEmpty()) {
            return List.of();
        }

        List<HomeAvailability> myAvailability =
                availabilityRepository.findByHome_IdOrderByStartDateAsc(myHome.getId());
        if (myAvailability.isEmpty()) {
            return List.of();
        }

        List<MatchResponse> matches = new ArrayList<>();
        for (Home candidate : homeRepository.findAll()) {
            if (candidate.getOwner().getId().equals(currentUser.getId())) {
                continue;
            }
            if (!containsCounty(preferredDestinations, candidate.getCounty())) {
                continue;
            }
            if (!containsCounty(candidate.getOwner().getPreferredCounties(), myHome.getCounty())) {
                continue;
            }

            List<HomeAvailability> theirAvailability =
                    availabilityRepository.findByHome_IdOrderByStartDateAsc(candidate.getId());
            List<SwapPeriod> possiblePeriods =
                    overlappingSevenDayWindows(myAvailability, theirAvailability);
            if (possiblePeriods.isEmpty()) {
                continue;
            }

            matches.add(new MatchResponse()
                    .homeId(candidate.getId())
                    .ownerId(candidate.getOwner().getId())
                    .title(candidate.getTitle())
                    .city(candidate.getCity())
                    .county(candidate.getCounty())
                    .housingType(candidate.getHousingType())
                    .guestCapacity(candidate.getGuestCapacity())
                    .possibleSwapPeriods(possiblePeriods));
        }
        return matches;
    }

    private static boolean containsCounty(Set<String> counties, String county) {
        if (counties == null || county == null) {
            return false;
        }
        String normalizedCounty = county.trim().toUpperCase(Locale.ROOT);
        return counties.stream()
                .filter(value -> value != null)
                .anyMatch(value -> value.trim().toUpperCase(Locale.ROOT).equals(normalizedCounty));
    }

    static List<SwapPeriod> overlappingSevenDayWindows(
            List<HomeAvailability> first, List<HomeAvailability> second) {
        LocalDate today = LocalDate.now();
        Set<LocalDate> starts = new TreeSet<>();

        for (HomeAvailability a : first) {
            for (HomeAvailability b : second) {
                LocalDate start = a.getStartDate().isAfter(b.getStartDate())
                        ? a.getStartDate() : b.getStartDate();
                if (start.isBefore(today)) {
                    start = today;
                }
                LocalDate end = a.getEndDate().isBefore(b.getEndDate())
                        ? a.getEndDate() : b.getEndDate();

                LocalDate lastPossibleStart = end.minusDays(SWAP_DAYS - 1L);
                for (LocalDate day = start; !day.isAfter(lastPossibleStart); day = day.plusDays(1)) {
                    starts.add(day);
                }
            }
        }

        return starts.stream()
                .map(start -> new SwapPeriod().startDate(start).endDate(start.plusDays(SWAP_DAYS - 1L)))
                .toList();
    }
}
