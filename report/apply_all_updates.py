import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from PIL import Image

doc_path = 'report/CivicFlow_Case_Study_Report_updated.docx'
doc = docx.Document('report/CivicFlow_Case_Study_Report.docx')

# ==========================================
# 1. Update Figure 2.1 Image Part and Extent
# ==========================================
print("Updating Figure 2.1 image...")
with open('report/figure2_1_final.png', 'rb') as f:
    new_bpmn_bytes = f.read()

part13 = doc.part.rels['rId13'].target_part
part13._blob = new_bpmn_bytes

# Update extent in P[102]
p102 = doc.paragraphs[102]
extents = p102._element.xpath('.//wp:extent')
a_exts = p102._element.xpath('.//a:ext')

# Target cx = 8782050 (9.60 inches), calculate cy based on (3913, 797)
new_w, new_h = 3913, 797
cx_val = 8782050
cy_val = int(cx_val * (new_h / new_w))

for ext in extents:
    ext.set('cx', str(cx_val))
    ext.set('cy', str(cy_val))

for a_ext in a_exts:
    a_ext.set('cx', str(cx_val))
    a_ext.set('cy', str(cy_val))

print(f"Figure 2.1 extent updated to cx={cx_val}, cy={cy_val}")

# ==========================================
# 2. Update Caption P[103] & Table 2.1
# ==========================================
p103 = doc.paragraphs[103]
p103.text = "Figure 2.1 – Main orchestration process as rendered from the deployed BPMN (bpmn-js). Document and land verification, parallel multi-instance departmental reviews with direct municipal administrator clearance, DMN decision evaluation, revision loop, fee Call Activity, payment retry loop and digital permit generation."

# Table 2 is Table 2.1
t2 = doc.tables[2]
# Row 7: Merge review entry
t2.rows[7].cells[0].text = "Gateway_ReviewEntry"
t2.rows[7].cells[1].text = "Exclusive gateway (merge)"
t2.rows[7].cells[2].text = "Merges initial submission flow and applicant revision loop into the departmental review phase"

# Row 8: Parallel multi-instance department review
t2.rows[8].cells[0].text = "Task_ParallelDepartmentReview"
t2.rows[8].cells[1].text = "Receive task (Parallel Multi-Instance |||)"
t2.rows[8].cells[2].text = "Statutory Department Reviews: 4 parallel instances (Fire Safety, Water Works, Zoning, Environmental) cleared directly via Municipal Admin portal"

# Row 11: Direct portal clearance
t2.rows[11].cells[0].text = "Message_DepartmentApproval"
t2.rows[11].cells[1].text = "Zeebe Message correlation"
t2.rows[11].cells[2].text = "Correlates administrator decisions for each department directly into the parallel instance branches"

# Row 12: Wait / Sync
t2.rows[12].cells[0].text = "Multi-Instance Parallel Join"
t2.rows[12].cells[1].text = "Parallel multi-instance completion"
t2.rows[12].cells[2].text = "Zeebe synchronises and closes all four parallel department review instances upon decision publication"

# Row 13: DMN business rule task
t2.rows[13].cells[0].text = "Task_EvaluateReviews"
t2.rows[13].cells[1].text = "Business rule task (DMN)"
t2.rows[13].cells[2].text = "Evaluates consolidated department decisions via review-decision-matrix.dmn into reviewDecision"

print("Table 2.1 and P[103] updated successfully.")

# ==========================================
# 3. Populate Table 14: Operate Deployed Processes
# ==========================================
print("Populating Table 14...")
t14 = doc.tables[14]
c14 = t14.rows[0].cells[0]
c14.text = ""  # clear placeholder
p_t14 = c14.paragraphs[0]
p_t14.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_t14 = p_t14.add_run()
run_t14.add_picture('report/t14_final.png', width=Inches(6.0))

p_cap14 = c14.add_paragraph()
p_cap14.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_cap14 = p_cap14.add_run("Figure 6.9 – Camunda Operate: Deployed Process Definitions (Process_MunicipalBuildingPermit and Process_MunicipalFeeCalculation active in Zeebe engine)")
r_cap14.font.name = "Calibri"
r_cap14.font.size = Pt(9.5)
r_cap14.font.italic = True
r_cap14.font.color.rgb = RGBColor(0x4b, 0x55, 0x63)

