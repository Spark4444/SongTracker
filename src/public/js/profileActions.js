// Profile actions for managing tracked and completed songs

async function moveToCompleted(songId, songName) {
    try {
        const response = await fetch('/profile/move-to-completed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ songId, songName }),
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || 'Song marked as completed!');
            location.reload();
        } else {
            alert(data.message || 'Failed to mark song as completed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}

async function removeSong(listType, songId) {
    const confirmMsg = listType === 'tracked' 
        ? 'Remove this song from your tracked list?' 
        : 'Remove this song from your completed list?';
    
    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`/profile/remove-song`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ songId, listType }),
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || 'Song removed successfully!');
            location.reload();
        } else {
            alert(data.message || 'Failed to remove song');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
