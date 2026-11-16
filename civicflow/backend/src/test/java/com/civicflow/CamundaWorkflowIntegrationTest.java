package com.civicflow;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.command.DeployResourceCommandStep1;
import io.camunda.zeebe.client.api.response.DeploymentEvent;
import io.camunda.zeebe.client.api.response.ProcessInstanceEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CamundaWorkflowIntegrationTest {

    @Test
    @DisplayName("Deploy BPMN, DMN, and Tasklist Forms to live Zeebe and Start Workflow Instance")
    public void testDeployAndStartWorkflow() throws Exception {
        System.out.println("\n=======================================================");
        System.out.println(" 1. CONNECTING TO CAMUNDA 8 ZEEBE (127.0.0.1:26500)");
        System.out.println("=======================================================");
        try (ZeebeClient client = ZeebeClient.newClientBuilder()
                .gatewayAddress("127.0.0.1:26500")
                .usePlaintext()
                .build()) {

            var topology = client.newTopologyRequest().send().join();
            System.out.println(">>> Zeebe Cluster OK! Active Brokers: " + topology.getBrokers().size());

            System.out.println("\n=======================================================");
            System.out.println(" 2. DEPLOYING BPMN, DMN & TASKLIST FORMS");
            System.out.println("=======================================================");
            DeployResourceCommandStep1.DeployResourceCommandStep2 deployStep = null;
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

            Resource[] bpmns = resolver.getResources("classpath*:*.bpmn");
            Resource[] dmns = resolver.getResources("classpath*:dmn/*.dmn");
            Resource[] forms = resolver.getResources("classpath*:forms/*.form");

            int deployedCount = 0;
            for (Resource r : bpmns) {
                if (r.exists() && r.getFilename() != null) {
                    try (InputStream is = r.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        deployStep = (deployStep == null)
                                ? client.newDeployResourceCommand().addResourceBytes(bytes, r.getFilename())
                                : deployStep.addResourceBytes(bytes, r.getFilename());
                        deployedCount++;
                        System.out.println(" [BPMN] " + r.getFilename());
                    }
                }
            }

            for (Resource r : dmns) {
                if (r.exists() && r.getFilename() != null) {
                    try (InputStream is = r.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        deployStep = (deployStep == null)
                                ? client.newDeployResourceCommand().addResourceBytes(bytes, r.getFilename())
                                : deployStep.addResourceBytes(bytes, r.getFilename());
                        deployedCount++;
                        System.out.println(" [DMN]  " + r.getFilename());
                    }
                }
            }

            for (Resource r : forms) {
                if (r.exists() && r.getFilename() != null) {
                    try (InputStream is = r.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        deployStep = (deployStep == null)
                                ? client.newDeployResourceCommand().addResourceBytes(bytes, r.getFilename())
                                : deployStep.addResourceBytes(bytes, r.getFilename());
                        deployedCount++;
                        System.out.println(" [FORM] " + r.getFilename());
                    }
                }
            }

            assertNotNull(deployStep, "No resources found to deploy!");
            DeploymentEvent deployment = deployStep.send().join();
            System.out.println("\n>>> Deployment SUCCESSFUL!");
            System.out.println("    Total Deployed Resources: " + deployedCount);
            System.out.println("    Deployment Key:           " + deployment.getKey());
            System.out.println("    Processes Deployed:       " + deployment.getProcesses().size());
            System.out.println("    Decisions Deployed:       " + deployment.getDecisionRequirements().size());

            System.out.println("\n=======================================================");
            System.out.println(" 3. STARTING WORKFLOW INSTANCE WITH TASKLIST VARIABLES");
            System.out.println("=======================================================");
            Map<String, Object> variables = new HashMap<>();
            variables.put("applicationId", 101L);
            variables.put("applicationNumber", "BLD-2026-VAL01");
            variables.put("applicantName", "Prof. Evaluation User");
            variables.put("applicantEmail", "evaluator@camunda.univ.edu");
            variables.put("buildingType", "COMMERCIAL");
            variables.put("plotArea", 15000.0);
            variables.put("proposedBuiltUpArea", 8500.0);
            variables.put("floors", 4);
            variables.put("surveyNumber", "SN-4509/A");
            variables.put("documentsValid", true);
            variables.put("landRegistryValid", true);
            variables.put("fireReviewDecision", "APPROVED");
            variables.put("waterReviewDecision", "APPROVED");
            variables.put("zoningReviewDecision", "APPROVED");
            variables.put("envReviewDecision", "APPROVED");

            ProcessInstanceEvent instance = client.newCreateInstanceCommand()
                    .bpmnProcessId("Process_MunicipalBuildingPermit")
                    .latestVersion()
                    .variables(variables)
                    .send()
                    .join();

            System.out.println(">>> Instance Created in Zeebe!");
            System.out.println("    BPMN Process ID:      " + instance.getBpmnProcessId());
            System.out.println("    Process Instance Key: " + instance.getProcessInstanceKey());
            System.out.println("    Version:              " + instance.getVersion());

            assertTrue(instance.getProcessInstanceKey() > 0);
            System.out.println("\n=======================================================");
            System.out.println(" 4. VERIFICATION SUCCESS: WORKFLOW & TASKLIST ACTIVE!");
            System.out.println("=======================================================\n");
        }
    }
}
