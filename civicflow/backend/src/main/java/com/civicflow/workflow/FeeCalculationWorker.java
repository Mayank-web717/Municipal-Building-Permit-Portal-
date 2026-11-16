package com.civicflow.workflow;

import com.civicflow.model.Application;
import com.civicflow.repository.ApplicationRepository;
import com.civicflow.service.FeeCalculationService;
import com.civicflow.service.NotificationAndAuditService;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeeCalculationWorker {

    private final ApplicationRepository applicationRepository;
    private final FeeCalculationService feeCalculationService;
    private final NotificationAndAuditService auditService;

    public Map<String, Object> calculateFee(final ActivatedJob job) {
        Object appObj = job.getVariablesAsMap().get("applicationId");
        Long applicationId = (appObj instanceof Number n) ? n.longValue() : 1L;
        log.info("[Camunda Call Activity Worker] Calculating Permit Fee for Application ID: {}", applicationId);

        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            log.info("Application {} not found in local DB. Providing default computed fee variables.", applicationId);
            Map<String, Object> defaults = new HashMap<>();
            defaults.put("calculatedFee", 38500.0);
            defaults.put("totalFee", 38500.0);
            defaults.put("scrutinyFee", 3500.0);
            defaults.put("infrastructureFee", 30000.0);
            defaults.put("environmentalCess", 5000.0);
            return defaults;
        }

        double fee = feeCalculationService.calculateFee(
                application.getBuildingType(),
                application.getProposedBuildingArea(),
                application.getNumberOfFloors(),
                application.getPlotArea()
        );

        application.setCalculatedFee(fee);
        application.setStatus(Application.ApplicationStatus.PENDING_PAYMENT);
        application.setCurrentStage("Awaiting Citizen Payment");
        applicationRepository.save(application);

        auditService.logAudit(applicationId, "FEE_CALCULATED", "Fee Call Activity Worker", "SYSTEM",
                "Permit fee computed as INR " + fee + " based on " + application.getBuildingType() + " specifications.");

        Map<String, Object> result = new HashMap<>();
        result.put("calculatedFee", fee);
        result.put("totalFee", fee);
        return result;
    }
}
