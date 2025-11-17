// Profile actions for managing tracked and completed songs

async function moveToCompleted(songId, songName) {
    try {
        const response = await fetch("/profile/move-to-completed", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ songId, songName }),
        });

        const data = await response.json();
        
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

async function removeSong(listType, songId) {
    const confirmMsg = listType === "tracked" 
        ? "Remove this song from your tracked list?" 
        : "Remove this song from your completed list?";
    
    const confirmed = await showConfirm(confirmMsg, "Confirm Removal");
    if (!confirmed) return;

    try {
        const response = await fetch(`/profile/remove-song`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ songId, listType }),
        });

        const data = await response.json();
        
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
        const response = await fetch("/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

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
