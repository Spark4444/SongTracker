// Function to perform fetch with custom User-Agent header
export default function fetchWithUserAgent(url) {
    return fetch(url, {
        headers: {
            "User-Agent": "SongTracker/1.0.0 (https://github.com/songtracker)"
        }
    });
}