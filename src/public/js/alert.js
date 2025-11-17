// Function to show an alert modal dialog to the user
function showAlert(message, title = "Alert") {
    return new Promise((resolve) => {
        const modal = document.getElementById("alert-modal");
        const titleElement = document.getElementById("alert-title");
        const messageElement = document.getElementById("alert-message");
        const okBtn = document.getElementById("alert-ok-btn");

        if (!modal || !titleElement || !messageElement || !okBtn) {
            console.error("Alert modal elements not found");
            alert(message); // Fallback to native alert
            resolve();
            return;
        }

        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;

        // Show modal
        modal.style.display = "flex";
        
        // Add animation class
        setTimeout(() => {
            modal.querySelector(".modal-container").classList.add("modal-show");
        }, 10);

        // Auto-close timer (3 seconds)
        let autoCloseTimer = setTimeout(() => {
            closeAlert();
            resolve();
        }, 1500);

        // Handle OK button click
        const handleOk = () => {
            closeAlert();
            resolve();
        };

        // Close function
        const closeAlert = () => {
            clearTimeout(autoCloseTimer);
            modal.querySelector(".modal-container").classList.remove("modal-show");
            setTimeout(() => {
                modal.style.display = "none";
            }, 300);
            okBtn.removeEventListener("click", handleOk);
            modal.removeEventListener("click", handleOverlayClick);
        };

        // Handle overlay click (close on outside click)
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                closeAlert();
                resolve();
            }
        };

        // Attach event listeners
        okBtn.addEventListener("click", handleOk);
        modal.addEventListener("click", handleOverlayClick);

        // Handle ESC key
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                closeAlert();
                resolve();
                document.removeEventListener("keydown", handleEscape);
            }
        };
        document.addEventListener("keydown", handleEscape);
    });
}