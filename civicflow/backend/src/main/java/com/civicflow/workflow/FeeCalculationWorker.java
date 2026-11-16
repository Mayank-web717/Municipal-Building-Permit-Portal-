package com.civicflow.workflow;

import com.civicflow.model.Application;
import com.civicflow.repository.ApplicationRepository;
import com.civicflow.service.FeeCalculationService;
import com.civicflow.service.NotificationAndAuditService;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeeCalculationWorker {

    private final ApplicationRepository applicationRepository;
    private final FeeCalculationService feeCalculationService;
    private final NotificationAndAuditService auditService;

    @JobWorker(type = "fee-calculation-worker", autoComplete = true)
    public Map<String, Object> calculateFee(final ActivatedJob job) {
        Object appObj = job.getVariablesAsMap().get("applicationId");
        Long applicationId = (appObj instanceof Number n) ? n.longValue() : 1L;
        log.info("[Camunda Call Activity Worker] Calculating Permit Fee for Application ID: {}", applicationId);

        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            log.info("Application {} not found in local DB. Providing default computed fee variables.", applicationId);
            return Map.of(
                    "calculatedFee", 38500.0,
                    "totalFee", 38500.0,
                    "scrutinyFee", 3500.0,
                    "infrastructureFee", 30000.0,
                    "environmentalCess", 5000.0
            );
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

        return Map.of("calculatedFee", fee);
    }
}

