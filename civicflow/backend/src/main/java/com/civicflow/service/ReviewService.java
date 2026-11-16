package com.civicflow.service;

import com.civicflow.dto.ReviewActionRequest;
import com.civicflow.model.Application;
import com.civicflow.model.DepartmentReview;
import com.civicflow.model.User;
import com.civicflow.repository.ApplicationRepository;
import com.civicflow.repository.DepartmentReviewRepository;
import com.civicflow.repository.UserRepository;
import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final DepartmentReviewRepository reviewRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final NotificationAndAuditService auditService;
    private final FeeCalculationService feeCalculationService;

    @Autowired(required = false)
    private ZeebeClient zeebeClient;

    public List<DepartmentReview> getPendingReviewsForDepartment(DepartmentReview.DepartmentName department) {
        return reviewRepository.findByDepartmentAndStatus(department, DepartmentReview.ReviewStatus.PENDING);
    }

    @Transactional
    public DepartmentReview processReviewDecision(Long applicationId, ReviewActionRequest request, DepartmentReview.ReviewStatus decision) {
        User officer = userRepository.findById(request.getOfficerId())
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() == User.UserRole.ADMIN || u.getRole() == User.UserRole.OFFICER)
                        .findFirst()
                        .orElse(null));

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        DepartmentReview review = reviewRepository.findByApplicationIdAndDepartment(applicationId, request.getDepartment())
                .orElseGet(() -> DepartmentReview.builder()
                        .application(application)
                        .department(request.getDepartment())
                        .build());

        review.setOfficer(officer);
        review.setOfficerName(officer != null ? officer.getFullName() : "Municipal Administrator");
        review.setStatus(decision);
        review.setComments(request.getComments() != null ? request.getComments() : "Approved via CivicFlow Admin Portal");
        review.setReviewedAt(LocalDateTime.now());
        review.setIsOverdue(false);

        review = reviewRepository.save(review);

        auditService.logAudit(applicationId, "OFFICER_" + decision.name(),
                review.getOfficerName(), "OFFICER",
                request.getDepartment() + " marked " + decision.name() + ": " + review.getComments());

        // Publish Zeebe message to advance the Parallel Multi-Instance token in Camunda
        publishZeebeReviewMessage(applicationId, request.getDepartment(), decision);

        // Check overall state of the 4 departments for this application
        evaluateApplicationProgress(application);

        return review;
    }

    @Transactional
    public List<DepartmentReview> batchApproveAll(Long applicationId, Long officerId) {
        List<DepartmentReview> updated = new ArrayList<>();
        for (DepartmentReview.DepartmentName dept : DepartmentReview.DepartmentName.values()) {
            ReviewActionRequest req = new ReviewActionRequest();
            req.setDepartment(dept);
            req.setOfficerId(officerId != null ? officerId : 1L);
            req.setComments("One-Click Municipal Approval by Municipal Admin");
            updated.add(processReviewDecision(applicationId, req, DepartmentReview.ReviewStatus.APPROVED));
        }
        return updated;
    }

    private void publishZeebeReviewMessage(Long applicationId, DepartmentReview.DepartmentName dept, DepartmentReview.ReviewStatus decision) {
        if (zeebeClient != null) {
            try {
                String deptKey = dept.name();
                String varName = switch (dept) {
                    case FIRE_SAFETY -> "fireReviewDecision";
                    case WATER -> "waterReviewDecision";
                    case ZONING -> "zoningReviewDecision";
                    case ENVIRONMENTAL -> "envReviewDecision";
                };

                Map<String, Object> vars = new HashMap<>();
                vars.put(varName, decision.name());
                vars.put("department", deptKey);

                String corrKey = applicationId + "_" + deptKey;
                zeebeClient.newPublishMessageCommand()
                        .messageName("Message_DepartmentApproval")
                        .correlationKey(corrKey)
                        .variables(vars)
                        .timeToLive(java.time.Duration.ofDays(7))
                        .send()
                        .join();

                log.info("[Zeebe Message] Published Message_DepartmentApproval for key {} with {}={}",
                        corrKey, varName, decision.name());
            } catch (Exception e) {
                log.warn("Could not publish Zeebe review message: {}. (Camunda token will advance on next sync)", e.getMessage());
            }
        }
    }

    private void evaluateApplicationProgress(Application application) {
        List<DepartmentReview> allReviews = reviewRepository.findByApplicationId(application.getId());

        boolean hasRejection = allReviews.stream().anyMatch(r -> r.getStatus() == DepartmentReview.ReviewStatus.REJECTED);
        boolean hasRevision = allReviews.stream().anyMatch(r -> r.getStatus() == DepartmentReview.ReviewStatus.REVISION_REQUESTED);
        boolean allApproved = allReviews.size() == 4 && allReviews.stream().allMatch(r -> r.getStatus() == DepartmentReview.ReviewStatus.APPROVED);

        if (hasRejection) {
            application.setStatus(Application.ApplicationStatus.REJECTED);
            application.setCurrentStage("Application Rejected by Department");
        } else if (hasRevision) {
            application.setStatus(Application.ApplicationStatus.REVISION_REQUIRED);
            application.setCurrentStage("Revision Required by Department");
        } else if (allApproved) {
            double fee = feeCalculationService.calculateFee(
                    application.getBuildingType(),
                    application.getProposedBuildingArea(),
                    application.getNumberOfFloors(),
                    application.getPlotArea()
            );
            application.setCalculatedFee(fee);
            application.setStatus(Application.ApplicationStatus.PENDING_PAYMENT);
            application.setCurrentStage("All Departments Approved - Fee Calculated");
        }

        applicationRepository.save(application);
    }
}
