const searchInput = document.querySelector("#searchInput");
const results = document.querySelector(".results");
let previousQuery = "";
let debounceTimeout;

// Fetch artists from MusicBrainz API
async function fetchArtists(query) {
    const response = await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();

    if (data.artists) {
        results.innerHTML = data.artists.map(artist => `
            <div class="artist">
                <h3><a href="/artists/${artist.id}">${artist.name}</a></h3>
                <p>Country: ${artist.country || N/A}</p>
                <p>Type: ${artist.type || N/A}</p>
            </div>
        `).join("");
    }
    else {
        results.innerHTML = "<p>No artists found.</p>";
    }
}

// Debounced input event listener
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const value = searchInput.value;
        const valueTrimmed = value.trim();
        if (valueTrimmed && valueTrimmed !== previousQuery) {
            fetchArtists(valueTrimmed);
        }
    }, 500);
});