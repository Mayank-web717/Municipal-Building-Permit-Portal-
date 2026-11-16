# Camunda 8 Tasklist Guide – CivicFlow Municipal Permit System
## Official Guide for Academic Evaluators, Teachers, and Viva Demonstrations

---

## 1. Overview

In Camunda 8, **Tasklist** (`http://localhost:8080/tasklist`) is the human workflow inbox where municipal department officers and applicants claim, inspect, and complete pending **User Tasks**.

Every user task in CivicFlow is configured as a **native Camunda 8 User Task** with:
1. `<zeebe:userTask />` – Registers the task natively with Zeebe Tasklist event streams.
2. `<zeebe:formDefinition formId="..." />` – Connects each task to its official Camunda Form.
3. `<zeebe:assignmentDefinition candidateGroups="..." />` – Role-based group filtering.
4. `<zeebe:priorityDefinition priority="..." />` – Priority sorting in Tasklist.

---

## 2. Deployed Tasklist Forms Summary

| Task Name in BPMN | Form ID | Candidate Group | Purpose & Fields |
|---|---|---|---|
| **Fire Safety Review** | `form-fire-safety-review` | `fire-officers` | Emergency exits, wet risers/sprinklers, 6m access road, `fireReviewDecision` (APPROVED / REVISION / REJECTED) |
| **Water Department Review** | `form-water-review` | `water-officers` | Pipeline hydraulic pressure, municipal sewer/STP feasibility, rainwater recharge well, `waterReviewDecision` |
| **Zoning Department Review** | `form-zoning-review` | `zoning-officers` | FAR ratio, master plan land-use, front/rear/side setbacks, `zoningReviewDecision` |
| **Environmental Review** | `form-environmental-review` | `environmental-officers` | 15% green cover ratio, solid waste composting pit, solar water heating, `envReviewDecision` |
| **Applicant Corrects Missing Documents** | `form-missing-documents` | `applicants` | Re-upload missing blueprints, title deed, or structural cert if initial verification failed |
| **Applicant Uploads Revised Blueprint** | `form-applicant-revision` | `applicants` | Re-upload modified drawings addressing department feedback |
| **Citizen / Architect Payment** | `form-citizen-payment` | `applicants` | Remit calculated municipal fees via Credit Card, Net Banking, or UPI |

---

## 3. How to Access and Test in Camunda Tasklist

### Step 1: Open Camunda Tasklist
1. Open your browser and navigate to:
   ```
   http://localhost:8080/tasklist
   ```
2. Log in using default credentials:
   - **Username**: `demo`
   - **Password**: `demo`

---

### Step 2: Submitting an Application to Generate Tasks
1. Open the CivicFlow Portal at `http://localhost:3000`.
2. Log in as an Applicant:
   - `rahul.sharma@example.com` / `password123`
3. Click **"New Permit Application"** and complete the 4 steps:
   - Step 1: Applicant Information
   - Step 2: Property & Building Specs (e.g., Commercial, 4 floors, 12,500 sq.ft.)
   - Step 3: Document Uploads
   - Step 4: Submit Application
4. The backend automatically starts the Camunda 8 process instance.
5. The **Document Verification** service task and **REST Outbound Connector** (Land Registry) execute automatically within 1–2 seconds.
6. The process reaches the **Parallel Gateway Split**, spawning **4 simultaneous User Tasks** in Tasklist!

---

### Step 3: Inspecting & Completing Tasks in Tasklist
1. Switch back to **Camunda Tasklist** (`http://localhost:8080/tasklist`).
2. Click on **"All open tasks"** on the left menu.
3. You will immediately see:
   - **Fire Safety Review**
   - **Water Department Review**
   - **Zoning Department Review**
   - **Environmental Review**
4. Click on any task (e.g. **Fire Safety Review**):
   - Click **"Claim"** (assign to yourself).
   - Camunda Tasklist renders the custom form:
     - Application number, applicant name, building type, area, and floor count are displayed (read-only).
     - Check the technical compliance boxes (Staircases, Hydrants, Emergency Access).
     - Select your decision: `APPROVED`, `REVISION_REQUESTED`, or `REJECTED`.
     - Enter officer inspection comments.
   - Click **"Complete Task"**.
5. Claim and complete the other three department reviews.

---

### Step 4: Tracking Process Tokens in Camunda Operate
To show your evaluator how Camunda 8 coordinates everything behind the scenes:
1. Open **Camunda Operate**:
   ```
   http://localhost:8080/operate
   ```
2. Credentials: `demo` / `demo`.
3. Click on **"Processes"** &rarr; select **"Municipal Building Permit Approval Process"**.
4. You will see:
   - Real-time heatmaps showing where tokens have passed.
   - All 4 parallel department reviews joined at the Parallel Join Gateway.
   - The token moving automatically into the **Calculate Municipal Permit Fee** Call Activity.
   - The token landing on the **Citizen / Architect Payment** User Task!

---

### Step 5: Completing Payment & Issuing Permit
1. In Tasklist, click on **Citizen / Architect Payment** (or complete it directly on the CivicFlow payment page at `http://localhost:3000`).
2. Review calculated fees (`totalFee`, `scrutinyFee`, `infrastructureFee`, `environmentalCess`).
3. Click **"Complete Task"**.
4. Camunda executes the `permit-generation-worker` Service Task.
5. In CivicFlow, the application status switches to **APPROVED & ISSUED**, and the citizen can download the cryptographic digital PDF permit!

---

## 4. Where the Form Files are Stored in the Project

The teacher can inspect the raw Camunda Form definitions directly:
- **Camunda Project Forms**: `civicflow/camunda/forms/*.form`
- **Spring Boot Resources**: `civicflow/backend/src/main/resources/forms/*.form`

Both Spring Boot (`CamundaWorkflowDeployer.java`) and Camunda Desktop Modeler auto-detect and deploy these forms to Camunda 8 upon startup.
