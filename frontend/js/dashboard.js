// ==========================================
// InternshipX Dashboard
// Crafted by ByteForge
// ==========================================

// ---------- Authentication ----------

const token = localStorage.getItem("token");
let editingInternshipId = null;
let allInternships = [];

const user = JSON.parse(localStorage.getItem("user"));
const currentPage = window.location.pathname;

if (!token || !user) {

    window.location.href = "login.html";

}

// ---------- Welcome ----------

const companyName = document.getElementById("companyName");
const studentName = document.getElementById("studentName");

if (companyName) {
    companyName.textContent = `Welcome, ${user.name}`;
}

if (studentName) {
    studentName.textContent = `Welcome, ${user.name}`;
}
// ---------- Logout ----------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", logout);

}

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("verifyEmail");

    window.location.href = "login.html";

}
// ---------- My Applications Button ----------

const myApplicationsBtn = document.getElementById("myApplicationsBtn");

if (myApplicationsBtn) {
    myApplicationsBtn.addEventListener("click", () => {
        window.location.href = "my-applications.html";
    });
}

// ---------- Modal ----------

const modal = document.getElementById("internshipModal");

const openBtn = document.getElementById("openModalBtn");

const closeBtn = document.getElementById("closeModal");

if (openBtn) {

    openBtn.onclick = () => {

        modal.style.display = "flex";

    };

}

if (closeBtn) {

    closeBtn.onclick = () => {

        modal.style.display = "none";

    };

}

window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};

// ---------- Internship Form ----------

const internshipForm = document.getElementById("internshipForm");

if (internshipForm) {

    internshipForm.addEventListener("submit", createInternship);

}

async function createInternship(e) {

    e.preventDefault();

    const internship = {

    title: document.getElementById("title").value,

    companyName: user.name,

    location: document.getElementById("location").value,

    duration: document.getElementById("duration").value,

    stipend: document.getElementById("stipend").value,

    skills: document.getElementById("skills").value
                .split(",")
                .map(skill => skill.trim()),

    description: document.getElementById("description").value

};

    try {

       let response;

if (editingInternshipId) {

    response = await apiRequest(
        `/internships/${editingInternshipId}`,
        "PUT",
        internship
    );

    editingInternshipId = null;

} else {

    response = await apiRequest(
        "/internships",
        "POST",
        internship
    );

}

        showToast(response.message);
        internshipForm.reset();

        modal.style.display = "none";

        loadCompanyInternships();

    }

    catch(error){

        showToast(error.message);

    }

}

// ---------- Load Company Internships ----------

async function loadCompanyInternships(){

    try{

        const data = await apiRequest(

            "/internships/company"

        );
        window.companyInternships = data;

        renderInternships(data);

    }

    catch(error){

        console.log(error);

    }

}

// ---------- Render ----------

function renderInternships(data){

    const list = document.getElementById("internshipList");

    if(!list) return;

  if (data.length === 0) {

    const total = document.getElementById("totalInternships");

    if (total) {
        total.textContent = 0;
    }

    list.innerHTML = `
        <div class="empty-state">
            <h3>No internships posted yet.</h3>
        </div>
    `;

    return;
}

    const total = document.getElementById("totalInternships");

if (total) {
    total.textContent = data.length;
}

    list.innerHTML = "";

    data.forEach(item => {

        list.innerHTML += `

<div class="internship-card">

    <h3>${item.title}</h3>

    <p>${item.location}</p>

    <p>${item.duration}</p>

    <p>${item.stipend}</p>

    <div class="card-actions">

    <button
        class="btn-secondary edit-btn"
        data-id="${item._id}">

        Edit

    </button>

    <button
        class="btn-danger delete-btn"
        data-id="${item._id}">

        Delete

    </button>

</div>

</div>

`;

    });

}
if (currentPage.includes("company-dashboard")) {

    loadCompanyDashboard();

}

