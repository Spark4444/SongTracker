// Function to show a confirm modal dialog to the user
function showConfirm(message, title = "Confirm") {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirm-modal");
        const titleElement = document.getElementById("confirm-title");
        const messageElement = document.getElementById("confirm-message");
        const okBtn = document.getElementById("confirm-ok-btn");
        const cancelBtn = document.getElementById("confirm-cancel-btn");

        if (!modal || !titleElement || !messageElement || !okBtn || !cancelBtn) {
            console.error("Confirm modal elements not found");
            resolve(confirm(message)); // Fallback to native confirm
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

        // Handle OK button click
        const handleOk = () => {
            closeConfirm();
            resolve(true);
        };

        // Handle Cancel button click
        const handleCancel = () => {
            closeConfirm();
            resolve(false);
        };

        // Close function
        const closeConfirm = () => {
            modal.querySelector(".modal-container").classList.remove("modal-show");
            setTimeout(() => {
                modal.style.display = "none";
            }, 300);
            okBtn.removeEventListener("click", handleOk);
            cancelBtn.removeEventListener("click", handleCancel);
            modal.removeEventListener("click", handleOverlayClick);
        };

        // Handle overlay click (close on outside click = cancel)
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                closeConfirm();
                resolve(false);
            }
        };

        // Attach event listeners
        okBtn.addEventListener("click", handleOk);
        cancelBtn.addEventListener("click", handleCancel);
        modal.addEventListener("click", handleOverlayClick);

        // Handle ESC key (cancel)
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                closeConfirm();
                resolve(false);
                document.removeEventListener("keydown", handleEscape);
            }
        };
        document.addEventListener("keydown", handleEscape);
    });
}