# ==========================================
# 4. Populate Table 15: Operate Completed Happy-Path Instance
# ==========================================
print("Populating Table 15...")
t15 = doc.tables[15]
c15 = t15.rows[0].cells[0]
c15.text = ""  # clear placeholder
p_t15 = c15.paragraphs[0]
p_t15.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_t15 = p_t15.add_run()
run_t15.add_picture('report/t15_final.png', width=Inches(6.0))

p_cap15 = c15.add_paragraph()
p_cap15.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_cap15 = p_cap15.add_run("Figure 6.10 – Camunda Operate: Instance History and Execution Path for Happy-Path Permit Approval (Scenario A, showing process variables and completed token milestones)")
r_cap15.font.name = "Calibri"
r_cap15.font.size = Pt(9.5)
r_cap15.font.italic = True
r_cap15.font.color.rgb = RGBColor(0x4b, 0x55, 0x63)

# ==========================================
# 5. Populate Table 16: Operate Scenario D Timer Escalation
# ==========================================
print("Populating Table 16...")
t16 = doc.tables[16]
c16 = t16.rows[0].cells[0]
c16.text = ""  # clear placeholder
p_t16 = c16.paragraphs[0]
p_t16.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_t16 = p_t16.add_run()
run_t16.add_picture('report/t16_final.png', width=Inches(5.0))

p_cap16 = c16.add_paragraph()
p_cap16.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_cap16 = p_cap16.add_run("Figure 6.11 – Camunda Operate: Scenario D – Non-Interrupting Timer Boundary Event (Timer_FireEscalation firing SLA timeout notification while department review remains active)")
r_cap16.font.name = "Calibri"
r_cap16.font.size = Pt(9.5)
r_cap16.font.italic = True
r_cap16.font.color.rgb = RGBColor(0x4b, 0x55, 0x63)

# ==========================================
# 6. Populate Table 17: Backend Runtime Log Excerpt
# ==========================================
print("Populating Table 17...")
t17 = doc.tables[17]
c17 = t17.rows[0].cells[0]
c17.text = ""  # clear placeholder

