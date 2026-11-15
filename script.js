(() => {
  // Credentials are read from a local config.js file and are never committed.
  const config = window.TECHCARE_CONFIG || {};
  const API_URL = config.apiUrl;
  const USERNAME = config.username;
  const PASSWORD = config.password;

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { byId(id).textContent = value ?? "--"; };

  function showStatus(message) {
    const status = byId("statusMessage");
    if (status) status.textContent = message;
  }

  function showAllInformation(patient) {
    const container = byId("allInformation");
    const details = [
      ["Name", patient.name],
      ["Date of birth", patient.date_of_birth],
      ["Gender", patient.gender],
      ["Phone", patient.phone_number],
      ["Emergency contact", patient.emergency_contact],
      ["Insurance", patient.insurance_type]
    ];
    container.replaceChildren();
    details.forEach(([label, value]) => {
      const row = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label + ": ";
      row.append(strong, document.createTextNode(value || "--"));
      container.appendChild(row);
    });
    container.hidden = !container.hidden;
  }

  function renderPatient(patient) {
    setText("fullName", patient.name);
    setText("birthDate", patient.date_of_birth);
    setText("gender", patient.gender);
    setText("phone", patient.phone_number);
    setText("emergency", patient.emergency_contact);
    setText("insurance", patient.insurance_type);

    const avatar = byId("avatar");
    avatar.src = patient.profile_picture || "";
    avatar.alt = patient.name + " profile";

    const history = [...(patient.diagnosis_history || [])].sort((a, b) => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return a.year - b.year || months.indexOf(a.month) - months.indexOf(b.month);
    });

    const latest = history[history.length - 1];
    if (latest) {
      setText("respRate", latest.respiratory_rate.value + " bpm");
      setText("temp", latest.temperature.value + " °F");
      setText("heartRate", latest.heart_rate.value + " bpm");
      setText("respStatus", latest.respiratory_rate.levels || "Normal");
      setText("tempStatus", latest.temperature.levels || "Normal");
      setText("heartStatus", latest.heart_rate.levels || "Normal");
    }

    const tbody = byId("diagnosisTable");
    tbody.replaceChildren();
    (patient.diagnostic_list || []).forEach((item) => {
      const row = document.createElement("tr");
      [item.name, item.description, item.status].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value ?? "";
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });

    const ctx = byId("bloodPressureChart");
    if (window.dashboardChart) window.dashboardChart.destroy();
    window.dashboardChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map(item => item.month + " " + item.year),
        datasets: [
          {
            label: "Systolic",
            data: history.map(item => item.blood_pressure.systolic.value),
            borderColor: "#ff66c4",
            backgroundColor: "transparent",
            tension: 0.3
          },
          {
            label: "Diastolic",
            data: history.map(item => item.blood_pressure.diastolic.value),
            borderColor: "#7c3aed",
            backgroundColor: "transparent",
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: true } },
        scales: {
          y: { beginAtZero: false },
          x: { ticks: { maxTicksLimit: 6, maxRotation: 0 } }
        }
      }
    });

    byId("detailsBtn").onclick = () => showAllInformation(patient);
  }

  async function init() {
    if (!API_URL || !USERNAME || !PASSWORD) {
      showStatus("API settings are not configured. Copy config.example.js to config.js and add authorised credentials locally.");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: "Basic " + btoa(USERNAME + ":" + PASSWORD) }
      });
      if (!response.ok) throw new Error("API request failed: " + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected API response.");

      const patient = data.find(item => item.name === "Jessica Taylor");
      if (!patient) throw new Error("Jessica Taylor was not found in the API response.");
      renderPatient(patient);
      showStatus("");
    } catch (error) {
      console.error("Healthcare dashboard:", error);
      showStatus("Unable to load patient data. Check your connection and local API settings.");
    }
  }

  init();
})();