if (currentPage.includes("student-dashboard")) {

    loadStudentDashboard();

}
async function loadCompanyDashboard() {

    loadCompanyInternships();

}
async function loadStudentDashboard() {

    try {

        const internships = await apiRequest("/internships");

        allInternships = internships;

renderStudentInternships(allInternships);

    }

    catch(error){

        console.log(error);

    }

}
function renderStudentInternships(data) {

    const list = document.getElementById("internshipList");

    if (!list) return;

    // Update statistics

 const available = document.getElementById("availableInternships");

if (available) {
    available.textContent = data.length;
}
    if (data.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <h3>No internships available.</h3>
            </div>
        `;

        return;

    }

    list.innerHTML = "";

    data.forEach(item => {

        list.innerHTML += `

        <div class="internship-card">

            <h3>${item.title}</h3>

            <p><strong>${item.companyName}</strong></p>

            <p>📍 ${item.location}</p>

            <p>⏳ ${item.duration}</p>

            <p>💰 ${item.stipend}</p>

            <p><strong>Skills:</strong> ${item.skills.join(", ")}</p>

            <p>${item.description}</p>

            <button
                class="btn-primary apply-btn"
                data-id="${item._id}">

                Apply Now

            </button>

        </div>

        `;

    });

}
// ==========================================
// APPLY INTERNSHIP
// ==========================================

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("apply-btn")) return;

    const internshipId = e.target.dataset.id;

    try {

        const response = await apiRequest(
            `/applications/${internshipId}`,
            "POST"
        );

        showToast(response.message);

        e.target.innerText = "Applied ✓";
        e.target.disabled = true;

    }

    catch(error){

        showToast(error.message);

    }

});
if (currentPage.includes("my-applications")) {

    loadMyApplications();

}
async function loadMyApplications(){

    try{

        const data = await apiRequest(

            "/applications/student"

        );

        renderApplications(data.applications);

    }

    catch(error){

        console.log(error);

    }

}
function renderApplications(applications){

    const list = document.getElementById("applicationList");

    if(!list) return;

    if(applications.length===0){

        list.innerHTML=`

        <div class="empty-state">

            <h3>

                You haven't applied anywhere yet.

            </h3>

        </div>

        `;

        return;

    }

    list.innerHTML="";

    applications.forEach(app=>{

        list.innerHTML+=`

        <div class="internship-card">

            <h3>

                ${app.internship.title}

            </h3>

            <p>

                ${app.internship.companyName}

            </p>

            <p>

                ${app.internship.location}

            </p>

            <p>

                ${app.internship.duration}

            </p>

            <p>

                ${app.internship.stipend}

            </p>

            <h4>

                Status :

                ${app.status}

            </h4>

        </div>

        `;

    });

}
if (currentPage.includes("company-applications")) {

    loadCompanyApplications();

}
async function loadCompanyApplications() {

    const response = await apiRequest(
        "/applications/company"
    );

    renderCompanyApplications(
        response.applications
    );

}
function renderCompanyApplications(applications){

    const list = document.getElementById("applicationList");

    if(!list) return;

    document.getElementById("totalApplications").textContent =
        applications.length;

    const pending =
        applications.filter(a => a.status==="Pending").length;

    const accepted =
        applications.filter(a => a.status==="Accepted").length;

    document.getElementById("pendingApplications").textContent =
        pending;

    document.getElementById("acceptedApplications").textContent =
        accepted;

    if(applications.length===0){

        list.innerHTML=`

        <div class="empty-state">

            <h3>No applications received.</h3>

        </div>

        `;

        return;

    }

    list.innerHTML="";

    applications.forEach(app=>{

        list.innerHTML+=`

        <div class="internship-card">

            <h3>${app.student.name}</h3>

            <p>${app.student.email}</p>

            <p><strong>${app.internship.title}</strong></p>

            <p>Status :
                <strong>${app.status}</strong>
            </p>

            <div class="card-actions">

                <button
                    class="btn-primary accept-btn"
                    data-id="${app._id}">

                    Accept

                </button>

                <button
                    class="btn-secondary reject-btn"
                    data-id="${app._id}">

                    Reject

                </button>

            </div>

        </div>

        `;

    });

}
document.addEventListener("click", async(e)=>{

    if(e.target.classList.contains("accept-btn")){

        updateStatus(
            e.target.dataset.id,
            "Accepted"
        );

    }

    if(e.target.classList.contains("reject-btn")){

        updateStatus(
            e.target.dataset.id,
            "Rejected"
        );

    }

});
async function updateStatus(id,status){

    try{

        const response = await apiRequest(

            `/applications/${id}/status`,

            "PATCH",

            {status}

        );

        showToast(response.message);

        loadCompanyApplications();

    }

    catch(error){

        showToast(error.message);

    }


}
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("delete-btn")) return;

    if (!confirm("Delete this internship?")) return;

    try {

        const response = await apiRequest(
            `/internships/${e.target.dataset.id}`,
            "DELETE"
        );

        showToast(response.message);
        loadCompanyInternships();

    } catch (error) {

        showToast(error.message);

    }

});

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("edit-btn")) return;

    editingInternshipId = e.target.dataset.id;

    const internship = window.companyInternships.find(
        i => i._id === editingInternshipId
    );

    document.getElementById("title").value = internship.title;
    document.getElementById("location").value = internship.location;
    document.getElementById("duration").value = internship.duration;
    document.getElementById("stipend").value = internship.stipend;
    document.getElementById("skills").value = internship.skills.join(", ");
    document.getElementById("description").value = internship.description;

    modal.style.display = "flex";

});
const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", searchInternships);

}
function searchInternships() {

    const keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase();

    const filtered = allInternships.filter(item => {

        const title = (item.title || "").toLowerCase();

        const company = (item.companyName || "").toLowerCase();

        const location = (item.location || "").toLowerCase();

        const skills = Array.isArray(item.skills)
            ? item.skills.join(" ").toLowerCase()
            : "";

        return (
            title.includes(keyword) ||
            company.includes(keyword) ||
            location.includes(keyword) ||
            skills.includes(keyword)
        );

    });

    renderStudentInternships(filtered);

}
function showToast(message){

    const toast=document.createElement("div");

    toast.className="toast";

    toast.innerText=message;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.remove();

    },3000);

}