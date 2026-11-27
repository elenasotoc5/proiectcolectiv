package ubb.inothershoes.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "swap_requests")
public class SwapRequest {

  public static final int SWAP_DAYS = 7;

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requester_home_id", nullable = false)
  private Home requesterHome;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "target_home_id", nullable = false)
  private Home targetHome;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "end_date", nullable = false)
  private LocalDate endDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private SwapRequestStatus status = SwapRequestStatus.PENDING;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Home getRequesterHome() {
    return requesterHome;
  }

  public void setRequesterHome(Home requesterHome) {
    this.requesterHome = requesterHome;
  }

  public Home getTargetHome() {
    return targetHome;
  }

  public void setTargetHome(Home targetHome) {
    this.targetHome = targetHome;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public LocalDate getEndDate() {
    return endDate;
  }

  public void setEndDate(LocalDate endDate) {
    this.endDate = endDate;
  }

  public SwapRequestStatus getStatus() {
    return status;
  }

  public void setStatus(SwapRequestStatus status) {
    this.status = status;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
