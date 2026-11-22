package ubb.inothershoes.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "counties")
public class County {

  @Id
  @Column(name = "code", length = 10, nullable = false)
  private String code;

  @Column(name = "name", length = 100, nullable = false)
  private String name;

  public County() {}

  public County(String code, String name) {
    this.code = code;
    this.name = name;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }
}
