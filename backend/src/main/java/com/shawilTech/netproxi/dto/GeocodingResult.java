package com.shawilTech.netproxi.dto;

public record GeocodingResult(Double latitude, Double longitude, boolean success, String errorMessage) {}
