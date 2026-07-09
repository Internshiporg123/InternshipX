// InternshipX Authentication
// Crafted by ByteForge

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", registerUser);

}

async function registerUser(e) {

    e.preventDefault();

    const button = document.getElementById("registerBtn");
    const message = document.getElementById("message");

    message.innerHTML = "";

    button.disabled = true;
    button.innerText = "Creating Account...";

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const role = document.querySelector(
        'input[name="role"]:checked'
    ).value;

    // Validation

    if (name.length < 3) {

        message.style.color = "#EF4444";
        message.innerHTML = "Name must contain at least 3 characters.";

        button.disabled = false;
        button.innerText = "Create Account";

        return;
    }

    if (password.length < 8) {

        message.style.color = "#EF4444";
        message.innerHTML = "Password must be at least 8 characters.";

        button.disabled = false;
        button.innerText = "Create Account";

        return;
    }

    try {

        const response = await apiRequest(
            "/auth/register",
            "POST",
            {
                name,
                email,
                password,
                role
            }
        );

        message.style.color = "#22C55E";

        message.innerHTML = response.message;

        // Save email for OTP page

        localStorage.setItem("verifyEmail", email);

        setTimeout(() => {

            window.location.href = "verify-otp.html";

        }, 1200);

    }

    catch (error) {

        message.style.color = "#EF4444";

        message.innerHTML = error.message;

    }

    finally {

        button.disabled = false;

        button.innerText = "Create Account";

    }

}

const emailInput = document.getElementById("email");

if (emailInput) {

    const savedEmail = localStorage.getItem("verifyEmail");

    if (savedEmail) {
        emailInput.value = savedEmail;
    }

}
/* =========================================
   VERIFY OTP
========================================= */

const verifyForm = document.getElementById("verifyForm");

if (verifyForm) {

    const savedEmail = localStorage.getItem("verifyEmail");

    if (savedEmail) {
        document.getElementById("email").value = savedEmail;
    }

    verifyForm.addEventListener("submit", verifyOTP);

}

async function verifyOTP(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const otp = document.getElementById("otp").value.trim();

    const message = document.getElementById("message");

    message.innerHTML = "";

    try {

        const response = await apiRequest(
            "/auth/verify-otp",
            "POST",
            {
                email,
                otp
            }
        );

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        localStorage.removeItem("verifyEmail");

        setTimeout(() => {

            window.location.href = "login.html";

        },1500);

    }

    catch(error){

        message.style.color="#EF4444";
        message.innerHTML=error.message;

    }

}
/* =========================================
   RESEND OTP
========================================= */

const resendBtn = document.getElementById("resendBtn");

if(resendBtn){

    resendBtn.addEventListener("click", resendOTP);

}

async function resendOTP(){

    const email=document.getElementById("email").value.trim();

    if(!email){

        alert("Enter your email first.");

        return;

    }

    try{

        const response=await apiRequest(
            "/auth/resend-otp",
            "POST",
            {
                email
            }
        );

        alert(response.message);

    }

    catch(error){

        alert(error.message);

    }

}
/* =========================================
   LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", loginUser);

}

async function loginUser(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("message");

    try {

        const response = await apiRequest(
            "/auth/login",
            "POST",
            {
                email,
                password
            }
        );

        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        setTimeout(() => {

            if (response.user.role === "student") {

                window.location.href = "student-dashboard.html";

            } else {

                window.location.href = "company-dashboard.html";

            }

        },1000);

    }
    catch(error){

        message.style.color="#EF4444";
        message.innerHTML=error.message;

    }

}