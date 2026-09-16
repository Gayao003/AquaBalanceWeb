import { UserProfile, HealthProfile, IntakeRecord, OutputRecord } from "./firestore";

// Helper: Escape CSV fields safely
function escapeCSV(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

// Helper: Download a CSV string with UTF-8 BOM for Microsoft Excel compatibility
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper: Check if record timestamp falls within date filter
export function isWithinDateRange(timestamp: string, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return true;
  if (dateFrom && d < new Date(dateFrom + "T00:00:00")) return false;
  if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN DEFINITIONS FOR CUSTOM FIELD SELECTION
// ─────────────────────────────────────────────────────────────────────────────
export interface ColumnDef {
  id: string;
  label: string;
  defaultSelected: boolean;
  isTechnical?: boolean;
}

export const PATIENT_EXPORT_COLUMNS: ColumnDef[] = [
  { id: "name", label: "Patient Name", defaultSelected: true },
  { id: "email", label: "Patient Email", defaultSelected: true },
  { id: "limit", label: "Prescribed Limit (mL)", defaultSelected: true },
  { id: "conditions", label: "Diagnosed Conditions", defaultSelected: true },
  { id: "careTeam", label: "Assigned Care Team (Nurses)", defaultSelected: true },
  { id: "category", label: "Record Category (Intake/Output)", defaultSelected: true },
  { id: "subType", label: "Fluid / Output Type", defaultSelected: true },
  { id: "volume", label: "Volume (mL)", defaultSelected: true },
  { id: "shift", label: "Clinical Shift", defaultSelected: true },
  { id: "notes", label: "Care Notes", defaultSelected: true },
  { id: "dateTime", label: "Recorded Date & Time", defaultSelected: true },
  { id: "scheduleStatus", label: "Schedule Status", defaultSelected: false, isTechnical: true },
  { id: "patientId", label: "Patient ID (Database UID)", defaultSelected: false, isTechnical: true },
  { id: "isoTimestamp", label: "Raw ISO Timestamp", defaultSelected: false, isTechnical: true },
];

export const NURSE_EXPORT_COLUMNS: ColumnDef[] = [
  { id: "nurseName", label: "Supervising Nurse Name", defaultSelected: true },
  { id: "nurseEmail", label: "Nurse Email", defaultSelected: true },
  { id: "caseloadCount", label: "Active Caseload Count", defaultSelected: true },
  { id: "patientName", label: "Handled Patient Name", defaultSelected: true },
  { id: "patientEmail", label: "Handled Patient Email", defaultSelected: true },
  { id: "limit", label: "Prescribed Limit (mL)", defaultSelected: true },
  { id: "conditions", label: "Conditions", defaultSelected: true },
  { id: "periodTotals", label: "Period Intake/Output Totals", defaultSelected: true },
  { id: "category", label: "Record Category (Intake/Output)", defaultSelected: true },
  { id: "subType", label: "Fluid / Output Type", defaultSelected: true },
  { id: "volume", label: "Volume (mL)", defaultSelected: true },
  { id: "shift", label: "Clinical Shift", defaultSelected: true },
  { id: "notes", label: "Care Notes", defaultSelected: true },
  { id: "dateTime", label: "Recorded Date & Time", defaultSelected: true },
  { id: "scheduleStatus", label: "Schedule Status", defaultSelected: false, isTechnical: true },
  { id: "nurseId", label: "Nurse Staff ID (Database UID)", defaultSelected: false, isTechnical: true },
  { id: "patientId", label: "Patient ID (Database UID)", defaultSelected: false, isTechnical: true },
  { id: "isoTimestamp", label: "Raw ISO Timestamp", defaultSelected: false, isTechnical: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMPREHENSIVE CLINICAL ROSTER CSV EXPORT (TOP-BAR BUTTON)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportComprehensiveRosterCSV(
  users: UserProfile[],
  healthProfiles: HealthProfile[],
  allIntakes: IntakeRecord[],
  allOutputs: OutputRecord[]
) {
  const hpMap = new Map<string, HealthProfile>();
  healthProfiles.forEach((hp) => hpMap.set(hp.userId, hp));

  const nurseMap = new Map<string, UserProfile>();
  users.filter((u) => u.role === "nurse").forEach((n) => nurseMap.set(n.userId, n));

  const patientMap = new Map<string, UserProfile>();
  users.filter((u) => u.role === "patient").forEach((p) => patientMap.set(p.userId, p));

  const intakeSumMap = new Map<string, { totalMl: number; count: number }>();
  allIntakes.forEach((r) => {
    const curr = intakeSumMap.get(r.userId) || { totalMl: 0, count: 0 };
    curr.totalMl += r.volume || 0;
    curr.count += 1;
    intakeSumMap.set(r.userId, curr);
  });

  const outputSumMap = new Map<string, { totalMl: number; count: number }>();
  allOutputs.forEach((r) => {
    const curr = outputSumMap.get(r.userId) || { totalMl: 0, count: 0 };
    curr.totalMl += r.volume || 0;
    curr.count += 1;
    outputSumMap.set(r.userId, curr);
  });

  const headers = [
    "Full Name",
    "Email Address",
    "Role",
    "Account Status",
    "Age",
    "Preferred Volume Unit",
    "Prescribed Fluid Limit (mL)",
    "Diagnosed Conditions",
    "Schedule Locked by Nurse",
    "Assigned Care Team (Nurses)",
    "Handled Patients Count",
    "Handled Patients List",
    "Total Lifetime Intake (mL)",
    "Total Intake Entries Count",
    "Total Lifetime Output (mL)",
    "Total Output Entries Count",
    "Net Fluid Balance (mL)",
    "Date Joined",
    "Last Updated",
  ];

  const rows: string[] = [headers.map(escapeCSV).join(",")];

  for (const u of users) {
    const hp = hpMap.get(u.userId);
    const inStats = intakeSumMap.get(u.userId) || { totalMl: 0, count: 0 };
    const outStats = outputSumMap.get(u.userId) || { totalMl: 0, count: 0 };
    const netBalance = inStats.totalMl - outStats.totalMl;

    let assignedNurseNames = "—";
    if (u.role === "patient" && u.assignedNurseIds && u.assignedNurseIds.length > 0) {
      assignedNurseNames = u.assignedNurseIds
        .map((nid) => nurseMap.get(nid)?.name || nurseMap.get(nid)?.email || nid)
        .join("; ");
    }

    let handledCount = 0;
    let handledPatientNames = "—";
    if (u.role === "nurse") {
      const handledPatients = Array.from(patientMap.values()).filter(
        (p) => p.assignedNurseIds?.includes(u.userId) || u.assignedPatientIds?.includes(p.userId)
      );
      handledCount = handledPatients.length;
      if (handledCount > 0) {
        handledPatientNames = handledPatients.map((p) => `${p.name || "Unnamed"} (${p.email})`).join("; ");
      }
    }

    rows.push(
      [
        u.name || "—",
        u.email,
        (u.role || "unknown").toUpperCase(),
        u.isArchived ? "Archived" : "Active",
        u.age !== undefined && u.age !== null ? u.age : "—",
        u.volumeUnit || "ml",
        hp?.prescribedDailyFluidLimitMl ? `${hp.prescribedDailyFluidLimitMl} mL` : "None set",
        hp?.conditions?.length ? hp.conditions.join("; ") : "None recorded",
        u.role === "patient" ? (u.isScheduleLocked ? "Locked" : "Unlocked") : "N/A",
        assignedNurseNames,
        u.role === "nurse" ? handledCount : "N/A",
        handledPatientNames,
        inStats.totalMl,
        inStats.count,
        outStats.totalMl,
        outStats.count,
        netBalance,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
        u.lastUpdated ? new Date(u.lastUpdated).toLocaleDateString() : "—",
      ]
        .map(escapeCSV)
        .join(",")
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(rows.join("\r\n"), `aquabalance_clinical_roster_${dateStr}.csv`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PATIENT EXPORT: DEDICATED CSV & MEDICAL PDF WITH OPTIONAL COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
export interface PatientExportItem {
  patient: UserProfile;
  healthProfile: HealthProfile | null;
  assignedNurses: string[];
  intakes: IntakeRecord[];
  outputs: OutputRecord[];
}

export async function exportPatientLogsCSV(
  items: PatientExportItem[],
  dateFrom: string,
  dateTo: string,
  selectedColumnIds?: string[]
) {
  // Use selected columns or default to human-relevant columns
  const activeCols = PATIENT_EXPORT_COLUMNS.filter((col) =>
    selectedColumnIds ? selectedColumnIds.includes(col.id) : col.defaultSelected
  );

  const headers = activeCols.map((c) => c.label);
  const rows: string[] = [headers.map(escapeCSV).join(",")];

  for (const item of items) {
    const { patient, healthProfile, assignedNurses, intakes, outputs } = item;
    const limitStr = healthProfile?.prescribedDailyFluidLimitMl
      ? `${healthProfile.prescribedDailyFluidLimitMl} mL`
      : "None set";
    const condStr = healthProfile?.conditions?.length ? healthProfile.conditions.join("; ") : "None";
    const nursesStr = assignedNurses.length > 0 ? assignedNurses.join("; ") : "None assigned";
    const schedStr = patient.isScheduleLocked ? "Locked by Nurse" : "Unlocked";

    const combined = [
      ...intakes.map((i) => ({ ...i, category: "INTAKE", subType: i.fluidType })),
      ...outputs.map((o) => ({ ...o, category: "OUTPUT", subType: o.outputType })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (combined.length === 0) {
      const emptyRow = activeCols.map((col) => {
        if (col.id === "name") return patient.name || "—";
        if (col.id === "email") return patient.email;
        if (col.id === "patientId") return patient.userId;
        if (col.id === "limit") return limitStr;
        if (col.id === "conditions") return condStr;
        if (col.id === "careTeam") return nursesStr;
        if (col.id === "scheduleStatus") return schedStr;
        if (col.id === "category") return "NO RECORDS";
        if (col.id === "subType") return "No fluid logs in selected period";
        if (col.id === "volume") return 0;
        return "—";
      });
      rows.push(emptyRow.map(escapeCSV).join(","));
    } else {
      for (const record of combined) {
        const d = new Date(record.timestamp);
        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
        const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
        const formattedDateTime = !isNaN(d.getTime()) ? `${dateStr} ${timeStr}` : "—";

        const rowValues = activeCols.map((col) => {
          switch (col.id) {
            case "name":
              return patient.name || "—";
            case "email":
              return patient.email;
            case "patientId":
              return patient.userId;
            case "limit":
              return limitStr;
            case "conditions":
              return condStr;
            case "careTeam":
              return nursesStr;
            case "scheduleStatus":
              return schedStr;
            case "category":
              return record.category;
            case "subType":
              return record.subType;
            case "volume":
              return record.volume;
            case "shift":
              return record.shift || "Unspecified";
            case "notes":
              return record.notes || "—";
            case "dateTime":
              return formattedDateTime;
            case "isoTimestamp":
              return record.timestamp;
            default:
              return "";
          }
        });
        rows.push(rowValues.map(escapeCSV).join(","));
      }
    }
  }

  const dateLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : "all_dates";
  downloadCSV(rows.join("\r\n"), `aquabalance_patient_logs_${dateLabel}.csv`);
}

export async function exportPatientLogsPDF(
  items: PatientExportItem[],
  dateFrom: string,
  dateTo: string,
  selectedColumnIds?: string[]
) {
  const jsPDFModule = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const includePatientId = selectedColumnIds ? selectedColumnIds.includes("patientId") : false;
  const includeShift = selectedColumnIds ? selectedColumnIds.includes("shift") : true;
  const includeNotes = selectedColumnIds ? selectedColumnIds.includes("notes") : true;
  const includeConditions = selectedColumnIds ? selectedColumnIds.includes("conditions") : true;

  let isFirstPage = true;

  for (const item of items) {
    const { patient, healthProfile, assignedNurses, intakes, outputs } = item;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // Header Banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(2, 132, 199); // Sky
    doc.text("AquaBalance", 36, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("PATIENT CLINICAL FLUID ACTIVITY & MONITORING REPORT", 135, 30);

    const dateRangeLabel =
      dateFrom && dateTo ? `${dateFrom}  to  ${dateTo}` : dateFrom ? `From ${dateFrom}` : dateTo ? `To ${dateTo}` : "All Recorded History";

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`AUDIT DATE: ${new Date().toLocaleString()}`, pageWidth - 36, 22, { align: "right" });
    doc.text(`PERIOD: ${dateRangeLabel}`, pageWidth - 36, 34, { align: "right" });

    doc.setFillColor(2, 132, 199);
    doc.rect(0, 50, pageWidth, 3, "F");

    // Profile Card (clean without ugly ID if unchecked)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(36, 62, pageWidth - 72, 60, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(patient.name || "Unnamed Patient", 48, 82);

    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text("ROLE: PATIENT", 220, 82);

    if (patient.isScheduleLocked) {
      doc.setTextColor(217, 119, 6);
      doc.text("[SCHEDULE LOCKED BY NURSE]", 310, 82);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    const idSnippet = includePatientId ? `   |   Patient ID: ${patient.userId}` : "";
    doc.text(`Email: ${patient.email}${idSnippet}   |   Preferred Unit: ${patient.volumeUnit || "ml"}`, 48, 96);

    const conds = healthProfile?.conditions?.length ? healthProfile.conditions.join(", ") : "None recorded";
    const nurses = assignedNurses.length > 0 ? assignedNurses.join("; ") : "No assigned nurses";
    const condsText = includeConditions ? `   |   Conditions: ${conds}` : "";
    doc.text(`Care Team: ${nurses}${condsText}`, 48, 110);

    // KPI Summary
    const cardWidth = (pageWidth - 72 - 30) / 4;
    const cardY = 130;

    const totalIntakeMl = intakes.reduce((s, r) => s + (r.volume || 0), 0);
    const totalOutputMl = outputs.reduce((s, r) => s + (r.volume || 0), 0);
    const netBalanceMl = totalIntakeMl - totalOutputMl;
    const prescribedLimit = healthProfile?.prescribedDailyFluidLimitMl;

    const kpis = [
      { label: "TOTAL FLUID INTAKE", val: `${totalIntakeMl.toLocaleString()} mL`, sub: `${intakes.length} recorded drink${intakes.length === 1 ? "" : "s"}`, color: [2, 132, 199] },
      { label: "TOTAL FLUID OUTPUT", val: `${totalOutputMl.toLocaleString()} mL`, sub: `${outputs.length} recorded output${outputs.length === 1 ? "" : "s"}`, color: [5, 150, 105] },
      { label: "NET FLUID BALANCE", val: `${netBalanceMl >= 0 ? "+" : ""}${netBalanceMl.toLocaleString()} mL`, sub: netBalanceMl > 0 ? "Positive fluid retention" : "Negative / fluid deficit", color: netBalanceMl > 0 ? [217, 119, 6] : [5, 150, 105] },
      { label: "PRESCRIBED LIMIT", val: prescribedLimit ? `${prescribedLimit.toLocaleString()} mL` : "None set", sub: prescribedLimit ? "Daily target limit" : "Standard care guidelines", color: [99, 102, 241] },
    ];

    kpis.forEach((kpi, idx) => {
      const x = 36 + idx * (cardWidth + 10);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cardY, cardWidth, 46, 3, 3, "FD");

      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.rect(x, cardY, 3.5, 46, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + 10, cardY + 13);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.val, x + 10, cardY + 28);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.sub, x + 10, cardY + 39);
    });

    // Dynamic autoTable columns based on selected columns
    const allEntries = [
      ...intakes.map((r) => ({ timestamp: r.timestamp, category: "INTAKE", subType: r.fluidType || "Drink", volume: r.volume, shift: r.shift || "—", notes: r.notes || "—" })),
      ...outputs.map((r) => ({ timestamp: r.timestamp, category: "OUTPUT", subType: r.outputType || "Output", volume: r.volume, shift: r.shift || "—", notes: r.notes || "—" })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Build Table Header & Column Styles dynamically
    const tableHead: string[] = ["Timestamp", "Category", "Sub-Type", "Volume (mL)"];
    if (includeShift) tableHead.push("Shift");
    if (includeNotes) tableHead.push("Clinical Notes / Observations");

    const tableRows = allEntries.map((e) => {
      const d = new Date(e.timestamp);
      const formatted = !isNaN(d.getTime()) ? d.toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—";
      const row: string[] = [formatted, e.category, e.subType, `${(e.volume || 0).toLocaleString()} mL`];
      if (includeShift) row.push(e.shift);
      if (includeNotes) row.push(e.notes);
      return row;
    });

    autoTable(doc, {
      startY: 186,
      head: [tableHead],
      body: tableRows.length > 0 ? tableRows : [["—", "NO RECORDS", "No fluid intake or output logged in selected period", "0 mL", ...(includeShift ? ["—"] : []), ...(includeNotes ? ["—"] : [])]],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "left", cellPadding: 4.5 },
      bodyStyles: { textColor: [30, 41, 59], fontSize: 7.5, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        2: { cellWidth: 130 },
        3: { cellWidth: 85, halign: "right", fontStyle: "bold" },
        ...(includeShift ? { 4: { cellWidth: 75, halign: "center" } } : {}),
        ...(includeNotes ? { [includeShift ? 5 : 4]: { cellWidth: "auto" } } : {}),
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 1) {
          if (data.cell.raw === "INTAKE") data.cell.styles.textColor = [2, 132, 199];
          else if (data.cell.raw === "OUTPUT") data.cell.styles.textColor = [5, 150, 105];
        }
      },
      margin: { left: 36, right: 36, bottom: 35 },
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(36, pageHeight - 22, pageWidth - 36, pageHeight - 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("AquaBalance Healthcare Portal  |  Patient Fluid Record Audit", 36, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 36, pageHeight - 10, { align: "right" });
  }

  const dateLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : "all_dates";
  doc.save(`aquabalance_patient_report_${dateLabel}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NURSE EXPORT: DEDICATED CASELOAD CSV & MONITORING PDF WITH OPTIONAL COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
export interface NurseHandledPatientRecord {
  patient: UserProfile;
  healthProfile: HealthProfile | null;
  intakes: IntakeRecord[];
  outputs: OutputRecord[];
}

export interface NurseCaseloadExportItem {
  nurse: UserProfile;
  totalCaseloadCount: number;
  handledPatients: NurseHandledPatientRecord[];
}

export async function exportNurseCaseloadCSV(
  items: NurseCaseloadExportItem[],
  dateFrom: string,
  dateTo: string,
  selectedColumnIds?: string[]
) {
  const activeCols = NURSE_EXPORT_COLUMNS.filter((col) =>
    selectedColumnIds ? selectedColumnIds.includes(col.id) : col.defaultSelected
  );

  const headers = activeCols.map((c) => c.label);
  const rows: string[] = [headers.map(escapeCSV).join(",")];

  for (const item of items) {
    const { nurse, totalCaseloadCount, handledPatients } = item;

    if (handledPatients.length === 0) {
      const emptyRow = activeCols.map((col) => {
        if (col.id === "nurseName") return nurse.name || "—";
        if (col.id === "nurseEmail") return nurse.email;
        if (col.id === "nurseId") return nurse.userId;
        if (col.id === "caseloadCount") return totalCaseloadCount;
        if (col.id === "patientName") return "NO PATIENTS SELECTED";
        if (col.id === "category") return "NO RECORDS";
        if (col.id === "subType") return "Caseload summary only";
        return "—";
      });
      rows.push(emptyRow.map(escapeCSV).join(","));
    } else {
      for (const hp of handledPatients) {
        const { patient, healthProfile, intakes, outputs } = hp;
        const pTotalIntake = intakes.reduce((s, r) => s + (r.volume || 0), 0);
        const pTotalOutput = outputs.reduce((s, r) => s + (r.volume || 0), 0);
        const pNet = pTotalIntake - pTotalOutput;
        const limitStr = healthProfile?.prescribedDailyFluidLimitMl
          ? `${healthProfile.prescribedDailyFluidLimitMl} mL`
          : "None set";
        const condStr = healthProfile?.conditions?.length ? healthProfile.conditions.join("; ") : "None";
        const schedStr = patient.isScheduleLocked ? "Locked by Nurse" : "Unlocked";
        const totalsStr = `Intake: ${pTotalIntake}mL | Output: ${pTotalOutput}mL | Net: ${pNet}mL`;

        const combined = [
          ...intakes.map((i) => ({ ...i, category: "INTAKE", subType: i.fluidType })),
          ...outputs.map((o) => ({ ...o, category: "OUTPUT", subType: o.outputType })),
        ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (combined.length === 0) {
          const emptyRow = activeCols.map((col) => {
            switch (col.id) {
              case "nurseName": return nurse.name || "—";
              case "nurseEmail": return nurse.email;
              case "nurseId": return nurse.userId;
              case "caseloadCount": return totalCaseloadCount;
              case "patientName": return patient.name || "—";
              case "patientEmail": return patient.email;
              case "patientId": return patient.userId;
              case "limit": return limitStr;
              case "conditions": return condStr;
              case "periodTotals": return totalsStr;
              case "scheduleStatus": return schedStr;
              case "category": return "NO RECORDS";
              case "subType": return "No logs in selected date range";
              case "volume": return 0;
              default: return "—";
            }
          });
          rows.push(emptyRow.map(escapeCSV).join(","));
        } else {
          for (const record of combined) {
            const d = new Date(record.timestamp);
            const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : "—";
            const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
            const formattedDateTime = !isNaN(d.getTime()) ? `${dateStr} ${timeStr}` : "—";

            const rowValues = activeCols.map((col) => {
              switch (col.id) {
                case "nurseName": return nurse.name || "—";
                case "nurseEmail": return nurse.email;
                case "nurseId": return nurse.userId;
                case "caseloadCount": return totalCaseloadCount;
                case "patientName": return patient.name || "—";
                case "patientEmail": return patient.email;
                case "patientId": return patient.userId;
                case "limit": return limitStr;
                case "conditions": return condStr;
                case "periodTotals": return totalsStr;
                case "scheduleStatus": return schedStr;
                case "category": return record.category;
                case "subType": return record.subType;
                case "volume": return record.volume;
                case "shift": return record.shift || "Unspecified";
                case "notes": return record.notes || "—";
                case "dateTime": return formattedDateTime;
                case "isoTimestamp": return record.timestamp;
                default: return "";
              }
            });
            rows.push(rowValues.map(escapeCSV).join(","));
          }
        }
      }
    }
  }

  const dateLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : "all_dates";
  downloadCSV(rows.join("\r\n"), `aquabalance_nurse_caseload_${dateLabel}.csv`);
}

export async function exportNurseCaseloadPDF(
  items: NurseCaseloadExportItem[],
  dateFrom: string,
  dateTo: string,
  selectedColumnIds?: string[]
) {
  const jsPDFModule = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const includeNurseId = selectedColumnIds ? selectedColumnIds.includes("nurseId") : false;
  const includeShift = selectedColumnIds ? selectedColumnIds.includes("shift") : true;
  const includeNotes = selectedColumnIds ? selectedColumnIds.includes("notes") : true;

  let isFirstPage = true;

  for (const item of items) {
    const { nurse, totalCaseloadCount, handledPatients } = item;

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // Header Banner
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text("AquaBalance", 36, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("NURSE CASELOAD & CLINICAL SHIFT MONITORING REPORT", 135, 30);

    const dateRangeLabel =
      dateFrom && dateTo ? `${dateFrom}  to  ${dateTo}` : dateFrom ? `From ${dateFrom}` : dateTo ? `To ${dateTo}` : "All Recorded History";

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`AUDIT DATE: ${new Date().toLocaleString()}`, pageWidth - 36, 22, { align: "right" });
    doc.text(`PERIOD: ${dateRangeLabel}`, pageWidth - 36, 34, { align: "right" });

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 50, pageWidth, 3, "F");

    // Nurse Profile Card (clean without ugly ID if unchecked)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(36, 62, pageWidth - 72, 54, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(nurse.name || "Nurse Staff", 48, 82);

    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text("ROLE: CLINICAL NURSE", 220, 82);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    const nurseIdSnippet = includeNurseId ? `   |   Staff ID: ${nurse.userId}` : "";
    doc.text(`Email: ${nurse.email}${nurseIdSnippet}`, 48, 96);
    doc.text(`Assigned Patient Caseload: ${totalCaseloadCount} patient${totalCaseloadCount !== 1 ? "s" : ""}   |   Included in this Report: ${handledPatients.length} patient${handledPatients.length !== 1 ? "s" : ""}`, 48, 108);

    // Section 1: Caseload Overview Table
    const overviewRows = handledPatients.map((hp) => {
      const pIn = hp.intakes.reduce((s, r) => s + (r.volume || 0), 0);
      const pOut = hp.outputs.reduce((s, r) => s + (r.volume || 0), 0);
      const pNet = pIn - pOut;
      const limit = hp.healthProfile?.prescribedDailyFluidLimitMl;
      return [
        hp.patient.name || "Unnamed",
        hp.patient.email,
        limit ? `${limit.toLocaleString()} mL` : "None",
        `${pIn.toLocaleString()} mL`,
        `${pOut.toLocaleString()} mL`,
        `${pNet >= 0 ? "+" : ""}${pNet.toLocaleString()} mL`,
        hp.patient.isScheduleLocked ? "Locked" : "Unlocked",
      ];
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("CASELOAD FLUID MONITORING SUMMARY", 36, 132);

    autoTable(doc, {
      startY: 138,
      head: [["Patient Name", "Email Address", "Target Limit", "Period Intake", "Period Output", "Net Balance", "Schedule Status"]],
      body:
        overviewRows.length > 0
          ? overviewRows
          : [["No handled patients selected", "—", "—", "0 mL", "0 mL", "0 mL", "—"]],
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, halign: "left", cellPadding: 4 },
      bodyStyles: { textColor: [30, 41, 59], fontSize: 7.5, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold" },
        1: { cellWidth: 150 },
        2: { cellWidth: 80, halign: "right" },
        3: { cellWidth: 85, halign: "right" },
        4: { cellWidth: 85, halign: "right" },
        5: { cellWidth: 85, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 80, halign: "center" },
      },
      margin: { left: 36, right: 36 },
    });

    // Section 2: Detailed Handled Patients Logs
    let nextY = (doc as any).lastAutoTable.finalY + 20;

    for (const hp of handledPatients) {
      if (nextY > pageHeight - 160) {
        doc.addPage();
        nextY = 40;
      }

      const { patient, healthProfile, intakes, outputs } = hp;
      const allEntries = [
        ...intakes.map((r) => ({ timestamp: r.timestamp, category: "INTAKE", subType: r.fluidType || "Drink", volume: r.volume, shift: r.shift || "—", notes: r.notes || "—" })),
        ...outputs.map((r) => ({ timestamp: r.timestamp, category: "OUTPUT", subType: r.outputType || "Output", volume: r.volume, shift: r.shift || "—", notes: r.notes || "—" })),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Patient sub-header
      doc.setFillColor(241, 245, 249);
      doc.rect(36, nextY, pageWidth - 72, 22, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Patient: ${patient.name || "Unnamed"} (${patient.email})`, 44, nextY + 14);

      const conds = healthProfile?.conditions?.length ? healthProfile.conditions.join(", ") : "No conditions recorded";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Conditions: ${conds}   |   Prescribed Limit: ${healthProfile?.prescribedDailyFluidLimitMl ? healthProfile.prescribedDailyFluidLimitMl + " mL" : "None"}`, pageWidth - 44, nextY + 14, { align: "right" });

      const tableHead: string[] = ["Timestamp", "Category", "Sub-Type", "Volume"];
      if (includeShift) tableHead.push("Shift");
      if (includeNotes) tableHead.push("Clinical Notes / Observations");

      const patientLogRows = allEntries.map((e) => {
        const d = new Date(e.timestamp);
        const formatted = !isNaN(d.getTime()) ? d.toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—";
        const row: string[] = [formatted, e.category, e.subType, `${(e.volume || 0).toLocaleString()} mL`];
        if (includeShift) row.push(e.shift);
        if (includeNotes) row.push(e.notes);
        return row;
      });

      autoTable(doc, {
        startY: nextY + 24,
        head: [tableHead],
        body:
          patientLogRows.length > 0
            ? patientLogRows
            : [["—", "NO RECORDS", "No fluid entries logged in selected period", "0 mL", ...(includeShift ? ["—"] : []), ...(includeNotes ? ["—"] : [])]],
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5, cellPadding: 3.5 },
        bodyStyles: { textColor: [30, 41, 59], fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 105 },
          1: { cellWidth: 65, halign: "center", fontStyle: "bold" },
          2: { cellWidth: 120 },
          3: { cellWidth: 80, halign: "right", fontStyle: "bold" },
          ...(includeShift ? { 4: { cellWidth: 70, halign: "center" } } : {}),
          ...(includeNotes ? { [includeShift ? 5 : 4]: { cellWidth: "auto" } } : {}),
        },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 1) {
            if (data.cell.raw === "INTAKE") data.cell.styles.textColor = [2, 132, 199];
            else if (data.cell.raw === "OUTPUT") data.cell.styles.textColor = [5, 150, 105];
          }
        },
        margin: { left: 36, right: 36, bottom: 35 },
      });

      nextY = (doc as any).lastAutoTable.finalY + 16;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(36, pageHeight - 22, pageWidth - 36, pageHeight - 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("AquaBalance Healthcare Portal  |  Nurse Caseload Shift Audit", 36, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 36, pageHeight - 10, { align: "right" });
  }

  const dateLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : dateFrom ? `from_${dateFrom}` : "all_dates";
  doc.save(`aquabalance_nurse_caseload_report_${dateLabel}.pdf`);
}
