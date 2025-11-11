const searchInput = document.querySelector("#searchInput");
const results = document.querySelector(".results");
let previousQuery = "";
let debounceTimeout;

async function fetchArtists(query) {
    const response = await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`);
    const data = await response.json();

    results.innerHTML = data.artists.map(artist => `
        <div class="artist">
            <h3>${artist.name}</h3>
            <p>Country: ${artist.country || 'N/A'}</p>
            <p>Type: ${artist.type || 'N/A'}</p>
        </div>
    `).join("");
    return data.artists;
}

searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const value = searchInput.value;
        const valueTrimmed = value.trim();
        if (valueTrimmed && valueTrimmed !== previousQuery) {
            fetchArtists(valueTrimmed);
        }
    }, 300);
});