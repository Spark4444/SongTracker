const searchInput = document.querySelector("#searchInput");
const results = document.querySelector(".results");
let previousQuery = "";
let debounceTimeout;

// Fetch songs from MusicBrainz API
async function fetchSongs(query) {
    const response = await fetch(`https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();

    if (data.recordings && data.recordings.length > 0) {
        // Filter out duplicate song titles, keep first occurrence
        const uniqueSongs = [];
        const seenTitles = new Set();
        
        for (const song of data.recordings) {
            const normalizedTitle = (song.title || "").toLowerCase().trim();
            const artist = song["artist-credit"] ? song["artist-credit"].map(ac => ac.name).join(", ") : "";
            const key = `${normalizedTitle}|${artist.toLowerCase()}`;
            
            if (!seenTitles.has(key)) {
                seenTitles.add(key);
                uniqueSongs.push(song);
            }
        }
        
        results.innerHTML = uniqueSongs.map(song => `
            <div class="song">
                <h3><a href="/songs/${song.id}">${song.title}</a></h3>
                <p>Artist: ${song["artist-credit"] ? song["artist-credit"].map(ac => ac.name).join(", ") : "N/A"}</p>
                <p>Length: ${song.length ? Math.floor(song.length / 60000) + ":" + String(Math.floor((song.length % 60000) / 1000)).padStart(2, "0") : "N/A"}</p>
            </div>
        `).join("");
        
        if (data.recordings.length > uniqueSongs.length) {
            results.innerHTML += `<p class="search-info"><em>Showing ${uniqueSongs.length} unique songs (${data.recordings.length} total results including duplicates)</em></p>`;
        }
    }
    else {
        results.innerHTML = "<p>No songs found.</p>";
    }
}

// Debounced input event listener
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    // Show loading indicator
    results.innerHTML = `
        <div class="loading-container">
            <img class="loading" src="/images/loading.gif" alt="Loading...">
            <p>Loading...</p>
        </div>
    `;
    debounceTimeout = setTimeout(async () => {
        const value = searchInput.value;
        const valueTrimmed = value.trim();
        if (valueTrimmed && valueTrimmed !== previousQuery) {
            fetchSongs(valueTrimmed);
        }
    }, 500);
});