log_lines = [
    "2026-11-16T16:01:25.316+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : [ZeebeWorkerSubscriptionManager] Subscribing all job workers directly to Zeebe gateway...",
    "2026-11-16T16:01:25.324+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : Registered worker: document-verification-worker",
    "2026-11-16T16:01:25.324+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : Registered worker: land-registry-worker",
    "2026-11-16T16:01:25.325+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : Registered worker: department-escalation-worker",
    "2026-11-16T16:01:25.325+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : Registered worker: fee-calculation-worker",
    "2026-11-16T16:01:25.325+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : Registered worker: permit-generation-worker",
    "2026-11-16T16:01:25.325+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.w.ZeebeWorkerSubscriptionManager     : [ZeebeWorkerSubscriptionManager] All 5 core Zeebe Job Workers actively polling 127.0.0.1:26500!",
    "2026-11-16T16:01:26.429+05:30  INFO 8620 --- [civicflow-backend] [           main] c.c.config.CamundaWorkflowDeployer       : Successfully deployed 12 workflow resources and forms to Camunda 8! Deployment Key: 2251799814029915",
    "2026-11-16T16:05:05.976+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-1] c.civicflow.service.ApplicationService   : Started Camunda 8 Process Instance Key: 2251799814030556 for Application #CF-2026-5865",
    "2026-11-16T16:05:06.005+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Handling job 2251799814030568 for type 'document-verification-worker'",
    "2026-11-16T16:05:06.012+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.workflow.DocumentVerificationWorker  : [DocumentVerificationWorker] Starting Document Verification for Application ID: 21",
    "2026-11-16T16:05:06.051+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.service.NotificationAndAuditService  : [AUDIT] App #21: DOCUMENT_VERIFIED by Zeebe Worker (SYSTEM) -> Automated document integrity check passed successfully.",
    "2026-11-16T16:05:06.106+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Completed 'document-verification-worker' with variables: {surveyNumber=SURVEY-789-Z, applicationId=21, documentsValid=true}",
    "2026-11-16T16:05:06.277+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-4] c.c.controller.LandRegistryController    : [LandRegistryController] Received survey verification request for: SURVEY-789-Z",
    "2026-11-16T16:05:06.277+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-4] c.c.service.MockLandRegistryService      : Mock Land Registry verifying survey number: SURVEY-789-Z",
    "2026-11-16T16:05:23.254+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-6] com.civicflow.service.ReviewService      : [Zeebe Message] Published Message_DepartmentApproval for key 21_FIRE_SAFETY with fireReviewDecision=APPROVED",
    "2026-11-16T16:05:25.321+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-8] com.civicflow.service.ReviewService      : [Zeebe Message] Published Message_DepartmentApproval for key 21_WATER with waterReviewDecision=APPROVED",
    "2026-11-16T16:05:26.919+05:30  INFO 8620 --- [civicflow-backend] [io-8081-exec-10] com.civicflow.service.ReviewService      : [Zeebe Message] Published Message_DepartmentApproval for key 21_ZONING with zoningReviewDecision=APPROVED",
    "2026-11-16T16:05:28.248+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-2] com.civicflow.service.ReviewService      : [Zeebe Message] Published Message_DepartmentApproval for key 21_ENVIRONMENTAL with envReviewDecision=APPROVED",
    "2026-11-16T16:05:28.251+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Handling job 2251799814030735 for type 'fee-calculation-worker'",
    "2026-11-16T16:05:28.251+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.workflow.FeeCalculationWorker        : [Camunda Call Activity Worker] Calculating Permit Fee for Application ID: 21",
    "2026-11-16T16:05:28.270+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.service.NotificationAndAuditService  : [AUDIT] App #21: FEE_CALCULATED by Fee Call Activity Worker (SYSTEM) -> Permit fee computed as INR 58500.0 based on RESIDENTIAL specifications.",
    "2026-11-16T16:05:28.283+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Completed 'fee-calculation-worker' with variables: {totalFee=58500.0, calculatedFee=58500.0}",
    "2026-11-16T16:06:01.294+05:30  INFO 8620 --- [civicflow-backend] [nio-8081-exec-9] com.civicflow.service.PaymentService     : [Zeebe Message] Published Message_CitizenPayment for App #21 with paymentSuccess=true",
    "2026-11-16T16:06:01.298+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Handling job 2251799814030866 for type 'permit-generation-worker'",
    "2026-11-16T16:06:01.299+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.workflow.PermitGenerationWorker      : [Camunda Worker] Generating Official Permit & PDF for App ID: 21",
    "2026-11-16T16:06:01.365+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.service.PermitPdfGeneratorService    : Successfully generated permit PDF at: D:\\Workflow Project\\civicflow-storage\\permits\\PERMIT-MC-2026-1021.pdf",
    "2026-11-16T16:06:01.393+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.service.NotificationAndAuditService  : [AUDIT] App #21: PERMIT_GENERATED by Zeebe Worker (SYSTEM) -> Official municipal permit generated: PERMIT-MC-2026-1021",
    "2026-11-16T16:06:01.417+05:30  INFO 8620 --- [civicflow-backend] [pool-3-thread-1] c.c.w.ZeebeWorkerSubscriptionManager     : [Zeebe Job] Completed 'permit-generation-worker' with variables: {permitNumber=PERMIT-MC-2026-1021, permitGenerated=true}"
]

p_t17 = c17.paragraphs[0]
p_t17.alignment = WD_ALIGN_PARAGRAPH.LEFT

for idx, line in enumerate(log_lines):
    if idx > 0:
        p_line = c17.add_paragraph()
    else:
        p_line = p_t17
    p_line.paragraph_format.space_before = Pt(0)
    p_line.paragraph_format.space_after = Pt(1)
    p_line.paragraph_format.line_spacing = 1.05
    run = p_line.add_run(line)
    run.font.name = "Consolas"
    run.font.size = Pt(7.5)
    # Color coding
    if "Started Camunda 8" in line:
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1e, 0x40, 0xaf)  # deep blue
    elif "Handling job" in line or "Completed" in line:
        run.font.color.rgb = RGBColor(0x16, 0x65, 0x34)  # dark green
    elif "Published Message" in line:
        run.font.color.rgb = RGBColor(0x85, 0x4d, 0x0e)  # amber
    else:
        run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)  # dark gray

p_cap17 = c17.add_paragraph()
p_cap17.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_cap17.paragraph_format.space_before = Pt(6)
r_cap17 = p_cap17.add_run("Listing 6.1 – Spring Boot Backend Runtime Log: Zeebe Process Instance Initialization & Job Worker Execution (Application #CF-2026-5865)")
r_cap17.font.name = "Calibri"
r_cap17.font.size = Pt(9.5)
r_cap17.font.italic = True
r_cap17.font.color.rgb = RGBColor(0x4b, 0x55, 0x63)

print("Saving updated document...")
doc.save(doc_path)
print("Successfully saved:", doc_path)
