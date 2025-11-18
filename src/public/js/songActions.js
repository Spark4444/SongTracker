document.addEventListener("DOMContentLoaded", function() {
    const trackBtn = document.getElementById("track-song-btn");
    const completeBtn = document.getElementById("complete-song-btn");

    if (trackBtn) {
        trackBtn.addEventListener("click", async function() {
            const songId = this.getAttribute("data-song-id");
            const songName = this.getAttribute("data-song-name");
            const artistName = this.getAttribute("data-artist-name");
            
            try {
                const response = await fetch("/profile/tracked", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        songId: songId,
                        songName: songName,
                        artistName: artistName
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    await showAlert(data.message, "Success");
                } else {
                    await showAlert("Failed to update tracking status", "Error");
                }
            } catch (error) {
                console.error("Error:", error);
                await showAlert("An error occurred while updating tracking status", "Error");
            }
        });
    }

    if (completeBtn) {
        completeBtn.addEventListener("click", async function() {
            const songId = this.getAttribute("data-song-id");
            const songName = this.getAttribute("data-song-name");
            const artistName = this.getAttribute("data-artist-name");
            
            try {
                const response = await fetch("/profile/completed", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        songId: songId,
                        songName: songName,
                        artistName: artistName
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    await showAlert(data.message, "Success");
                } else {
                    await showAlert("Failed to update completion status", "Error");
                }
            } catch (error) {
                console.error("Error:", error);
                await showAlert("An error occurred while updating completion status", "Error");
            }
        });
    }
});
