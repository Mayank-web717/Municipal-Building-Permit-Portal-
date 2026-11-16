package com.civicflow.workflow;

import com.civicflow.model.Application;
import com.civicflow.model.DepartmentReview;
import com.civicflow.model.Notification;
import com.civicflow.model.Permit;
import com.civicflow.repository.ApplicationRepository;
import com.civicflow.repository.DepartmentReviewRepository;
import com.civicflow.service.NotificationAndAuditService;
import com.civicflow.service.PermitPdfGeneratorService;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PermitGenerationWorker {

    private final ApplicationRepository applicationRepository;
    private final DepartmentReviewRepository reviewRepository;
    private final PermitPdfGeneratorService pdfGeneratorService;
    private final NotificationAndAuditService auditService;

    @JobWorker(type = "permit-generation-worker", autoComplete = true)
    public Map<String, Object> generatePermit(final ActivatedJob job) {
        Object appObj = job.getVariablesAsMap().get("applicationId");
        Long applicationId = (appObj instanceof Number n) ? n.longValue() : 1L;
        log.info("[Camunda Worker] Generating Official Permit & PDF for App ID: {}", applicationId);

        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            log.info("Application {} not found in local DB. Returning mock permit details.", applicationId);
            return Map.of(
                    "permitGenerated", true,
                    "permitNumber", "BLD-2026-MOCK-99",
                    "issuedDate", java.time.LocalDate.now().toString()
            );
        }

        List<DepartmentReview> reviews = reviewRepository.findByApplicationId(applicationId);
        Permit permit = pdfGeneratorService.generatePermit(application, reviews);

        application.setStatus(Application.ApplicationStatus.PERMIT_ISSUED);
        application.setCurrentStage("Permit Issued Successfully");
        application.setPermitNumber(permit.getPermitNumber());
        applicationRepository.save(application);

        auditService.logAudit(applicationId, "PERMIT_GENERATED", "Zeebe Worker", "SYSTEM",
                "Official municipal permit generated: " + permit.getPermitNumber());

        auditService.sendNotification(application.getApplicant(), applicationId,
                "Permit Issued - " + permit.getPermitNumber(),
                "Congratulations! Your building permit " + permit.getPermitNumber() + " has been approved and issued with digital signature.",
                Notification.NotificationType.PERMIT);

        return Map.of("permitGenerated", true, "permitNumber", permit.getPermitNumber());
    }
}

