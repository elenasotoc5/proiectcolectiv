package ubb.inothershoes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomePhoto;
import ubb.inothershoes.entity.User;
import ubb.inothershoes.repository.HomePhotoRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
public class HomePhotoServiceTest {

  @Mock private HomePhotoRepository photoRepository;

  @Mock private HomeRepository homeRepository;

  @TempDir Path tempUploadDir;

  private HomePhotoService photoService;

  private Home home;
  private User owner;

  @BeforeEach
  void setUp() {
    photoService = new HomePhotoService(photoRepository, homeRepository, tempUploadDir.toString());

    owner = new User();
    owner.setId(10L);

    home = new Home();
    home.setId(1L);
    home.setOwner(owner);

    UserPrincipal principal = UserPrincipal.create(owner);
    SecurityContextHolder.getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void uploadPhoto_shouldRejectEmptyFile() {
    MockMultipartFile emptyFile =
        new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> photoService.uploadPhoto(1L, emptyFile));

    assertTrue(ex.getMessage().contains("Please select an image"));
  }

  @Test
  void uploadPhoto_shouldRejectInvalidHeaderBytes() {
    byte[] textBytes = "This is not an image".getBytes();
    MockMultipartFile fakeFile = new MockMultipartFile("file", "test.txt", "text/plain", textBytes);

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));
    when(photoRepository.countByHomeId(1L)).thenReturn(0L);

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> photoService.uploadPhoto(1L, fakeFile));

    assertTrue(ex.getMessage().contains("Only JPEG, PNG and WebP images are allowed"));
  }

  @Test
  void uploadPhoto_shouldAcceptValidPng() {
    byte[] pngHeader = new byte[] {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 0, 0, 0, 0};
    MockMultipartFile pngFile = new MockMultipartFile("file", "test.png", "image/png", pngHeader);

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));
    when(photoRepository.countByHomeId(1L)).thenReturn(0L);
    when(photoRepository.save(any(HomePhoto.class)))
        .thenAnswer(i -> {
          HomePhoto p = i.getArgument(0);
          p.setId(101L);
          return p;
        });

    HomePhoto result = photoService.uploadPhoto(1L, pngFile);

    assertNotNull(result);
    assertEquals("image/png", result.getContentType());
    assertEquals(0, result.getDisplayOrder());
    verify(photoRepository).save(any(HomePhoto.class));
  }

  @Test
  void uploadPhoto_shouldEnforceMaxPhotoLimit() {
    byte[] jpegHeader =
        new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    MockMultipartFile jpegFile =
        new MockMultipartFile("file", "test.jpg", "image/jpeg", jpegHeader);

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));
    when(photoRepository.countByHomeId(1L)).thenReturn(10L);

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> photoService.uploadPhoto(1L, jpegFile));

    assertTrue(ex.getMessage().contains("Maximum 10 photos"));
  }

  @Test
  void setPrimaryPhoto_shouldMoveSelectedToFirst_andReindex() {
    HomePhoto photo1 = new HomePhoto();
    photo1.setId(1L);
    photo1.setDisplayOrder(0);

    HomePhoto photo2 = new HomePhoto();
    photo2.setId(2L);
    photo2.setDisplayOrder(1);

    HomePhoto photo3 = new HomePhoto();
    photo3.setId(3L);
    photo3.setDisplayOrder(2);

    List<HomePhoto> photos = new ArrayList<>(List.of(photo1, photo2, photo3));

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));
    when(photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(1L)).thenReturn(photos);
    when(photoRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

    List<HomePhoto> reordered = photoService.setPrimaryPhoto(1L, 3L);

    assertEquals(3L, reordered.get(0).getId());
    assertEquals(0, reordered.get(0).getDisplayOrder());

    assertEquals(1L, reordered.get(1).getId());
    assertEquals(1, reordered.get(1).getDisplayOrder());

    assertEquals(2L, reordered.get(2).getId());
    assertEquals(2, reordered.get(2).getDisplayOrder());
  }

  @Test
  void deletePhoto_shouldReindexRemainingPhotos() {
    HomePhoto photoToDelete = new HomePhoto();
    photoToDelete.setId(2L);
    photoToDelete.setHome(home);
    photoToDelete.setFileName("photo2.png");
    photoToDelete.setDisplayOrder(1);

    HomePhoto photo1 = new HomePhoto();
    photo1.setId(1L);
    photo1.setDisplayOrder(0);

    HomePhoto photo3 = new HomePhoto();
    photo3.setId(3L);
    photo3.setDisplayOrder(2);

    when(homeRepository.findById(1L)).thenReturn(Optional.of(home));
    when(photoRepository.findById(2L)).thenReturn(Optional.of(photoToDelete));
    when(photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(1L))
        .thenReturn(new ArrayList<>(List.of(photo1, photo3)));

    photoService.deletePhoto(1L, 2L);

    verify(photoRepository).delete(photoToDelete);
    verify(photoRepository)
        .saveAll(
            argThat(list -> {
              List<HomePhoto> l = (List<HomePhoto>) list;
              return l.size() == 2
                  && l.get(0).getDisplayOrder() == 0
                  && l.get(1).getDisplayOrder() == 1;
            }));
  }
}
