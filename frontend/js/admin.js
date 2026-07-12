

const token = sessionStorage.getItem("token");
let user = null;

try {
    user = JSON.parse(sessionStorage.getItem("user"));
} catch (error) {
    user = null;
}

if (!token || !user || user.role !== "admin") {
    sessionStorage.clear();
    window.location.href = "login.html";
}

let activeCharts = {};
let searchTimeouts = {};
let confirmActionCallback = null;

const state = {
    students: { page: 1, limit: 10, search: "" },
    companies: { page: 1, limit: 10, search: "" },
    internships: { page: 1, limit: 10, search: "", companyName: "" },
    applications: { page: 1, limit: 10, search: "", status: "" },
    reports: { page: 1, limit: 10, search: "", status: "" }
};

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    document.getElementById("adminName").innerText = user.name || "System Admin";
    document.getElementById("adminInitials").innerText = getInitials(user.name || "Admin");

    loadDashboardStats();
    checkPendingReportsCount();
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("show");
}

function switchTab(tabName) {

    document.querySelectorAll(".content-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));

    const panel = document.getElementById(`panel-${tabName}`);
    const menuLi = document.querySelector(`.sidebar-menu li[data-tab="${tabName}"]`);
    const panelTitle = document.getElementById("panelTitle");

    if (panel) panel.classList.add("active");
    if (menuLi) menuLi.classList.add("active");

    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("show");

    if (panelTitle) {
        panelTitle.innerText = menuLi ? menuLi.innerText.trim() : "Overview & Analytics";
    }

    if (tabName === "dashboard") {
        loadDashboardStats();
    } else if (tabName === "students") {
        loadStudents();
    } else if (tabName === "companies") {
        loadCompanies();
    } else if (tabName === "internships") {
        loadInternships();
    } else if (tabName === "applications") {
        loadApplications();
    } else if (tabName === "reports") {
        loadReports();
    } else if (tabName === "announcements") {
        loadAnnouncements();
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

function getInitials(name) {
    return name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "AD";
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.style.background = isError ? "#EF4444" : "#22C55E";
    toast.style.color = "#ffffff";
    toast.style.display = "block";

    toast.style.position = "";
    toast.style.bottom = "";
    toast.style.top = "";
    toast.style.right = "";
    toast.style.padding = "";
    toast.style.borderRadius = "";
    toast.style.boxShadow = "";
    toast.style.zIndex = "";
    toast.style.animation = "";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3500);
}

async function loadDashboardStats() {
    try {
        const res = await apiRequest("/admin/stats");
        if (res.success) {
            document.getElementById("statStudents").innerText = res.stats.totalStudents;
            document.getElementById("statCompanies").innerText = res.stats.totalCompanies;
            document.getElementById("statInternships").innerText = res.stats.totalInternships;
            document.getElementById("statApplications").innerText = res.stats.totalApplications;
            document.getElementById("statPending").innerText = res.stats.pendingApplications;
            document.getElementById("statActiveJobs").innerText = res.stats.activeInternships;

            renderDashboardInsights(res.recentInsights);
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

function renderDashboardInsights(insights) {
    if (!insights) return;

    const regsList = document.getElementById("recentRegsList");
    if (regsList) {
        regsList.innerHTML = insights.registrations.length === 0
            ? '<li class="insight-item" style="color: #64748b; font-size: 0.95rem; text-align: center; width: 100%;">No recent registrations</li>'
            : insights.registrations.map(r => `
                <li class="insight-item">
                    <div class="insight-item-info">
                        <span class="insight-item-title">${escapeHTML(r.name)}</span>
                        <span class="insight-item-sub">${formatDate(r.createdAt)}</span>
                    </div>
                    <span class="badge ${r.role === 'student' ? 'badge-success' : 'badge-info'}" style="text-transform: capitalize;">
                        ${escapeHTML(r.role)}
                    </span>
                </li>
            `).join("");
    }

    const reportsList = document.getElementById("recentReportsList");
    if (reportsList) {
        reportsList.innerHTML = insights.reports.length === 0
            ? '<li class="insight-item" style="color: #64748b; font-size: 0.95rem; text-align: center; width: 100%;">No recent reports</li>'
            : insights.reports.map(rep => `
                <li class="insight-item">
                    <div class="insight-item-info">
                        <span class="insight-item-title" style="color: #dc2626;">${escapeHTML(rep.reportType)}</span>
                        <span class="insight-item-sub">On: ${escapeHTML(rep.internshipTitle || rep.companyName)}</span>
                    </div>
                    <span class="insight-item-sub">${formatDate(rep.createdAt)}</span>
                </li>
            `).join("");
    }

    const internshipsList = document.getElementById("recentInternshipsList");
    if (internshipsList) {
        internshipsList.innerHTML = insights.internships.length === 0
            ? '<li class="insight-item" style="color: #64748b; font-size: 0.95rem; text-align: center; width: 100%;">No recent internships</li>'
            : insights.internships.map(i => `
                <li class="insight-item">
                    <div class="insight-item-info">
                        <span class="insight-item-title">${escapeHTML(i.title)}</span>
                        <span class="insight-item-sub">${escapeHTML(i.companyName)}</span>
                    </div>
                    <span class="insight-item-sub">${formatDate(i.createdAt)}</span>
                </li>
            `).join("");
    }
}

async function checkPendingReportsCount() {
    try {
        const res = await apiRequest("/reports?status=Pending&limit=1");
        if (res.success) {
            const badge = document.getElementById("reportsBadge");
            if (res.total > 0) {
                badge.innerText = res.total;
                badge.style.display = "inline-flex";
            } else {
                badge.style.display = "none";
            }
        }
    } catch (error) {
        console.error("Failed to check pending reports count", error);
    }
}

async function loadStudents() {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">Loading students...</td></tr>`;

    try {
        const { page, limit, search } = state.students;
        const res = await apiRequest(`/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

        if (res.success && res.students.length > 0) {
            tbody.innerHTML = res.students.map(std => {
                const statusBadge = std.isBlocked
                    ? `<span class="badge badge-danger">Blocked</span>`
                    : `<span class="badge badge-success">Active</span>`;

                const blockTitle = std.isBlocked ? "Unblock User" : "Block User";
                const blockIcon = std.isBlocked ? "unlock" : "shield-alert";

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600; color: #0f172a;">${escapeHTML(std.name)}</div>
                        </td>
                        <td>${escapeHTML(std.email)}</td>
                        <td>${escapeHTML(std.college || "N/A")}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="View Profile" onclick="viewStudentProfile('${std._id}')">
                                    <i data-lucide="eye"></i>
                                </button>
                                <button class="btn-icon block" title="${blockTitle}" onclick="toggleBlockUser('${std._id}', '${std.name}')">
                                    <i data-lucide="${blockIcon}"></i>
                                </button>
                                <button class="btn-icon delete" title="Delete User" onclick="confirmDeleteUser('${std._id}', '${std.name}')">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
            renderPagination("paginationStudents", res.page, res.pages, 'students');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">No students found.</td></tr>`;
            document.getElementById("paginationStudents").innerHTML = "";
        }
        lucide.createIcons();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

async function loadCompanies() {
    const tbody = document.getElementById("companiesTableBody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">Loading companies...</td></tr>`;

    try {
        const { page, limit, search } = state.companies;
        const res = await apiRequest(`/admin/companies?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

        if (res.success && res.companies.length > 0) {
            tbody.innerHTML = res.companies.map(comp => {
                const statusBadge = comp.isBlocked
                    ? `<span class="badge badge-danger">Blocked</span>`
                    : `<span class="badge badge-success">Active</span>`;

                const blockTitle = comp.isBlocked ? "Unblock Company" : "Block Company";
                const blockIcon = comp.isBlocked ? "unlock" : "shield-alert";

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600; color: #0f172a;">${escapeHTML(comp.name)}</div>
                        </td>
                        <td>${escapeHTML(comp.email)}</td>
                        <td>${escapeHTML(comp.industry || "N/A")}</td>
                        <td>${escapeHTML(comp.location || "N/A")}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="View Company Profile" onclick="viewCompanyProfile('${comp._id}')">
                                    <i data-lucide="eye"></i>
                                </button>
                                <button class="btn-icon block" title="${blockTitle}" onclick="toggleBlockUser('${comp._id}', '${comp.name}')">
                                    <i data-lucide="${blockIcon}"></i>
                                </button>
                                <button class="btn-icon delete" title="Delete Company" onclick="confirmDeleteUser('${comp._id}', '${comp.name}')">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
            renderPagination("paginationCompanies", res.page, res.pages, 'companies');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No companies found.</td></tr>`;
            document.getElementById("paginationCompanies").innerHTML = "";
        }
        lucide.createIcons();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

async function toggleBlockUser(userId, name) {
    try {
        const res = await apiRequest(`/admin/users/${userId}/block`, "PUT");
        if (res.success) {
            showToast(res.message);

            const activeTab = document.querySelector(".sidebar-menu li.active").dataset.tab;
            if (activeTab === "students") loadStudents();
            else if (activeTab === "companies") loadCompanies();
            loadDashboardStats();
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

function confirmDeleteUser(userId, name) {
    openConfirmModal(
        `Delete "${name}"?`,
        `This will permanently delete this account and all associated internships, applications, and reports. This action is irreversible.`,
        async () => {
            try {
                const res = await apiRequest(`/admin/users/${userId}`, "DELETE");
                if (res.success) {
                    showToast(res.message);
                    closeConfirmModal();
                    const activeTab = document.querySelector(".sidebar-menu li.active").dataset.tab;
                    if (activeTab === "students") loadStudents();
                    else if (activeTab === "companies") loadCompanies();
                    loadDashboardStats();
                }
            } catch (error) {
                showToast(error.message, true);
            }
        }
    );
}

async function loadInternships() {
    const tbody = document.getElementById("internshipsTableBody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">Loading internships...</td></tr>`;

    try {
        const { page, limit, search, companyName } = state.internships;
        const res = await apiRequest(`/admin/internships?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&companyName=${encodeURIComponent(companyName)}`);

        if (res.success && res.internships.length > 0) {
            tbody.innerHTML = res.internships.map(intern => `
                <tr>
                    <td>
                        <div style="font-weight: 600; color: #0f172a;">${escapeHTML(intern.title)}</div>
                    </td>
                    <td>
                        <a href="#" onclick="viewCompanyProfile('${intern.postedBy}'); return false;" style="color: var(--primary); text-decoration: underline;">
                            ${escapeHTML(intern.companyName)}
                        </a>
                    </td>
                    <td>${escapeHTML(intern.location)}</td>
                    <td>${escapeHTML(intern.stipend)}</td>
                    <td>${escapeHTML(intern.duration)}</td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn-icon" title="View Details" onclick="viewInternshipDetails('${intern._id}')">
                                <i data-lucide="eye"></i>
                            </button>
                            <button class="btn-icon delete" title="Delete Internship" onclick="confirmDeleteInternship('${intern._id}', '${intern.title}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
            renderPagination("paginationInternships", res.page, res.pages, 'internships');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No internships found.</td></tr>`;
            document.getElementById("paginationInternships").innerHTML = "";
        }
        lucide.createIcons();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

function confirmDeleteInternship(id, title) {
    openConfirmModal(
        "Delete Internship?",
        `Are you sure you want to delete the internship listing "${title}"? All submitted applications and reports for this role will also be deleted.`,
        async () => {
            try {
                const res = await apiRequest(`/admin/internships/${id}`, "DELETE");
                if (res.success) {
                    showToast(res.message);
                    closeConfirmModal();
                    loadInternships();
                    loadDashboardStats();
                }
            } catch (error) {
                showToast(error.message, true);
            }
        }
    );
}

async function loadApplications() {
    const tbody = document.getElementById("applicationsTableBody");
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">Loading applications...</td></tr>`;

    try {
        const { page, limit, search, status } = state.applications;
        const res = await apiRequest(`/admin/applications?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);

        if (res.success && res.applications.length > 0) {
            tbody.innerHTML = res.applications.map(app => {
                const statusBadge = getStatusBadge(app.status);
                const studentName = app.student?.name || "Deleted User";
                const internshipTitle = app.internship?.title || "Deleted Internship";
                const companyName = app.internship?.companyName || "N/A";

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600; color: #0f172a;">${escapeHTML(studentName)}</div>
                            <span style="font-size: 0.75rem; color: #64748b;">${escapeHTML(app.student?.email || "")}</span>
                        </td>
                        <td>${escapeHTML(internshipTitle)}</td>
                        <td>${escapeHTML(companyName)}</td>
                        <td>${formatDate(app.createdAt)}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="View Application Details" onclick="viewApplicationDetails('${app._id}')">
                                    <i data-lucide="eye"></i>
                                </button>
                                <button class="btn-icon delete" title="Delete Application" onclick="confirmDeleteApplication('${app._id}')">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
            renderPagination("paginationApplications", res.page, res.pages, 'applications');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b;">No applications found.</td></tr>`;
            document.getElementById("paginationApplications").innerHTML = "";
        }
        lucide.createIcons();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

function getStatusBadge(status) {
    switch (status) {
        case "Accepted": return `<span class="badge badge-success">Accepted</span>`;
        case "Reviewed": return `<span class="badge badge-info">Reviewed</span>`;
        case "Rejected": return `<span class="badge badge-danger">Rejected</span>`;
        default: return `<span class="badge badge-warning">Pending</span>`;
    }
}

function confirmDeleteApplication(id) {
    openConfirmModal(
        "Delete Application?",
        "Are you sure you want to delete this internship application record?",
        async () => {
            try {
                const res = await apiRequest(`/admin/applications/${id}`, "DELETE");
                if (res.success) {
                    showToast(res.message);
                    closeConfirmModal();
                    loadApplications();
                    loadDashboardStats();
                }
            } catch (error) {
                showToast(error.message, true);
            }
        }
    );
}

async function loadReports() {
    const tbody = document.getElementById("reportsTableBody");
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b;">Loading reports...</td></tr>`;

    try {
        const { page, limit, search, status } = state.reports;
        const res = await apiRequest(`/reports?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);

        if (res.success && res.reports.length > 0) {
            tbody.innerHTML = res.reports.map(rep => {
                let statusClass = "badge-warning";
                if (rep.status === "Reviewed") statusClass = "badge-info";
                else if (rep.status === "Resolved") statusClass = "badge-success";

                const isResolved = rep.status === "Resolved";
                const isReviewed = rep.status === "Reviewed" || isResolved;

                const reviewButton = !isReviewed
                    ? `<button class="btn-icon" title="Mark Reviewed" onclick="markReportReviewed('${rep._id}')"><i data-lucide="check-square"></i></button>`
                    : "";

                const resolveButton = !isResolved
                    ? `<button class="btn-icon" title="Resolve Report" style="color: #16a34a; border-color: #bbf7d0;" onclick="resolveReport('${rep._id}')"><i data-lucide="check-circle-2"></i></button>`
                    : "";

                return `
                    <tr>
                        <td>
                            <div style="font-weight: 600; color: #0f172a;">${escapeHTML(rep.studentName)}</div>
                        </td>
                        <td>
                            <a href="#" onclick="viewCompanyProfile('${rep.company}'); return false;" style="color: var(--primary); text-decoration: underline;">
                                ${escapeHTML(rep.companyName)}
                            </a>
                        </td>
                        <td>
                            <a href="#" onclick="viewInternshipDetails('${rep.internship}'); return false;" style="color: var(--primary); text-decoration: underline;">
                                ${escapeHTML(rep.internshipTitle)}
                            </a>
                        </td>
                        <td><span class="badge badge-danger" style="background: #fee2e2; color: #b91c1c;">${escapeHTML(rep.reportType)}</span></td>
                        <td>${formatDate(rep.createdAt)}</td>
                        <td><span class="badge ${statusClass}">${rep.status}</span></td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="View Report Details" onclick="viewReportDetails('${rep._id}')">
                                    <i data-lucide="eye"></i>
                                </button>
                                ${reviewButton}
                                ${resolveButton}
                                <button class="btn-icon delete" title="Delete Report" onclick="confirmDeleteReport('${rep._id}')">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
            renderPagination("paginationReports", res.page, res.pages, 'reports');
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b;">No reports found.</td></tr>`;
            document.getElementById("paginationReports").innerHTML = "";
        }
        lucide.createIcons();
        checkPendingReportsCount();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

async function markReportReviewed(reportId) {
    try {
        const res = await apiRequest(`/reports/${reportId}/status`, "PUT", { status: "Reviewed" });
        if (res.success) {
            showToast("Report marked as Reviewed.");
            loadReports();
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

async function resolveReport(reportId) {
    try {
        const res = await apiRequest(`/reports/${reportId}/status`, "PUT", { status: "Resolved" });
        if (res.success) {
            showToast("Report marked as Resolved.");
            loadReports();
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

function confirmDeleteReport(reportId) {
    openConfirmModal(
        "Delete Report?",
        "Are you sure you want to delete this student report record?",
        async () => {
            try {
                const res = await apiRequest(`/reports/${reportId}`, "DELETE");
                if (res.success) {
                    showToast(res.message);
                    closeConfirmModal();
                    loadReports();
                }
            } catch (error) {
                showToast(error.message, true);
            }
        }
    );
}

async function loadAnnouncements() {
    const tbody = document.getElementById("announcementsTableBody");
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">Loading announcements...</td></tr>`;

    try {
        const res = await apiRequest("/announcements");

        if (res.success && res.announcements.length > 0) {
            tbody.innerHTML = res.announcements.map(ann => {
                const contentPreview = ann.content.length > 80
                    ? escapeHTML(ann.content.slice(0, 80)) + "..."
                    : escapeHTML(ann.content);

                return `
                    <tr>
                        <td><div style="font-weight: 600; color: #0f172a;">${escapeHTML(ann.title)}</div></td>
                        <td>${contentPreview}</td>
                        <td>${formatDate(ann.createdAt)}</td>
                        <td>
                            <div class="actions-cell">
                                <button class="btn-icon" title="Edit Announcement" onclick="openAnnouncementModal('${ann._id}', '${escapeHTML(ann.title)}', '${escapeHTML(ann.content)}')">
                                    <i data-lucide="edit"></i>
                                </button>
                                <button class="btn-icon delete" title="Delete Announcement" onclick="confirmDeleteAnnouncement('${ann._id}')">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b;">No announcements created.</td></tr>`;
        }
        lucide.createIcons();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error: ${error.message}</td></tr>`;
    }
}

function openAnnouncementModal(id = "", title = "", content = "") {
    const modal = document.getElementById("announcementModal");
    document.getElementById("announcementId").value = id;
    document.getElementById("announcementTitle").value = title;
    document.getElementById("announcementContent").value = content;

    document.getElementById("announcementModalTitle").innerText = id ? "Edit Announcement" : "Create Announcement";
    modal.style.display = "flex";
}

function closeAnnouncementModal() {
    document.getElementById("announcementModal").style.display = "none";
}

async function saveAnnouncement() {
    const id = document.getElementById("announcementId").value;
    const title = document.getElementById("announcementTitle").value.trim();
    const content = document.getElementById("announcementContent").value.trim();

    if (!title || !content) {
        showToast("Please fill all required announcement fields.", true);
        return;
    }

    try {
        const url = id ? `/announcements/${id}` : "/announcements";
        const method = id ? "PUT" : "POST";

        const res = await apiRequest(url, method, { title, content });
        if (res.success) {
            showToast(res.message);
            closeAnnouncementModal();
            loadAnnouncements();
        }
    } catch (error) {
        showToast(error.message, true);
    }
}

function confirmDeleteAnnouncement(id) {
    openConfirmModal(
        "Delete Announcement?",
        "Are you sure you want to delete this announcement? It will immediately disappear from student and company dashboards.",
        async () => {
            try {
                const res = await apiRequest(`/announcements/${id}`, "DELETE");
                if (res.success) {
                    showToast(res.message);
                    closeConfirmModal();
                    loadAnnouncements();
                }
            } catch (error) {
                showToast(error.message, true);
            }
        }
    );
}

async function viewStudentProfile(studentId) {
    openDetailsModal("Student Profile", "<p style='color: #64748b;'>Loading profile...</p>");
    try {
        const res = await apiRequest(`/admin/users/${studentId}`);
        if (res.success) {
            const std = res.user;
            const skillsHTML = std.skills && std.skills.length > 0
                ? std.skills.map(s => `<span class="badge badge-secondary" style="margin-right: 5px; margin-bottom: 5px;">${escapeHTML(s)}</span>`).join("")
                : "No skills listed";

            const resumeHTML = std.resumeUrl
                ? `<a href="${std.resumeUrl}" target="_blank" class="btn-primary" style="display: inline-block; padding: 6px 12px; font-size: 0.85rem; text-decoration: none; border-radius: 6px; margin-top: 5px;">Download Resume</a>`
                : "No resume uploaded";

            const content = `
                <ul class="details-list">
                    <li>
                        <div class="details-label">Full Name</div>
                        <div class="details-val" style="font-weight: 600;">${escapeHTML(std.name)}</div>
                    </li>
                    <li>
                        <div class="details-label">Email Address</div>
                        <div class="details-val">${escapeHTML(std.email)}</div>
                    </li>
                    <li>
                        <div class="details-label">Phone Number</div>
                        <div class="details-val">${escapeHTML(std.phone) || "N/A"}</div>
                    </li>
                    <li>
                        <div class="details-label">College / University</div>
                        <div class="details-val">${escapeHTML(std.college) || "N/A"}</div>
                    </li>
                    <li>
                        <div class="details-label">Skills</div>
                        <div class="details-val" style="margin-top: 6px;">${skillsHTML}</div>
                    </li>
                    <li>
                        <div class="details-label">Resume</div>
                        <div class="details-val" style="margin-top: 6px;">${resumeHTML}</div>
                    </li>
                    <li>
                        <div class="details-label">Account Status</div>
                        <div class="details-val">
                            <span class="badge ${std.isBlocked ? 'badge-danger' : 'badge-success'}">
                                ${std.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                        </div>
                    </li>
                </ul>
            `;
            updateDetailsModalContent(content);
        }
    } catch (error) {
        updateDetailsModalContent(`<p style="color: #ef4444;">Error: ${error.message}</p>`);
    }
}

async function viewCompanyProfile(companyId) {
    openDetailsModal("Company Profile", "<p style='color: #64748b;'>Loading profile...</p>");
    try {
        const res = await apiRequest(`/admin/users/${companyId}`);
        if (res.success) {
            const comp = res.user;
            const websiteHTML = comp.website
                ? `<a href="${comp.website}" target="_blank" style="color: var(--primary); text-decoration: underline;">${escapeHTML(comp.website)}</a>`
                : "N/A";

            const content = `
                <ul class="details-list">
                    <li>
                        <div class="details-label">Company Name</div>
                        <div class="details-val" style="font-weight: 600;">${escapeHTML(comp.name)}</div>
                    </li>
                    <li>
                        <div class="details-label">Email Address</div>
                        <div class="details-val">${escapeHTML(comp.email)}</div>
                    </li>
                    <li>
                        <div class="details-label">Industry</div>
                        <div class="details-val">${escapeHTML(comp.industry) || "N/A"}</div>
                    </li>
                    <li>
                        <div class="details-label">Location</div>
                        <div class="details-val">${escapeHTML(comp.location) || "N/A"}</div>
                    </li>
                    <li>
                        <div class="details-label">Website</div>
                        <div class="details-val">${websiteHTML}</div>
                    </li>
                    <li>
                        <div class="details-label">About Company</div>
                        <div class="details-val" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; max-height: 180px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px;">${escapeHTML(comp.about) || "No description provided."}</div>
                    </li>
                </ul>
            `;
            updateDetailsModalContent(content);
        }
    } catch (error) {
        updateDetailsModalContent(`<p style="color: #ef4444;">Error: ${error.message}</p>`);
    }
}

async function viewInternshipDetails(internshipId) {
    openDetailsModal("Internship Details", "<p style='color: #64748b;'>Loading internship details...</p>");
    try {
        const intern = await apiRequest(`/internships/${internshipId}`);
        const skillsHTML = intern.skills && intern.skills.length > 0
            ? intern.skills.map(s => `<span class="badge badge-secondary" style="margin-right: 5px; margin-bottom: 5px;">${escapeHTML(s)}</span>`).join("")
            : "None specified";

        const content = `
            <ul class="details-list">
                <li>
                    <div class="details-label">Internship Title</div>
                    <div class="details-val" style="font-weight: 600; color: var(--primary);">${escapeHTML(intern.title)}</div>
                </li>
                <li>
                    <div class="details-label">Company</div>
                    <div class="details-val" style="font-weight: 500;">${escapeHTML(intern.companyName)}</div>
                </li>
                <li>
                    <div class="details-label">Location</div>
                    <div class="details-val">${escapeHTML(intern.location)}</div>
                </li>
                <li>
                    <div class="details-label">Duration</div>
                    <div class="details-val">${escapeHTML(intern.duration)}</div>
                </li>
                <li>
                    <div class="details-label">Stipend</div>
                    <div class="details-val">${escapeHTML(intern.stipend)}</div>
                </li>
                <li>
                    <div class="details-label">Skills Required</div>
                    <div class="details-val" style="margin-top: 6px;">${skillsHTML}</div>
                </li>
                <li>
                    <div class="details-label">Description</div>
                    <div class="details-val" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; max-height: 180px; overflow-y: auto; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px;">${escapeHTML(intern.description)}</div>
                </li>
            </ul>
        `;
        updateDetailsModalContent(content);
    } catch (error) {
        updateDetailsModalContent(`<p style="color: #ef4444;">Error: ${error.message}</p>`);
    }
}

async function viewApplicationDetails(appId) {
    openDetailsModal("Application Details", "<p style='color: #64748b;'>Loading application details...</p>");
    try {
        const { page, limit } = state.applications;
        const res = await apiRequest(`/admin/applications?page=${page}&limit=${limit}`);
        const app = res.applications.find(a => a._id === appId);

        if (!app) {
            updateDetailsModalContent(`<p style="color: #ef4444;">Error: Application not found in current view. Please search or reload.</p>`);
            return;
        }

        const student = app.student || {};
        const internship = app.internship || {};
        const resumeHTML = student.resumeUrl || app.resume
            ? `<a href="${student.resumeUrl || app.resume}" target="_blank" class="btn-primary" style="display: inline-block; padding: 6px 12px; font-size: 0.85rem; text-decoration: none; border-radius: 6px; margin-top: 5px;">Download Resume</a>`
            : "No resume uploaded";

        const content = `
            <ul class="details-list">
                <li>
                    <div class="details-label">Applicant Name</div>
                    <div class="details-val" style="font-weight: 600;">${escapeHTML(student.name)}</div>
                </li>
                <li>
                    <div class="details-label">Applicant Email</div>
                    <div class="details-val">${escapeHTML(student.email)}</div>
                </li>
                <li>
                    <div class="details-label">Applied For</div>
                    <div class="details-val" style="font-weight: 500;">${escapeHTML(internship.title)}</div>
                </li>
                <li>
                    <div class="details-label">Hiring Company</div>
                    <div class="details-val">${escapeHTML(internship.companyName)}</div>
                </li>
                <li>
                    <div class="details-label">Application Status</div>
                    <div class="details-val">${getStatusBadge(app.status)}</div>
                </li>
                <li>
                    <div class="details-label">Cover Letter / Statement</div>
                    <div class="details-val" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px;">${escapeHTML(app.coverLetter) || "No cover letter provided."}</div>
                </li>
                <li>
                    <div class="details-label">Resume</div>
                    <div class="details-val" style="margin-top: 6px;">${resumeHTML}</div>
                </li>
            </ul>
        `;
        updateDetailsModalContent(content);
    } catch (error) {
        updateDetailsModalContent(`<p style="color: #ef4444;">Error: ${error.message}</p>`);
    }
}

async function viewReportDetails(reportId) {
    openDetailsModal("Report Details", "<p style='color: #64748b;'>Loading report details...</p>");
    try {
        const { page, limit } = state.reports;
        const res = await apiRequest(`/reports?page=${page}&limit=${limit}`);
        const rep = res.reports.find(r => r._id === reportId);

        if (!rep) {
            updateDetailsModalContent(`<p style="color: #ef4444;">Error: Report details could not be loaded.</p>`);
            return;
        }

        let statusClass = "badge-warning";
        if (rep.status === "Reviewed") statusClass = "badge-info";
        else if (rep.status === "Resolved") statusClass = "badge-success";

        const content = `
            <ul class="details-list">
                <li>
                    <div class="details-label">Reported By (Student)</div>
                    <div class="details-val" style="font-weight: 600;">${escapeHTML(rep.studentName)}</div>
                </li>
                <li>
                    <div class="details-label">Target Company</div>
                    <div class="details-val" style="font-weight: 500;">${escapeHTML(rep.companyName)}</div>
                    <a href="#" onclick="closeDetailsModal(); viewCompanyProfile('${rep.company}'); return false;" style="font-size: 0.8rem; color: var(--primary); text-decoration: underline; display: inline-block; margin-top: 4px;">
                        View Company Profile
                    </a>
                </li>
                <li>
                    <div class="details-label">Target Internship</div>
                    <div class="details-val" style="font-weight: 500;">${escapeHTML(rep.internshipTitle)}</div>
                    <a href="#" onclick="closeDetailsModal(); viewInternshipDetails('${rep.internship}'); return false;" style="font-size: 0.8rem; color: var(--primary); text-decoration: underline; display: inline-block; margin-top: 4px;">
                        View Internship Details
                    </a>
                </li>
                <li>
                    <div class="details-label">Reason / Type</div>
                    <div class="details-val"><span class="badge badge-danger" style="background: #fee2e2; color: #b91c1c;">${escapeHTML(rep.reportType)}</span></div>
                </li>
                <li>
                    <div class="details-label">Report Status</div>
                    <div class="details-val"><span class="badge ${statusClass}">${rep.status}</span></div>
                </li>
                <li>
                    <div class="details-label">Detailed Explanation</div>
                    <div class="details-val" style="white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 6px;">${escapeHTML(rep.description)}</div>
                </li>
                <li>
                    <div class="details-label">Date Submitted</div>
                    <div class="details-val">${formatDate(rep.createdAt)}</div>
                </li>
            </ul>
        `;
        updateDetailsModalContent(content);
    } catch (error) {
        updateDetailsModalContent(`<p style="color: #ef4444;">Error: ${error.message}</p>`);
    }
}

function openDetailsModal(title, initialHTML = "") {
    const modal = document.getElementById("detailsModal");
    document.getElementById("detailsModalTitle").innerText = title;
    document.getElementById("detailsModalBody").innerHTML = initialHTML;
    modal.style.display = "flex";
}

function updateDetailsModalContent(html) {
    document.getElementById("detailsModalBody").innerHTML = html;
}

function closeDetailsModal() {
    document.getElementById("detailsModal").style.display = "none";
}

function openConfirmModal(title, text, callback) {
    const modal = document.getElementById("confirmModal");
    document.getElementById("confirmTitle").innerText = title;
    document.getElementById("confirmText").innerText = text;
    confirmActionCallback = callback;

    const submitBtn = document.getElementById("confirmSubmitBtn");
    submitBtn.onclick = () => {
        if (confirmActionCallback) confirmActionCallback();
    };

    modal.style.display = "flex";
}

function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    confirmActionCallback = null;
}

function handleSearch(type) {
    if (searchTimeouts[type]) {
        clearTimeout(searchTimeouts[type]);
    }

    searchTimeouts[type] = setTimeout(() => {
        let val = "";
        if (type === "students") {
            val = document.getElementById("searchStudents").value.trim();
            state.students.search = val;
            state.students.page = 1;
            loadStudents();
        } else if (type === "companies") {
            val = document.getElementById("searchCompanies").value.trim();
            state.companies.search = val;
            state.companies.page = 1;
            loadCompanies();
        } else if (type === "internships") {
            val = document.getElementById("searchInternships").value.trim();
            const compVal = document.getElementById("filterCompany").value.trim();
            state.internships.search = val;
            state.internships.companyName = compVal;
            state.internships.page = 1;
            loadInternships();
        } else if (type === "applications") {
            val = document.getElementById("searchApplications").value.trim();
            const statusVal = document.getElementById("filterStatus").value;
            state.applications.search = val;
            state.applications.status = statusVal;
            state.applications.page = 1;
            loadApplications();
        } else if (type === "reports") {
            val = document.getElementById("searchReports").value.trim();
            const statusVal = document.getElementById("filterReportStatus").value;
            state.reports.search = val;
            state.reports.status = statusVal;
            state.reports.page = 1;
            loadReports();
        }
    }, 450);
}

function renderPagination(containerId, currentPage, totalPages, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let buttonsHTML = `
        <button class="btn-pagination" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage - 1})">Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttonsHTML += `
                <button class="btn-pagination ${currentPage === i ? 'active' : ''}" onclick="changePage('${type}', ${i})">${i}</button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttonsHTML += `<span style="padding: 5px 8px; color: #94a3b8;">...</span>`;
        }
    }

    buttonsHTML += `
        <button class="btn-pagination" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${type}', ${currentPage + 1})">Next</button>
    `;

    container.innerHTML = `
        <div class="pagination-info">Showing page ${currentPage} of ${totalPages}</div>
        <div class="pagination-buttons">${buttonsHTML}</div>
    `;
}

function changePage(type, targetPage) {
    state[type].page = targetPage;
    if (type === 'students') loadStudents();
    else if (type === 'companies') loadCompanies();
    else if (type === 'internships') loadInternships();
    else if (type === 'applications') loadApplications();
    else if (type === 'reports') loadReports();
}