
package ubb.inothershoes.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import ubb.inothershoes.api.HomesApi;
import ubb.inothershoes.model.CreateHomeRequest;
import ubb.inothershoes.model.HomeResponse;
import ubb.inothershoes.service.HomeService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import ubb.inothershoes.entity.HomePhoto;
import ubb.inothershoes.model.HomePhotoResponse;
import ubb.inothershoes.service.HomePhotoService;

import java.util.ArrayList;
@RestController
public class HomeController implements HomesApi {


    private final HomeService homeService;
    private final HomePhotoService homePhotoService;

    public HomeController(
            HomeService homeService,
            HomePhotoService homePhotoService
    ) {
        this.homeService = homeService;
        this.homePhotoService = homePhotoService;
    }


    @Override
    public ResponseEntity<HomeResponse> createHome(
            @Valid CreateHomeRequest createHomeRequest) {

        HomeResponse response = homeService.createHome(createHomeRequest);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @Override
    public ResponseEntity<List<HomeResponse>> getMyHomes() {

        List<HomeResponse> homes = homeService.getMyHomes();

        return ResponseEntity.ok(homes);
    }


    @Override
    public ResponseEntity<HomeResponse> updateHome(
            Long homeId,
            @Valid CreateHomeRequest createHomeRequest) {

        HomeResponse response =
                homeService.updateHome(homeId, createHomeRequest);

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<Void> deleteHome(Long homeId) {

        homeService.deleteHome(homeId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<HomeResponse> getHomeById(Long homeId) {
        HomeResponse response = homeService.getHomeById(homeId);
        return ResponseEntity.ok(response);
    }


    @Override
    public ResponseEntity<HomePhotoResponse> uploadHomePhoto(
            Long homeId,
            MultipartFile file
    ) {
        HomePhoto photo = homePhotoService.uploadPhoto(homeId, file);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toPhotoResponse(photo));
    }

    @Override
    public ResponseEntity<List<HomePhotoResponse>> getHomePhotos(
            Long homeId
    ) {
        List<HomePhoto> photos = homePhotoService.getHomePhotos(homeId);

        List<HomePhotoResponse> responses = new ArrayList<>();

        for (HomePhoto photo : photos) {
            responses.add(toPhotoResponse(photo));
        }

        return ResponseEntity.ok(responses);
    }

    @Override
    public ResponseEntity<Void> deleteHomePhoto(
            Long homeId,
            Long photoId
    ) {
        homePhotoService.deletePhoto(homeId, photoId);

        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Resource> getHomePhotoImage(
            Long homeId,
            Long photoId
    ) {
        HomePhoto photo = homePhotoService.getPhotoById(homeId, photoId);
        Resource image = homePhotoService.getPhotoImage(photo);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                .body(image);
    }


    @Override
    public ResponseEntity<List<HomePhotoResponse>> setPrimaryHomePhoto(
            Long homeId,
            Long photoId
    ) {
        List<HomePhoto> photos =
                homePhotoService.setPrimaryPhoto(homeId, photoId);

        List<HomePhotoResponse> responses = new ArrayList<>();

        for (HomePhoto photo : photos) {
            responses.add(toPhotoResponse(photo));
        }

        return ResponseEntity.ok(responses);
    }


    private HomePhotoResponse toPhotoResponse(HomePhoto photo) {
        HomePhotoResponse response = new HomePhotoResponse();

        Long homeId = photo.getHome().getId();

        response.setId(photo.getId());
        response.setHomeId(homeId);
        response.setContentType(photo.getContentType());
        response.setDisplayOrder(photo.getDisplayOrder());

        response.setUrl(
                "/api/v1/homes/" + homeId
                        + "/photos/" + photo.getId()
                        + "/image"
        );

        return response;
    }


}
