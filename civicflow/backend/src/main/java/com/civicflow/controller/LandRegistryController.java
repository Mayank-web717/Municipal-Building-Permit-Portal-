package com.civicflow.controller;

import com.civicflow.service.MockLandRegistryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/land-registry")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class LandRegistryController {

    private final MockLandRegistryService landRegistryService;

    @GetMapping(value = {"/verify", "/verify/{*surveyNumber}"})
    public ResponseEntity<MockLandRegistryService.LandVerificationResult> verifySurveyNumber(
            @PathVariable(required = false) String surveyNumber,
            @RequestParam(name = "surveyNumber", required = false) String surveyParam,
            HttpServletRequest request) {

        String finalSurvey = surveyParam;
        if (finalSurvey == null || finalSurvey.isBlank()) {
            finalSurvey = surveyNumber;
        }
        if (finalSurvey != null && finalSurvey.startsWith("/")) {
            finalSurvey = finalSurvey.substring(1);
        }
        if (finalSurvey == null || finalSurvey.isBlank()) {
            String uri = request.getRequestURI();
            int idx = uri.indexOf("/verify/");
            if (idx != -1) {
                finalSurvey = uri.substring(idx + "/verify/".length());
            } else {
                finalSurvey = "SN-4509-A";
            }
        }

        log.info("[LandRegistryController] Received survey verification request for: {}", finalSurvey);
        return ResponseEntity.ok(landRegistryService.verifySurveyNumber(finalSurvey));
    }
}
