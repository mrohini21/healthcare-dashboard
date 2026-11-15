# CareBoard — Healthcare Dashboard

A responsive patient dashboard built with **HTML, CSS, JavaScript and Chart.js**. It retrieves sample patient records from an external API and displays patient profiles, diagnosis history, vital signs and diagnostic entries.

> **Important:** This is a portfolio/demo project using sample records. It is not a medical device or a clinical decision-support system. Do not use it for real patient care or enter real patient information.

## Features

- Fetches patient records from an external REST API.
- Searchable patient directory with interactive patient selection.
- Patient profile with demographic and contact details.
- Blood pressure history visualised with Chart.js.
- Latest respiratory rate, temperature and heart-rate readings.
- Diagnostic list rendered safely using DOM text properties.
- Loading, empty and error states for API requests.
- Responsive layout for desktop, tablet and mobile.
- Patient details dialog with accessible controls.

## Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Responsive layout and visual styling |
| JavaScript (ES6+) | API requests, state and DOM updates |
| Chart.js | Blood pressure trend visualisation |
| Fetch API | External patient-data integration |

## Project Structure

```text
healthcare-dashboard/
├── healthcare/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
├── config.example.js
└── README.md
```

## Run Locally

1. Clone the repository.
   ```bash
   git clone https://github.com/mrohini21/healthcare-dashboard.git
   cd healthcare-dashboard
   ```
2. Create a local `healthcare/config.js` file by copying `config.example.js`.
3. Add the API URL and credentials supplied for your API environment to `healthcare/config.js`.
4. Open `healthcare/index.html` with a local development server (for example, VS Code Live Server).
5. Confirm the API permits browser requests from your local origin (CORS).

The local `healthcare/config.js` file is ignored by Git. The example file contains placeholders only.

### API and credential security

This is a browser-only demo. Any credential placed in a frontend JavaScript file can be inspected by visitors, even if the file is excluded from Git. Use only public/demo credentials with no sensitive access. For a production application, move authentication and API requests to a backend service and keep secrets on the server.

## Implementation Notes

- API responses are checked for HTTP errors and expected array data.
- Patient information is inserted with `textContent` or DOM element creation rather than interpolated HTML.
- The chart is destroyed before a new patient's data is rendered to prevent duplicate chart instances.
- Missing fields are handled with readable fallback values.

## Author

**M. Rohini**

[GitHub](https://github.com/mrohini21) · [LinkedIn](https://www.linkedin.com/in/m-rohini-54a0a4206/)
