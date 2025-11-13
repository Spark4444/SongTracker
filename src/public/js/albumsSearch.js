const searchInput = document.querySelector("#searchInput");
const results = document.querySelector(".results");
let previousQuery = "";
let debounceTimeout;

// Fetch albums from MusicBrainz API
async function fetchAlbums(query) {
    const response = await fetch(`https://musicbrainz.org/ws/2/release?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();

    if (data.releases && data.releases.length > 0) {
        results.innerHTML = data.releases.map(album => `
            <div class="album">
                <h3>${album.title}</h3>
                <p>Artist: ${album['artist-credit'] ? album['artist-credit'].map(ac => ac.name).join(', ') : 'N/A'}</p>
                <p>Date: ${album.date || 'N/A'}</p>
                <p>Status: ${album.status || 'N/A'}</p>
            </div>
        `).join("");
    }
    else {
        results.innerHTML = "<p>No albums found.</p>";
    }
}

// Debounced input event listener
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const value = searchInput.value;
        const valueTrimmed = value.trim();
        if (valueTrimmed && valueTrimmed !== previousQuery) {
            fetchAlbums(valueTrimmed);
        }
    }, 300);
});
