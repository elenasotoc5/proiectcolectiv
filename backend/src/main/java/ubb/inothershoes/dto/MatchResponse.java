package ubb.inothershoes.dto;

import java.time.LocalDate;
import java.util.List;

public record MatchResponse(
        Long homeId,
        Long ownerId,
        String title,
        String city,
        String county,
        String housingType,
        Integer guestCapacity,
        List<SwapPeriod> possibleSwapPeriods
) {
    public record SwapPeriod(LocalDate startDate, LocalDate endDate) {}
}
