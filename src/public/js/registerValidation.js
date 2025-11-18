// Registration form validation script

// Validation functions
function validateName(name) {
    if (!name || name.trim() === "") {
        return "Name is required";
    }
    if (name.length < 1) {
        return "Name must be at least 1 character long";
    }
    if (name.length > 50) {
        return "Name must not exceed 50 characters";
    }
    return null;
}

function validateEmail(email) {
    if (!email || email.trim() === "") {
        return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please provide a valid email address";
    }
    return null;
}

function validatePassword(password) {
    if (!password || password === "") {
        return "Password is required";
    }
    if (password.length < 1) {
        return "Password must be at least 1 character long";
    }
    if (password.length > 100) {
        return "Password must not exceed 100 characters";
    }
    return null;
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + "-error");
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    if (inputElement) {
        inputElement.classList.add("error");
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + "-error");
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = "";
    }
    if (inputElement) {
        inputElement.classList.remove("error");
    }
}

function clearAllErrors() {
    clearError("name");
    clearError("email");
    clearError("password");
}

function validateForm(data) {
    clearAllErrors();
    let isValid = true;

    const nameError = validateName(data.name);
    if (nameError) {
        showError("name", nameError);
        isValid = false;
    }

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
    // Real-time validation on input blur
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const registerForm = document.getElementById("register-form");

    if (nameInput) {
        nameInput.addEventListener("blur", function() {
            const nameError = validateName(this.value);
            if (nameError) {
                showError("name", nameError);
            } else {
                clearError("name");
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener("blur", function() {
            const emailError = validateEmail(this.value);
            if (emailError) {
                showError("email", emailError);
            } else {
                clearError("email");
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("blur", function() {
            const passwordError = validatePassword(this.value);
            if (passwordError) {
                showError("password", passwordError);
            } else {
                clearError("password");
            }
        });
    }

    // Form submission validation
    if (registerForm) {
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Client-side validation
            if (!validateForm(data)) {
                return; // Don"t submit if validation fails
            }
            
            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    // Success - redirect to profile page
                    window.location.href = "/profile";
                } else {
                    // Error - show alert
                    const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
                    if (typeof showAlert === "function") {
                        await showAlert(errorData.message || "Registration failed", "Registration Error");
                    } else {
                        alert(errorData.message || "Registration failed");
                    }
                }
            } catch (error) {
                console.error("Registration error:", error);
                if (typeof showAlert === "function") {
                    await showAlert("Network error. Please try again.", "Connection Error");
                } else {
                    alert("Network error. Please try again.");
                }
            }
        });
    }
});
