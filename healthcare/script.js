(() => {
  "use strict";

  const API_URL = window.HEALTHCARE_CONFIG?.apiUrl || "https://fedskillstest.coalitiontechnologies.workers.dev/";
  const credentials = window.HEALTHCARE_CONFIG?.credentials || null;
  const state = { patients: [], selectedPatient: null, chart: null };

  const byId = (id) => document.getElementById(id);
  const text = (id, value) => { byId(id).textContent = value ?? "Not available"; };
  const safeImage = (url) => {
    try {
      const parsed = new URL(url);
      return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
    } catch { return ""; }
  };

  function setStatus(message, type = "") {
    const node = byId("appStatus");
    node.className = `notice ${type}`.trim();
    node.replaceChildren();
    if (type !== "error") {
      const loader = document.createElement("span");
      loader.className = "loader";
      loader.setAttribute("aria-hidden", "true");
      if (type === "success") loader.style.display = "none";
      node.append(loader);
    }
    const label = document.createElement("span");
    label.textContent = message;
    node.append(label);
  }

  function formatDate(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", {day:"numeric", month:"short", year:"numeric"}).format(date);
  }

  function latestHistory(patient) {
    const history = Array.isArray(patient.diagnosis_history) ? patient.diagnosis_history : [];
    return [...history].sort((a,b) => (Number(a.year)*12 + monthNumber(a.month)) - (Number(b.year)*12 + monthNumber(b.month))).at(-1);
  }

  function monthNumber(month) {
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    return months.indexOf(String(month).toLowerCase()) + 1;
  }

  function renderPatientList(filter = "") {
    const list = byId("patientList");
    list.replaceChildren();
    const matches = state.patients.filter(p => String(p.name || "").toLowerCase().includes(filter.toLowerCase()));
    byId("patientCount").textContent = String(state.patients.length);
    if (!matches.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No matching patients found.";
      list.append(empty);
      return;
    }
    matches.forEach(patient => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("selected", patient === state.selectedPatient);
      button.setAttribute("aria-pressed", String(patient === state.selectedPatient));
      const avatar = document.createElement("img");
      avatar.src = safeImage(patient.profile_picture) || "https://placehold.co/72x72/e8eef5/667085?text=PT";
      avatar.alt = "";
      avatar.loading = "lazy";
      const details = document.createElement("span");
      const name = document.createElement("span");
      name.className = "patient-name";
      name.textContent = patient.name || "Unnamed patient";
      const meta = document.createElement("span");
      meta.className = "patient-meta";
      meta.textContent = patient.gender || "Patient";
      details.append(name, meta);
      button.append(avatar, details);
      button.addEventListener("click", () => selectPatient(patient));
      item.append(button);
      list.append(item);
    });
  }

  function selectPatient(patient) {
    state.selectedPatient = patient;
    renderPatientList(byId("patientSearch").value);
    renderProfile(patient);
    renderVitals(patient);
    renderDiagnostics(patient);
    renderChart(patient);
    byId("updatedLabel").textContent = `Viewing ${patient.name || "patient"} · Sample record`;
    byId("detailsButton").disabled = false;
  }

  function renderProfile(patient) {
    text("fullName", patient.name || "Unnamed patient");
    text("profileSubtitle", [patient.gender, patient.age ? `${patient.age} years` : null].filter(Boolean).join(" · ") || "Patient profile");
    text("birthDate", formatDate(patient.date_of_birth));
    text("gender", patient.gender);
    text("phone", patient.phone_number);
    text("emergency", patient.emergency_contact);
    text("insurance", patient.insurance_type);
    byId("avatar").src = safeImage(patient.profile_picture) || "https://placehold.co/112x112/e8eef5/667085?text=PT";
    byId("avatar").alt = `${patient.name || "Patient"} profile`;
  }

  function renderVitals(patient) {
    const latest = latestHistory(patient);
    const values = [
      ["respRate", latest?.respiratory_rate, "rpm", "respStatus"],
      ["temp", latest?.temperature, "°F", "tempStatus"],
      ["heartRate", latest?.heart_rate, "bpm", "heartStatus"]
    ];
    values.forEach(([id, reading, unit, statusId]) => {
      text(id, reading?.value != null ? `${reading.value} ${unit}` : "—");
      text(statusId, reading?.levels || "Latest available reading");
    });
  }

  function renderDiagnostics(patient) {
    const body = byId("diagnosisTable");
    body.replaceChildren();
    const diagnoses = Array.isArray(patient.diagnostic_list) ? patient.diagnostic_list : [];
    if (!diagnoses.length) {
      const row = body.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 3;
      cell.className = "empty-state";
      cell.textContent = "No diagnostic entries available.";
      return;
    }
    diagnoses.forEach(diagnosis => {
      const row = body.insertRow();
      [diagnosis.name, diagnosis.description].forEach(value => {
        const cell = row.insertCell();
        cell.textContent = value || "Not available";
      });
      const statusCell = row.insertCell();
      const badge = document.createElement("span");
      badge.className = "table-status";
      badge.textContent = diagnosis.status || "Not specified";
      statusCell.append(badge);
    });
  }

  function renderChart(patient) {
    const history = Array.isArray(patient.diagnosis_history) ? [...patient.diagnosis_history] : [];
    history.sort((a,b) => (Number(a.year)*12 + monthNumber(a.month)) - (Number(b.year)*12 + monthNumber(b.month)));
    const valid = history.filter(item => item.blood_pressure?.systolic?.value != null && item.blood_pressure?.diastolic?.value != null);
    const fallback = byId("chartFallback");
    if (state.chart) { state.chart.destroy(); state.chart = null; }
    if (!window.Chart || !valid.length) {
      fallback.style.display = "grid";
      fallback.textContent = window.Chart ? "No blood pressure history available." : "Chart library could not be loaded.";
      return;
    }
    fallback.style.display = "none";
    state.chart = new Chart(byId("bloodPressureChart"), {
      type: "line",
      data: {
        labels: valid.map(item => `${item.month} ${item.year}`),
        datasets: [
          {label:"Systolic",data:valid.map(item => item.blood_pressure.systolic.value),borderColor:"#df7fb6",backgroundColor:"#df7fb6",borderWidth:2,pointRadius:3,tension:.35},
          {label:"Diastolic",data:valid.map(item => item.blood_pressure.diastolic.value),borderColor:"#8977d5",backgroundColor:"#8977d5",borderWidth:2,pointRadius:3,tension:.35}
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:"index",intersect:false},
        plugins:{legend:{display:false},tooltip:{backgroundColor:"#202b3c",padding:10,titleFont:{family:"DM Sans"},bodyFont:{family:"DM Sans"}}},
        scales:{x:{grid:{display:false},ticks:{color:"#929dad",font:{size:10},maxRotation:0}},y:{grid:{color:"#f0f2f5"},ticks:{color:"#929dad",font:{size:10}},beginAtZero:false}}
      }
    });
  }

  function showAllInformation() {
    const patient = state.selectedPatient;
    if (!patient) return;
    const fields = [
      ["Name", patient.name], ["Date of birth", formatDate(patient.date_of_birth)],
      ["Gender", patient.gender], ["Age", patient.age], ["Phone", patient.phone_number],
      ["Emergency contact", patient.emergency_contact], ["Insurance", patient.insurance_type]
    ];
    const container = byId("additionalInfo");
    container.replaceChildren();
    fields.forEach(([label, value]) => {
      const block = document.createElement("div");
      const heading = document.createElement("span");
      heading.textContent = label;
      const content = document.createElement("strong");
      content.textContent = value ?? "Not available";
      block.append(heading, content);
      container.append(block);
    });
    byId("detailsDialog").showModal();
  }

  async function loadPatients() {
    setStatus("Connecting to patient records…");
    const headers = {};
    if (credentials?.username && credentials?.password) {
      headers.Authorization = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
    }
    try {
      const response = await fetch(API_URL, {headers, signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error(`The patient service returned HTTP ${response.status}.`);
      const data = await response.json();
      if (!Array.isArray(data) || !data.length) throw new Error("The patient service returned no patient records.");
      state.patients = data;
      renderPatientList();
      const initial = data.find(patient => patient.name === "Jessica Taylor") || data[0];
      selectPatient(initial);
      setStatus("Patient records loaded successfully. This is a demonstration interface, not a clinical system.", "success");
    } catch (error) {
      console.error("Unable to load patient records:", error);
      setStatus(`${error.message || "Unable to load patient records."} Check your connection and API configuration, then reload.`, "error");
      byId("patientList").replaceChildren();
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "Patient data is unavailable.";
      byId("patientList").append(empty);
      byId("chartFallback").style.display = "grid";
      byId("chartFallback").textContent = "Patient data is unavailable.";
    }
  }

  byId("patientSearch").addEventListener("input", event => renderPatientList(event.target.value));
  byId("detailsButton").addEventListener("click", showAllInformation);
  byId("closeDialog").addEventListener("click", () => byId("detailsDialog").close());
  byId("detailsDialog").addEventListener("click", event => {
    if (event.target === byId("detailsDialog")) byId("detailsDialog").close();
  });

  loadPatients();
})();
