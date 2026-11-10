package ubb.inothershoes.service;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ubb.inothershoes.entity.Home;
import ubb.inothershoes.entity.HomePhoto;
import ubb.inothershoes.repository.HomePhotoRepository;
import ubb.inothershoes.repository.HomeRepository;
import ubb.inothershoes.security.UserPrincipal;

@Service
public class HomePhotoService {

  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
  private static final int MAX_PHOTOS = 10;

  private final HomePhotoRepository photoRepository;
  private final HomeRepository homeRepository;
  private final Path uploadDirectory;
  private static final Logger LOGGER = Logger.getLogger(HomePhotoService.class.getName());

  public HomePhotoService(
      HomePhotoRepository photoRepository,
      HomeRepository homeRepository,
      @Value("${home.upload.dir:${HOME_UPLOAD_DIR:uploads}}") String uploadDir) {
    this.photoRepository = photoRepository;
    this.homeRepository = homeRepository;
    this.uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
  }

  @Transactional
  public HomePhoto uploadPhoto(Long homeId, MultipartFile file) {

    Home home = getOwnedHome(homeId);

    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select an image");
    }

    if (file.getSize() > MAX_FILE_SIZE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum file size is 5 MB");
    }

    if (photoRepository.countByHomeId(homeId) >= MAX_PHOTOS) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 10 photos per home");
    }

    String contentType;
    String extension;

    try {
      byte[] header;
      try (var input = file.getInputStream()) {
        header = input.readNBytes(12);
      }

      if (isJpeg(header)) {
        contentType = "image/jpeg";
        extension = ".jpg";
      } else if (isPng(header)) {
        contentType = "image/png";
        extension = ".png";
      } else if (isWebp(header)) {
        contentType = "image/webp";
        extension = ".webp";
      } else {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Only JPEG, PNG and WebP images are allowed");
      }
    } catch (IOException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not inspect image", e);
    }

    String fileName = UUID.randomUUID() + extension;
    Path target = uploadDirectory.resolve(fileName);

    try {
      Files.createDirectories(uploadDirectory);

      try (var input = file.getInputStream()) {
        Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
      }

      HomePhoto photo = new HomePhoto();
      photo.setHome(home);
      photo.setFileName(fileName);
      photo.setContentType(contentType);
      photo.setDisplayOrder((int) photoRepository.countByHomeId(homeId));

      return photoRepository.save(photo);

    } catch (Exception e) {
      try {
        Files.deleteIfExists(target);
      } catch (IOException ignored) {
      }

      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not save image", e);
    }
  }

  @Transactional(readOnly = true)
  public List<HomePhoto> getHomePhotos(Long homeId) {

    if (!homeRepository.existsById(homeId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found");
    }

    return photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(homeId);
  }

  @Transactional
  public void deletePhoto(Long homeId, Long photoId) {

    getOwnedHome(homeId);

    HomePhoto photo =
        photoRepository
            .findById(photoId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found"));

    if (!photo.getHome().getId().equals(homeId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo does not belong to this home");
    }

    String fileName = photo.getFileName();
    photoRepository.delete(photo);
    photoRepository.flush();

    List<HomePhoto> remaining = photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(homeId);
    for (int i = 0; i < remaining.size(); i++) {
      remaining.get(i).setDisplayOrder(i);
    }
    photoRepository.saveAll(remaining);

    if (TransactionSynchronizationManager.isActualTransactionActive()
        && TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCommit() {
              deleteFileQuietly(fileName);
            }
          });
    } else {
      deleteFileQuietly(fileName);
    }
  }

  private Home getOwnedHome(Long homeId) {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    Home home =
        homeRepository
            .findById(homeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home not found"));

    if (!home.getOwner().getId().equals(principal.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this home");
    }

    return home;
  }

  private boolean isJpeg(byte[] b) {
    return b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
  }

  private boolean isPng(byte[] b) {
    return b.length >= 8
        && (b[0] & 0xFF) == 0x89
        && b[1] == 'P'
        && b[2] == 'N'
        && b[3] == 'G'
        && (b[4] & 0xFF) == 13
        && (b[5] & 0xFF) == 10
        && (b[6] & 0xFF) == 26
        && (b[7] & 0xFF) == 10;
  }

  private boolean isWebp(byte[] b) {
    return b.length >= 12
        && new String(b, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
        && new String(b, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP");
  }

  @Transactional(readOnly = true)
  public Resource getPhotoImage(HomePhoto photo) {
    if (photo == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
    }

    Path imagePath = uploadDirectory.resolve(photo.getFileName()).normalize();

    if (!imagePath.startsWith(uploadDirectory)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image path");
    }

    try {
      Resource resource = new UrlResource(imagePath.toUri());

      if (!resource.exists() || !resource.isReadable()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image file not found");
      }

      return resource;
    } catch (MalformedURLException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not load image", e);
    }
  }

  @Transactional(readOnly = true)
  public Resource getPhotoImage(Long homeId, Long photoId) {
    HomePhoto photo = getPhotoById(homeId, photoId);
    return getPhotoImage(photo);
  }

  @Transactional(readOnly = true)
  public HomePhoto getPhotoById(Long homeId, Long photoId) {

    HomePhoto photo =
        photoRepository
            .findById(photoId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found"));

    if (!photo.getHome().getId().equals(homeId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo does not belong to this home");
    }

    return photo;
  }

  @Transactional
  public List<HomePhoto> setPrimaryPhoto(Long homeId, Long photoId) {

    getOwnedHome(homeId);

    List<HomePhoto> photos = photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(homeId);

    HomePhoto selectedPhoto = null;

    for (HomePhoto photo : photos) {
      if (photo.getId().equals(photoId)) {
        selectedPhoto = photo;
        break;
      }
    }

    if (selectedPhoto == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found for this home");
    }

    photos.remove(selectedPhoto);
    photos.add(0, selectedPhoto);

    for (int i = 0; i < photos.size(); i++) {
      photos.get(i).setDisplayOrder(i);
    }

    return photoRepository.saveAll(photos);
  }

  public void scheduleHomePhotoCleanup(Long homeId) {

    List<String> fileNames =
        photoRepository.findByHomeIdOrderByDisplayOrderAscIdAsc(homeId).stream()
            .map(HomePhoto::getFileName)
            .collect(Collectors.toList());

    if (fileNames.isEmpty()) {
      return;
    }

    if (!TransactionSynchronizationManager.isActualTransactionActive()
        || !TransactionSynchronizationManager.isSynchronizationActive()) {
      throw new IllegalStateException("Photo cleanup requires an active transaction");
    }

    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            for (String fileName : fileNames) {
              deleteFileQuietly(fileName);
            }
          }
        });
  }

  private void deleteFileQuietly(String fileName) {
    Path path = uploadDirectory.resolve(fileName).normalize();

    if (!path.startsWith(uploadDirectory)) {
      LOGGER.warning("Invalid photo path: " + fileName);
      return;
    }

    try {
      Files.deleteIfExists(path);
    } catch (IOException e) {
      LOGGER.warning("Could not delete photo: " + fileName);
    }
  }
}
