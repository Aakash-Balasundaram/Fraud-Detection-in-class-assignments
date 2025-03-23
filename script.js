<script >
export function initializeDashboard() {
  // All the code inside document.addEventListener("DOMContentLoaded", ...)

document.addEventListener("DOMContentLoaded", function () {
  // Initialize variables
  let assignments = [];
  let assignmentData = {};
  let aiThreshold = 50;
  let plagiarismThreshold = 30;
  let aiChart, plagiarismChart, trendsChart;

  // Show loading indicator
  function showLoading() {
    document.getElementById("loading").style.display = "flex";
  }

  // Hide loading indicator
  function hideLoading() {
    document.getElementById("loading").style.display = "none";
  }

  // Initialize threshold sliders
  const aiThresholdSlider = document.getElementById("ai-threshold");
  const aiThresholdValue = document.getElementById("ai-threshold-value");
  const plagiarismThresholdSlider = document.getElementById(
    "plagiarism-threshold"
  );
  const plagiarismThresholdValue = document.getElementById(
    "plagiarism-threshold-value"
  );

  aiThresholdSlider.addEventListener("input", function () {
    aiThresholdValue.textContent = this.value + "%";
  });

  plagiarismThresholdSlider.addEventListener("input", function () {
    plagiarismThresholdValue.textContent = this.value + "%";
  });

  document
    .getElementById("apply-thresholds")
    .addEventListener("click", function () {
      aiThreshold = parseInt(aiThresholdSlider.value);
      plagiarismThreshold = parseInt(plagiarismThresholdSlider.value);
      updateDashboard();
    });

  // Get all assignments from the database
  function fetchAssignments() {
    showLoading();

    // Make an AJAX request to your backend API
    fetch("/api/assignments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Process the data from the API
        if (data.assignments) {
          // Clear previous data
          assignments = [];
          assignmentData = {};

          // Process the data from the API format to our local format
          Object.entries(data.assignments).forEach(([key, value]) => {
            // Add to assignments array
            assignments.push(key);

            // Add to assignmentData object
            assignmentData[key] = value;
          });

          renderAssignments();
          updateDashboard();
        } else {
          console.error("Invalid data format received from API");
          document.getElementById("assignments-container").innerHTML =
            '<div class="col-span-full text-center text-gray-500 py-12"><p>Error loading data. Please try again later.</p></div>';
        }
      })
      .catch((error) => {
        console.error("Error fetching assignments:", error);
        document.getElementById("assignments-container").innerHTML =
          '<div class="col-span-full text-center text-gray-500 py-12"><p>Error loading data. Please try again later.</p></div>';
      })
      .finally(() => {
        hideLoading();
      });
  }

  // Render assignment cards
  function renderAssignments() {
    const container = document.getElementById("assignments-container");
    container.innerHTML = "";

    if (assignments.length === 0) {
      container.innerHTML =
        '<div class="col-span-full text-center text-gray-500 py-12"><p>No assignments found.</p></div>';
      return;
    }

    assignments.forEach((assignment, index) => {
      const data = assignmentData[assignment] || [];

      // Count submissions above threshold
      const totalSubmissions = data.length;
      const highAICount = data.filter(
        (item) => item.ai_percentage >= aiThreshold
      ).length;
      const highPlagiarismCount = data.filter(
        (item) => item.plagiarism_percentage >= plagiarismThreshold
      ).length;

      // Calculate percentages
      const aiPercentage = totalSubmissions
        ? ((highAICount / totalSubmissions) * 100).toFixed(1)
        : 0;
      const plagiarismPercentage = totalSubmissions
        ? ((highPlagiarismCount / totalSubmissions) * 100).toFixed(1)
        : 0;

      // Create assignment card
      const card = document.createElement("div");
      card.className =
        "assignment-card bg-white rounded-lg card-shadow overflow-hidden";

      // Card Header
      const header = document.createElement("div");
      header.className =
        "p-4 border-b cursor-pointer assignment-header flex justify-between items-center";
      header.innerHTML = `
          <div>
              <h3 class="font-bold text-gray-800">${formatAssignmentName(
                assignment
              )}</h3>
              <div class="text-sm text-gray-600">${totalSubmissions} submissions</div>
          </div>
          <div class="text-gray-400">
              <i class="fas fa-chevron-down"></i>
          </div>
      `;

      // Card Stats
      const stats = document.createElement("div");
      stats.className = "p-4 bg-gray-50 grid grid-cols-2 gap-4";
      stats.innerHTML = `
          <div>
              <div class="text-xs text-gray-500">AI Content</div>
              <div class="text-lg font-semibold ${
                highAICount > 0 ? "text-red-600" : "text-green-600"
              }">
                  ${aiPercentage}% (${highAICount}/${totalSubmissions})
              </div>
          </div>
          <div>
              <div class="text-xs text-gray-500">Plagiarism</div>
              <div class="text-lg font-semibold ${
                highPlagiarismCount > 0
                  ? "text-yellow-600"
                  : "text-green-600"
              }">
                  ${plagiarismPercentage}% (${highPlagiarismCount}/${totalSubmissions})
              </div>
          </div>
      `;

      // Collapsible Content
      const content = document.createElement("div");
      content.className = "collapsible-content";

      // Table Content
      const tableContent = document.createElement("div");
      tableContent.className = "p-4";

      if (data.length === 0) {
        tableContent.innerHTML =
          '<p class="text-gray-500 text-center">No data available</p>';
      } else {
        let tableHTML = `
              <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                          <tr>
                              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI %</th>
                              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plagiarism %</th>
                          </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
          `;

        data.forEach((item) => {
          tableHTML += `
                  <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
                        item.id
                      }</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
                        item.file_name
                      }</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm ${
                        item.ai_percentage >= aiThreshold
                          ? "text-red-600 font-semibold"
                          : "text-gray-900"
                      }">${item.ai_percentage.toFixed(1)}%</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm ${
                        item.plagiarism_percentage >= plagiarismThreshold
                          ? "text-yellow-600 font-semibold"
                          : "text-gray-900"
                      }">${item.plagiarism_percentage.toFixed(1)}%</td>
                  </tr>
              `;
        });

        tableHTML += `
                      </tbody>
                  </table>
              </div>
          `;

        tableContent.innerHTML = tableHTML;
      }

      content.appendChild(tableContent);

      // Append card elements
      card.appendChild(header);
      card.appendChild(stats);
      card.appendChild(content);
      container.appendChild(card);

      // Add click event to header
      header.addEventListener("click", function () {
        const icon = this.querySelector(".fas");
        icon.classList.toggle("fa-chevron-down");
        icon.classList.toggle("fa-chevron-up");
        content.classList.toggle("expanded");
      });
    });
  }

  // Format assignment name
  function formatAssignmentName(name) {
    // If the name already has spaces, just return it
    if (name.includes(" ")) {
      return name;
    }
    // Otherwise replace underscores with spaces
    return name.replace(/_/g, " ");
  }

  // Update dashboard stats and charts
  function updateDashboard() {
    let totalAssignments = assignments.length;
    let totalHighAI = 0;
    let totalHighPlagiarism = 0;
    let assignmentLabels = [];
    let aiData = [];
    let plagiarismData = [];

    // Calculate total counts
    assignments.forEach((assignment) => {
      const data = assignmentData[assignment] || [];
      const highAICount = data.filter(
        (item) => item.ai_percentage >= aiThreshold
      ).length;
      const highPlagiarismCount = data.filter(
        (item) => item.plagiarism_percentage >= plagiarismThreshold
      ).length;

      totalHighAI += highAICount;
      totalHighPlagiarism += highPlagiarismCount;

      // Prepare data for charts
      assignmentLabels.push(formatAssignmentName(assignment));
      aiData.push(highAICount);
      plagiarismData.push(highPlagiarismCount);
    });

    // Update dashboard stats
    document.getElementById("total-assignments").textContent =
      totalAssignments;
    document.getElementById("high-ai-count").textContent = totalHighAI;
    document.getElementById("high-plagiarism-count").textContent =
      totalHighPlagiarism;

    // Update charts
    updateCharts(assignmentLabels, aiData, plagiarismData);

    // Re-render assignments with new thresholds
    renderAssignments();
  }

  // Initialize and update charts
  function updateCharts(labels, aiData, plagiarismData) {
    // Destroy existing charts if they exist
    if (aiChart) aiChart.destroy();
    if (plagiarismChart) plagiarismChart.destroy();
    if (trendsChart) trendsChart.destroy();

    // Create AI Detection Chart
    const aiCtx = document.getElementById("aiChart").getContext("2d");
    aiChart = new Chart(aiCtx, {
      type: "bar",
      data: {
        labels: ["Low AI", "High AI"],
        datasets: [
          {
            label: "Submissions",
            data: [
              getTotalSubmissions() - aiData.reduce((a, b) => a + b, 0),
              aiData.reduce((a, b) => a + b, 0),
            ],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(255, 99, 132, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const total = getTotalSubmissions();
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value} submissions (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Create Plagiarism Chart
    const plagiarismCtx = document
      .getElementById("plagiarismChart")
      .getContext("2d");
    plagiarismChart = new Chart(plagiarismCtx, {
      type: "bar",
      data: {
        labels: ["Low Plagiarism", "High Plagiarism"],
        datasets: [
          {
            label: "Submissions",
            data: [
              getTotalSubmissions() -
                plagiarismData.reduce((a, b) => a + b, 0),
              plagiarismData.reduce((a, b) => a + b, 0),
            ],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 159, 64, 0.6)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const total = getTotalSubmissions();
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value} submissions (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Create Trends Chart
    const trendsCtx = document
      .getElementById("trendsChart")
      .getContext("2d");
    trendsChart = new Chart(trendsCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "High AI Content",
            data: aiData,
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
          {
            label: "High Plagiarism",
            data: plagiarismData,
            backgroundColor: "rgba(255, 159, 64, 0.6)",
            borderColor: "rgba(255, 159, 64, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                let total = 0;
                const dataIndex = context.dataIndex;
                const assignment = labels[dataIndex];
                const assignmentKey = assignments.find(
                  (key) => formatAssignmentName(key) === assignment
                );

                if (assignmentKey) {
                  total = assignmentData[assignmentKey].length;
                }

                const percentage = total
                  ? ((value / total) * 100).toFixed(1)
                  : 0;
                return `${value} submissions (${percentage}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Submissions",
            },
          },
        },
      },
    });
    prepareChartsForExport();
  }

  // Get total number of submissions
  function getTotalSubmissions() {
    let total = 0;
    Object.values(assignmentData).forEach((data) => {
      total += data.length;
    });
    return total;
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all tabs
      tabButtons.forEach((btn) => btn.classList.remove("tab-active"));
      tabContents.forEach((content) => content.classList.add("hidden"));

      // Add active class to clicked tab
      this.classList.add("tab-active");

      // Show corresponding content
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId + "-tab").classList.remove("hidden");
    });
  });

  // Generate mock data for demo purposes
  function generateMockData() {
    const mockAssignments = {
      Assignment_1: [],
      Assignment_2: [],
      Final_Project: [],
      Midterm_Essay: [],
      Research_Paper: [],
    };

    // Function to generate random submissions
    const generateSubmissions = (count) => {
      const submissions = [];
      for (let i = 1; i <= count; i++) {
        submissions.push({
          id: `S${i.toString().padStart(3, "0")}`,
          file_name: `submission_${i}.pdf`,
          ai_percentage: Math.random() * 100,
          plagiarism_percentage: Math.random() * 100,
        });
      }
      return submissions;
    };

    // Generate random number of submissions for each assignment
    mockAssignments["Assignment_1"] = generateSubmissions(25);
    mockAssignments["Assignment_2"] = generateSubmissions(23);
    mockAssignments["Final_Project"] = generateSubmissions(21);
    mockAssignments["Midterm_Essay"] = generateSubmissions(24);
    mockAssignments["Research_Paper"] = generateSubmissions(22);

    return { assignments: mockAssignments };
  }

  // For demo purposes, use mock data
  function fetchMockData() {
    showLoading();

    // Simulate network delay
    setTimeout(() => {
      const data = generateMockData();

      // Process the mock data
      if (data.assignments) {
        // Clear previous data
        assignments = [];
        assignmentData = {};

        // Process the data to our local format
        Object.entries(data.assignments).forEach(([key, value]) => {
          // Add to assignments array
          assignments.push(key);

          // Add to assignmentData object
          assignmentData[key] = value;
        });

        renderAssignments();
        updateDashboard();
      }

      hideLoading();
    }, 1000);
  }
  // PDF Download functionality
  document.getElementById('download-pdf').addEventListener('click', async function() {
showLoading();

// Create a temporary div to hold our report content
const reportContainer = document.createElement('div');
reportContainer.className = 'report-container';
reportContainer.style.width = '210mm';
reportContainer.style.padding = '10mm';
reportContainer.style.backgroundColor = 'white';
reportContainer.style.position = 'absolute';
reportContainer.style.left = '-9999px';
document.body.appendChild(reportContainer);

await forceChartRender();

try {
// Get current thresholds and date for the report title
const currentAIThreshold = aiThresholdSlider.value;
const currentPlagiarismThreshold = plagiarismThresholdSlider.value;
const currentDate = new Date().toLocaleDateString();

// Create report header
const header = document.createElement('div');
header.innerHTML = `
<h1 style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">Trend Analysis - Academic Integrity Report</h1>
<p style="text-align: center; color: #666;">Generated on ${currentDate}</p>
<p style="text-align: center; color: #666; margin-top: 5px;">AI Threshold: ${currentAIThreshold}% | Plagiarism Threshold: ${currentPlagiarismThreshold}%</p>
<hr style="margin: 20px 0;">
`;
reportContainer.appendChild(header);

// Clone stats cards
const stats = document.createElement('div');
stats.style.marginBottom = '20px';
stats.style.display = 'flex';
stats.style.justifyContent = 'space-between';

// Clone the stats cards
const statsCards = document.querySelectorAll('.container .card-shadow')[0].cloneNode(true);
const statsTitle = document.createElement('h2');
statsTitle.textContent = 'Overview Statistics';
statsTitle.style.fontSize = '18px';
statsTitle.style.fontWeight = 'bold';
statsTitle.style.marginBottom = '10px';

stats.appendChild(statsTitle);
reportContainer.appendChild(stats);
reportContainer.appendChild(statsCards);

// Add summary charts section
const chartsSection = document.createElement('div');
chartsSection.style.marginTop = '30px';

const chartsTitle = document.createElement('h2');
chartsTitle.textContent = 'Analysis Charts';
chartsTitle.style.fontSize = '18px';
chartsTitle.style.fontWeight = 'bold';
chartsTitle.style.marginBottom = '20px';
chartsSection.appendChild(chartsTitle);

// Create promises for each chart canvas
const chartPromises = [];

// First, render the summary charts
const aiChartPromise = html2canvas(document.getElementById('aiChart').parentNode, {
scale: 2,
logging: false,
useCORS: true
}).then(canvas => {
const chartDiv = document.createElement('div');
chartDiv.style.marginBottom = '20px';
const chartTitle = document.createElement('h3');
chartTitle.textContent = 'AI Content Detection Summary';
chartTitle.style.fontSize = '16px';
chartTitle.style.marginBottom = '10px';
chartDiv.appendChild(chartTitle);
canvas.style.maxWidth = '100%';
chartDiv.appendChild(canvas);
chartsSection.appendChild(chartDiv);
});
chartPromises.push(aiChartPromise);

const plagiarismChartPromise = html2canvas(document.getElementById('plagiarismChart').parentNode, {
scale: 2,
logging: false,
useCORS: true
}).then(canvas => {
const chartDiv = document.createElement('div');
chartDiv.style.marginBottom = '20px';
const chartTitle = document.createElement('h3');
chartTitle.textContent = 'Plagiarism Detection Summary';
chartTitle.style.fontSize = '16px';
chartTitle.style.marginBottom = '10px';
chartDiv.appendChild(chartTitle);
canvas.style.maxWidth = '100%';
chartDiv.appendChild(canvas);
chartsSection.appendChild(chartDiv);
});
chartPromises.push(plagiarismChartPromise);

// For trend analysis chart, we need to make it visible temporarily
const trendsTab = document.getElementById('trends-tab');
const trendsTabWasHidden = trendsTab.classList.contains('hidden');
if (trendsTabWasHidden) {
trendsTab.classList.remove('hidden');
}

const trendsChartPromise = html2canvas(document.getElementById('trendsChart').parentNode, {
scale: 2,
logging: false,
useCORS: true
}).then(canvas => {
const chartDiv = document.createElement('div');
chartDiv.style.marginBottom = '20px';
const chartTitle = document.createElement('h3');
chartTitle.textContent = 'Assignment Integrity Trends';
chartTitle.style.fontSize = '16px';
chartTitle.style.marginBottom = '10px';
chartDiv.appendChild(chartTitle);
canvas.style.maxWidth = '100%';
chartDiv.appendChild(canvas);
chartsSection.appendChild(chartDiv);

// Restore the hidden state if needed
if (trendsTabWasHidden) {
  trendsTab.classList.add('hidden');
}
});
chartPromises.push(trendsChartPromise);

// Add assignment details section
const assignmentsSection = document.createElement('div');
assignmentsSection.style.marginTop = '30px';

const assignmentsTitle = document.createElement('h2');
assignmentsTitle.textContent = 'Assignment Details';
assignmentsTitle.style.fontSize = '18px';
assignmentsTitle.style.fontWeight = 'bold';
assignmentsTitle.style.marginBottom = '20px';
assignmentsSection.appendChild(assignmentsTitle);

// Process each assignment
assignments.forEach((assignment, index) => {
const data = assignmentData[assignment] || [];

// Count submissions above threshold
const totalSubmissions = data.length;
const highAICount = data.filter(
  (item) => item.ai_percentage >= currentAIThreshold
).length;
const highPlagiarismCount = data.filter(
  (item) => item.plagiarism_percentage >= currentPlagiarismThreshold
).length;

// Calculate percentages
const aiPercentage = totalSubmissions
  ? ((highAICount / totalSubmissions) * 100).toFixed(1)
  : 0;
const plagiarismPercentage = totalSubmissions
  ? ((highPlagiarismCount / totalSubmissions) * 100).toFixed(1)
  : 0;

// Add assignment info
const assignmentInfo = document.createElement('div');
assignmentInfo.style.marginBottom = '25px';
assignmentInfo.style.padding = '15px';
assignmentInfo.style.border = '1px solid #ddd';
assignmentInfo.style.borderRadius = '4px';

assignmentInfo.innerHTML = `
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${formatAssignmentName(assignment)}</h3>
  <p style="margin-bottom: 10px;">Total Submissions: ${totalSubmissions}</p>
  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
    <div>
      <p style="font-size: 14px; color: #666; margin-bottom: 5px;">AI Content</p>
      <p style="font-weight: bold; color: ${highAICount > 0 ? '#e63946' : '#43a047'}">
        ${aiPercentage}% (${highAICount}/${totalSubmissions})
      </p>
    </div>
    <div>
      <p style="font-size: 14px; color: #666; margin-bottom: 5px;">Plagiarism</p>
      <p style="font-weight: bold; color: ${highPlagiarismCount > 0 ? '#ffa000' : '#43a047'}">
        ${plagiarismPercentage}% (${highPlagiarismCount}/${totalSubmissions})
      </p>
    </div>
  </div>
`;

assignmentsSection.appendChild(assignmentInfo);
});

// Wait for all charts to render, then generate PDF
await Promise.all(chartPromises);
reportContainer.appendChild(chartsSection);
reportContainer.appendChild(assignmentsSection);

// Generate the PDF
const canvas = await html2canvas(reportContainer, {
scale: 1,
useCORS: true,
allowTaint: true,
logging: false
});

const imgData = canvas.toDataURL('image/jpeg', 0.95);
const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = pdf.internal.pageSize.getHeight();
const imgWidth = canvas.width;
const imgHeight = canvas.height;
const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
const imgX = (pdfWidth - imgWidth * ratio) / 2;
let imgY = 10;

pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

// If the content is taller than the page, handle pagination
const totalPages = Math.ceil(imgHeight * ratio / (pdfHeight - 20));
if (totalPages > 1) {
for (let i = 1; i < totalPages; i++) {
  pdf.addPage();
  pdf.addImage(
    imgData, 
    'JPEG', 
    imgX, 
    -(imgHeight * ratio * i / totalPages) + 10, 
    imgWidth * ratio, 
    imgHeight * ratio
  );
}
}

pdf.save(`academic_integrity_report_${new Date().toISOString().slice(0,10)}.pdf`);

// Clean up
document.body.removeChild(reportContainer);
hideLoading();

} catch (error) {
console.error("Error preparing report:", error);
if (reportContainer.parentNode) {
document.body.removeChild(reportContainer);
}
hideLoading();
alert("Error generating report: " + error.message);
}
});

// Function to force all charts to render for the PDF
function prepareChartsForExport() {
// Force render of all charts
if (aiChart) aiChart.render();
if (plagiarismChart) plagiarismChart.render();
if (trendsChart) trendsChart.render();
}

function forceChartRender() {
if (aiChart) aiChart.render();
if (plagiarismChart) plagiarismChart.render();
if (trendsChart) trendsChart.render();
return new Promise(resolve => setTimeout(resolve, 500)); // Give time for rendering
}

  // Initialize the dashboard
  // Uncomment the real API call in production
  fetchAssignments();

  // Use mock data for demo
  // fetchMockData();
})}; // This is the missing closing brace for the DOMContentLoaded event listener
</script>