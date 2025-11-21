// Shared validation utilities

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

// Error display functions
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

// Utility function to clear multiple errors
function clearErrors(fieldIds) {
    fieldIds.forEach(fieldId => clearError(fieldId));
}

// Generic form submission handler
async function handleFormSubmission(formData, endpoint, redirectUrl, errorFieldId) {
    try {
        const { response, data: errorData } = await postFetch(endpoint, formData);
        
        if (response.ok) {
            // Success - redirect to specified page
            window.location.href = redirectUrl;
        } else {
            // Error - show in error div
            const message = errorData.message || `${endpoint.replace('/', '').charAt(0).toUpperCase() + endpoint.replace('/', '').slice(1)} failed`;
            showError(errorFieldId, message);
        }
    } catch (error) {
        console.error(`${endpoint} error:`, error);
        showError(errorFieldId, "Network error. Please try again.");
    }
}

// Generic field validation setup
function setupFieldValidation(fieldId, validationFunction) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.addEventListener("blur", function() {
            const error = validationFunction(this.value);
            if (error) {
                showError(fieldId, error);
            } else {
                clearError(fieldId);
            }
        });
    }
}
