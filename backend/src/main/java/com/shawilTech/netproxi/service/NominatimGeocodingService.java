package com.shawilTech.netproxi.service;

import com.shawilTech.netproxi.dto.GeocodingResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
public class NominatimGeocodingService {

    private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingService.class);

    private final RestTemplate restTemplate;

    @Value("${geocoding.opencage.api-key}")
    private String apiKey;

    public NominatimGeocodingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public GeocodingResult geocode(String address) {

        if (address == null || address.isBlank()) {
            return new GeocodingResult(null, null, false, "Address is empty");
        }

        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://api.opencagedata.com/geocode/v1/json")
                    .queryParam("q", address)
                    .queryParam("key", apiKey)
                    .queryParam("limit", 1)
                    .queryParam("language", "fr")
                    .queryParam("countrycode", "fr")
                    .encode()
                    .toUriString();

            log.info("Geocoding URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            log.info("Raw geocoding response: {}", response.getBody());

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode results = root.get("results");

            if (results != null && results.isArray() && results.size() > 0) {
                JsonNode geometry = results.get(0).get("geometry");
                double lat = geometry.get("lat").asDouble();
                double lon = geometry.get("lng").asDouble();

                log.info("Geocoded '{}' -> lat={}, lon={}", address, lat, lon);
                return new GeocodingResult(lat, lon, true, null);
            }

            log.warn("No geocoding results for address: {}", address);
            return new GeocodingResult(null, null, false, "Address not found");

        } catch (Exception e) {
            log.error("Geocoding error", e);
            return new GeocodingResult(null, null, false, "Error: " + e.getMessage());
        }
    }
}