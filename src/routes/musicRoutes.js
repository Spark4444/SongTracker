import { Router } from "express";
import tryCatch from "../functions/tryCatch.js";
import { generateNavLinksReq } from "../functions/linkGenerator.js";

const router = Router();

// Album routes
router.get("/albums/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // Fetch album details from MusicBrainz API
        const response = await fetch(`https://musicbrainz.org/ws/2/release/${id}?fmt=json&inc=artist-credits+recordings`, {
            headers: {
                'User-Agent': 'SongTracker/1.0.0 (https://github.com/songtracker)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch album: ${response.status}`);
        }
        
        const album = await response.json();
        
        if (album.error) {
            throw new Error(album.error);
        }
        
        res.render("albumDetail", { title: album.title || "Album Details", album, links });
    });
});

// Artist routes
router.get("/artists/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // Fetch artist details from MusicBrainz API
        const response = await fetch(`https://musicbrainz.org/ws/2/artist/${id}?fmt=json&inc=releases`, {
            headers: {
                'User-Agent': 'SongTracker/1.0.0 (https://github.com/songtracker)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch artist: ${response.status}`);
        }
        
        const artist = await response.json();
        
        if (artist.error) {
            throw new Error(artist.error);
        }
        
        res.render("artistDetail", { title: artist.name || "Artist Details", artist, links });
    });
});

// Song routes
router.get("/songs/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // Fetch song details from MusicBrainz API
        const response = await fetch(`https://musicbrainz.org/ws/2/recording/${id}?fmt=json&inc=artist-credits+releases`, {
            headers: {
                'User-Agent': 'SongTracker/1.0.0 (https://github.com/songtracker)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch song: ${response.status}`);
        }
        
        const song = await response.json();
        
        if (song.error) {
            throw new Error(song.error);
        }
        
        res.render("songDetail", { title: song.title || "Song Details", song, links });
    });
});

export default router;
