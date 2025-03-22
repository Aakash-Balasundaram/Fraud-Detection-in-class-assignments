<script>
      document.addEventListener("DOMContentLoaded", function () {
        document.addEventListener('DOMContentLoaded', function () {
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

        // Initialize the dashboard
        // Uncomment the real API call in production
        fetchAssignments();

        // Use mock data for demo
        // fetchMockData();
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {
              formatAssignmentName,
              getTotalSubmissions,
              updateDashboard,
              renderAssignments,
              fetchAssignments,
            };
            // Expose globals for testing
            global.aiThreshold = aiThreshold;
            global.plagiarismThreshold = plagiarismThreshold;
            global.assignments = assignments;
            global.assignmentData = assignmentData;
          }
      })}; // This is the missing closing brace for the DOMContentLoaded event listener
    </script>