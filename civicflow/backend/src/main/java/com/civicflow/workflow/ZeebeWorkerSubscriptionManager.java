package com.civicflow.workflow;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.worker.JobWorker;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ZeebeWorkerSubscriptionManager {

    private final ZeebeClient zeebeClient;
    private final DocumentVerificationWorker documentVerificationWorker;
    private final LandRegistryWorker landRegistryWorker;
    private final DecisionEvaluationWorker decisionEvaluationWorker;
    private final DepartmentEscalationWorker departmentEscalationWorker;
    private final FeeCalculationWorker feeCalculationWorker;
    private final PermitGenerationWorker permitGenerationWorker;

    private final List<JobWorker> openedWorkers = new ArrayList<>();

    @PostConstruct
    public void startWorkers() {
        log.info("[ZeebeWorkerSubscriptionManager] Subscribing all job workers directly to Zeebe gateway...");

        // 1. Document Verification Worker
        try {
            JobWorker docWorker = zeebeClient.newWorker()
                    .jobType("document-verification-worker")
                    .handler((client, job) -> {
                        try {
                            log.info("[Zeebe Job] Handling job {} for type 'document-verification-worker'", job.getKey());
                            var vars = documentVerificationWorker.handleDocumentVerification(job);
                            client.newCompleteCommand(job.getKey()).variables(vars).send().join();
                            log.info("[Zeebe Job] Completed 'document-verification-worker' with variables: {}", vars);
                        } catch (Exception e) {
                            log.error("Failed to process document-verification-worker job", e);
                            client.newFailCommand(job.getKey())
                                    .retries(Math.max(0, job.getRetries() - 1))
                                    .errorMessage(e.getMessage())
                                    .send().join();
                        }
                    })
                    .name("document-verification-worker")
                    .open();
            openedWorkers.add(docWorker);
            log.info("Registered worker: document-verification-worker");
        } catch (Exception e) {
            log.error("Failed to register document-verification-worker", e);
        }

        // 2. Land Registry Worker (fallback/local handler)
        try {
            JobWorker landWorker = zeebeClient.newWorker()
                    .jobType("land-registry-worker")
                    .handler((client, job) -> {
                        try {
                            log.info("[Zeebe Job] Handling job {} for type 'land-registry-worker'", job.getKey());
                            var vars = landRegistryWorker.handleLandRegistryVerification(job);
                            client.newCompleteCommand(job.getKey()).variables(vars).send().join();
                            log.info("[Zeebe Job] Completed 'land-registry-worker'");
                        } catch (Exception e) {
                            log.error("Failed to process land-registry-worker job", e);
                            client.newFailCommand(job.getKey())
                                    .retries(Math.max(0, job.getRetries() - 1))
                                    .errorMessage(e.getMessage())
                                    .send().join();
                        }
                    })
                    .name("land-registry-worker")
                    .open();
            openedWorkers.add(landWorker);
            log.info("Registered worker: land-registry-worker");
        } catch (Exception e) {
            log.error("Failed to register land-registry-worker", e);
        }

        // 3. Department Escalation Worker
        try {
            JobWorker escalationWorker = zeebeClient.newWorker()
                    .jobType("department-escalation-worker")
                    .handler((client, job) -> {
                        try {
                            log.info("[Zeebe Job] Handling job {} for type 'department-escalation-worker'", job.getKey());
                            var vars = departmentEscalationWorker.handleEscalation(job);
                            client.newCompleteCommand(job.getKey()).variables(vars).send().join();
                            log.info("[Zeebe Job] Completed 'department-escalation-worker'");
                        } catch (Exception e) {
                            log.error("Failed to process department-escalation-worker job", e);
                            client.newFailCommand(job.getKey())
                                    .retries(Math.max(0, job.getRetries() - 1))
                                    .errorMessage(e.getMessage())
                                    .send().join();
                        }
                    })
                    .name("department-escalation-worker")
                    .open();
            openedWorkers.add(escalationWorker);
            log.info("Registered worker: department-escalation-worker");
        } catch (Exception e) {
            log.error("Failed to register department-escalation-worker", e);
        }

        // 4. Fee Calculation Worker
        try {
            JobWorker feeWorker = zeebeClient.newWorker()
                    .jobType("fee-calculation-worker")
                    .handler((client, job) -> {
                        try {
                            log.info("[Zeebe Job] Handling job {} for type 'fee-calculation-worker'", job.getKey());
                            var vars = feeCalculationWorker.calculateFee(job);
                            client.newCompleteCommand(job.getKey()).variables(vars).send().join();
                            log.info("[Zeebe Job] Completed 'fee-calculation-worker' with variables: {}", vars);
                        } catch (Exception e) {
                            log.error("Failed to process fee-calculation-worker job", e);
                            client.newFailCommand(job.getKey())
                                    .retries(Math.max(0, job.getRetries() - 1))
                                    .errorMessage(e.getMessage())
                                    .send().join();
                        }
                    })
                    .name("fee-calculation-worker")
                    .open();
            openedWorkers.add(feeWorker);
            log.info("Registered worker: fee-calculation-worker");
        } catch (Exception e) {
            log.error("Failed to register fee-calculation-worker", e);
        }

        // 5. Permit Generation Worker
        try {
            JobWorker permitWorker = zeebeClient.newWorker()
                    .jobType("permit-generation-worker")
                    .handler((client, job) -> {
                        try {
                            log.info("[Zeebe Job] Handling job {} for type 'permit-generation-worker'", job.getKey());
                            var vars = permitGenerationWorker.generatePermit(job);
                            client.newCompleteCommand(job.getKey()).variables(vars).send().join();
                            log.info("[Zeebe Job] Completed 'permit-generation-worker' with variables: {}", vars);
                        } catch (Exception e) {
                            log.error("Failed to process permit-generation-worker job", e);
                            client.newFailCommand(job.getKey())
                                    .retries(Math.max(0, job.getRetries() - 1))
                                    .errorMessage(e.getMessage())
                                    .send().join();
                        }
                    })
                    .name("permit-generation-worker")
                    .open();
            openedWorkers.add(permitWorker);
            log.info("Registered worker: permit-generation-worker");
        } catch (Exception e) {
            log.error("Failed to register permit-generation-worker", e);
        }

        log.info("[ZeebeWorkerSubscriptionManager] All 5 core Zeebe Job Workers actively polling 127.0.0.1:26500!");
    }

    @PreDestroy
    public void closeWorkers() {
        log.info("[ZeebeWorkerSubscriptionManager] Shutting down Zeebe Job Workers...");
        for (JobWorker w : openedWorkers) {
            try {
                w.close();
            } catch (Exception ignored) {}
        }
    }
}

