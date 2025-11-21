// Profile actions for managing tracked and completed songs

async function moveToCompleted(songId, songName) {
    try {
        const { response, data } = await postFetch("/profile/move-to-completed", { songId, songName });
        
        if (response.ok) {
            await showAlert(data.message || "Song marked as completed!", "Success");
            location.reload();
        } else {
            await showAlert(data.message || "Failed to mark song as completed", "Error");
        }
    } catch (error) {
        console.error("Error:", error);
        await showAlert("An error occurred. Please try again.", "Error");
    }
}

async function removeSong(listType, songId, songName) {
    const confirmMsg = listType === "tracked" 
        ? `Remove "${songName || songId}" from your tracked list?` 
        : `Remove "${songName || songId}" from your completed list?`;
    
    const confirmed = await showConfirm(confirmMsg, "Confirm Removal");
    if (!confirmed) return;

    try {
        const { response, data } = await postFetch("/profile/remove-song", { songId, listType, songName });
        
        if (response.ok) {
            await showAlert(data.message || "Song removed successfully!", "Success");
            location.reload();
        } else {
            await showAlert(data.message || "Failed to remove song", "Error");
        }
    } catch (error) {
        console.error("Error:", error);
        await showAlert("An error occurred. Please try again.", "Error");
    }
}

async function logout() {
    const confirmed = await showConfirm("Are you sure you want to logout?", "Confirm Logout");
    if (!confirmed) return;

    try {
        const { response } = await postFetch("/logout");

        if (response.ok) {
            window.location.href = "/";
        } else {
            await showAlert("Failed to logout. Please try again.", "Error");
        }
    } catch (error) {
        console.error("Error:", error);
        await showAlert("An error occurred. Please try again.", "Error");
    }
}

async function deleteAccount() {
    const confirmed = await showConfirm(
        "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
        "Confirm Account Deletion"
    );
    if (!confirmed) return;

    try {
        const { response, data } = await postFetch("/profile/delete");

        if (response.ok) {
            await showAlert(data.message || "Account deleted successfully!", "Success");
            window.location.href = "/";
        } else {
            await showAlert(data.message || "Failed to delete account. Please try again.", "Error");
        }
    } catch (error) {
        console.error("Error:", error);
        await showAlert("An error occurred. Please try again.", "Error");
    }
}
