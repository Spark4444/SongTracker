const searchInput = document.querySelector("#searchInput");
const results = document.querySelector(".results");
let previousQuery = "";
let debounceTimeout;

// Fetch albums from MusicBrainz API
async function fetchAlbums(query) {
    const response = await fetch(`https://musicbrainz.org/ws/2/release?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();

    if (data.releases && data.releases.length > 0) {
        // Filter out duplicate album titles, keep first occurrence
        const uniqueAlbums = [];
        const seenTitles = new Set();
        
        for (const album of data.releases) {
            const normalizedTitle = (album.title || "").toLowerCase().trim();
            const artist = album["artist-credit"] ? album["artist-credit"].map(ac => ac.name).join(", ") : "";
            const key = `${normalizedTitle}|${artist.toLowerCase()}`;
            
            if (!seenTitles.has(key)) {
                seenTitles.add(key);
                uniqueAlbums.push(album);
            }
        }
        
        results.innerHTML = uniqueAlbums.map(album => `
            <div class="album">
                <h3><a href="/albums/${album.id}">${album.title}</a></h3>
                <p>Artist: ${album["artist-credit"] ? album["artist-credit"].map(ac => ac.name).join(", ") : "N/A"}</p>
                <p>Date: ${album.date || "N/A"}</p>
                <p>Status: ${album.status || "N/A"}</p>
            </div>
        `).join("");
        
        if (data.releases.length > uniqueAlbums.length) {
            results.innerHTML += `<p class="search-info"><em>Showing ${uniqueAlbums.length} unique albums (${data.releases.length} total results including duplicates)</em></p>`;
        }
    }
    else {
        results.innerHTML = "<p>No albums found.</p>";
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
            fetchAlbums(valueTrimmed);
        }
    }, 500);
});
