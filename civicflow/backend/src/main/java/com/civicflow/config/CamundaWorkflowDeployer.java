package com.civicflow.config;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.command.DeployResourceCommandStep1;
import io.camunda.zeebe.client.api.response.DeploymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
@Slf4j
@RequiredArgsConstructor
public class CamundaWorkflowDeployer implements ApplicationRunner {

    private final ZeebeClient zeebeClient;

    @Override
    public void run(ApplicationArguments args) {
        log.info("CivicFlow: Checking connection to Camunda 8 Zeebe broker and deploying BPMN & Forms...");
        try {
            DeployResourceCommandStep1.DeployResourceCommandStep2 deployCmd = null;
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            
            Resource[] bpmns = resolver.getResources("classpath:*.bpmn");
            Resource[] forms = resolver.getResources("classpath:forms/*.form");

            int count = 0;
            for (Resource r : bpmns) {
                if (r.exists() && r.getFilename() != null) {
                    try (InputStream is = r.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        if (deployCmd == null) {
                            deployCmd = zeebeClient.newDeployResourceCommand().addResourceBytes(bytes, r.getFilename());
                        } else {
                            deployCmd = deployCmd.addResourceBytes(bytes, r.getFilename());
                        }
                        count++;
                        log.info("Queued BPMN workflow for Camunda 8 deployment: {}", r.getFilename());
                    }
                }
            }

            for (Resource r : forms) {
                if (r.exists() && r.getFilename() != null) {
                    try (InputStream is = r.getInputStream()) {
                        byte[] bytes = is.readAllBytes();
                        if (deployCmd == null) {
                            deployCmd = zeebeClient.newDeployResourceCommand().addResourceBytes(bytes, r.getFilename());
                        } else {
                            deployCmd = deployCmd.addResourceBytes(bytes, r.getFilename());
                        }
                        count++;
                        log.info("Queued Camunda Form for Tasklist deployment: {}", r.getFilename());
                    }
                }
            }

            if (deployCmd != null && count > 0) {
                DeploymentEvent event = deployCmd.send().join();
                log.info("Successfully deployed {} workflow resources and forms to Camunda 8! Deployment Key: {}",
                        count, event.getKey());
            }
        } catch (Exception e) {
            log.warn("Camunda 8 auto-deployment deferred (Zeebe broker not reachable at startup): {}. Resources are ready for deployment via Camunda Modeler or c8run.", e.getMessage());
        }
    }
}
