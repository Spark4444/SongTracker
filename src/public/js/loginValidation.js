// Login form validation script

function validateLoginForm(data) {
    const fieldIds = ["email", "password"];
    clearErrors(fieldIds);
    let isValid = true;

    const emailError = validateEmail(data.email);
    if (emailError) {
        showError("email", emailError);
        isValid = false;
    }

    const passwordError = validatePassword(data.password);
    if (passwordError) {
        showError("password", passwordError);
        isValid = false;
    }

    return isValid;
}

// Initialize form validation when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    // Setup field validation
    setupFieldValidation("email", validateEmail);
    setupFieldValidation("password", validatePassword);
    
    const loginForm = document.getElementById("login-form");

    // Form submission validation
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Client-side validation
            if (!validateLoginForm(data)) {
                return; // Don't submit if validation fails
            }
            
            // Handle form submission
            await handleFormSubmission(data, "/login", "/profile", "email");
        });
    }
});
