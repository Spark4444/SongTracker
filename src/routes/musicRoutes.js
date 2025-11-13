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
        const response = await fetch(`https://musicbrainz.org/ws/2/release/${id}?fmt=json&inc=artist-credits+recordings+release-groups`, {
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
        
        // Fetch all releases with the same title (release group)
        let otherReleases = [];
        if (album['release-group'] && album['release-group'].id) {
            try {
                const rgResponse = await fetch(`https://musicbrainz.org/ws/2/release-group/${album['release-group'].id}?fmt=json&inc=releases`, {
                    headers: {
                        'User-Agent': 'SongTracker/1.0.0 (https://github.com/songtracker)'
                    }
                });
                
                if (rgResponse.ok) {
                    const releaseGroup = await rgResponse.json();
                    // Filter out the current release and get all other releases
                    otherReleases = (releaseGroup.releases || []).map(rel => ({
                        id: rel.id,
                        title: rel.title,
                        date: rel.date,
                        country: rel.country,
                        status: rel.status
                    }));
                }
            } catch (error) {
                console.error('Error fetching related releases:', error);
            }
        }
        
        res.render("albumDetail", { title: album.title || "Album Details", album, otherReleases, links });
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
        
        // Fetch all versions of the same song by the same artist
        let otherVersions = [];
        if (song.title && song['artist-credit'] && song['artist-credit'].length > 0) {
            try {
                const artist = song['artist-credit'][0];
                const artistId = artist.artist ? artist.artist.id : null;
                
                if (artistId) {
                    // Search for recordings with the same title by the same artist
                    const searchQuery = `recording:"${song.title}" AND arid:${artistId}`;
                    const searchResponse = await fetch(`https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(searchQuery)}&fmt=json&limit=100`, {
                        headers: {
                            'User-Agent': 'SongTracker/1.0.0 (https://github.com/songtracker)'
                        }
                    });
                    
                    if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        if (searchData.recordings) {
                            otherVersions = searchData.recordings.map(recording => {
                                // Get the first release for album info
                                const firstRelease = recording.releases && recording.releases.length > 0 
                                    ? recording.releases[0] 
                                    : null;
                                
                                return {
                                    id: recording.id,
                                    title: recording.title,
                                    length: recording.length,
                                    disambiguation: recording.disambiguation,
                                    albumTitle: firstRelease ? firstRelease.title : null,
                                    albumId: firstRelease ? firstRelease.id : null,
                                    releaseDate: firstRelease ? firstRelease.date : null
                                };
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching other song versions:', error);
            }
        }
        
        res.render("songDetail", { title: song.title || "Song Details", song, otherVersions, links });
    });
});

export default router;
