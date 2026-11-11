package ubb.inothershoes.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "home_photos")
public class HomePhoto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "home_id", nullable = false)
  private Home home;

  @Column(name = "file_name", nullable = false)
  private String fileName;

  @Column(name = "content_type", nullable = false)
  private String contentType;

  @Column(name = "display_order", nullable = false)
  private Integer displayOrder = 0;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Home getHome() {
    return home;
  }

  public void setHome(Home home) {
    this.home = home;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String contentType) {
    this.contentType = contentType;
  }

  public Integer getDisplayOrder() {
    return displayOrder;
  }

  public void setDisplayOrder(Integer displayOrder) {
    this.displayOrder = displayOrder;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
