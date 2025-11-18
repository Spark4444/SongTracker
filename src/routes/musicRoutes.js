import { Router } from "express";
import tryCatch from "../utils/tryCatch.js";
import { generateNavLinksReq } from "../utils/linkGenerator.js";
import fetchWithUserAgent from "../utils/fetchWithUserAgent.js";
import WebError from "../utils/webError.js";

const router = Router();

// Album routes
router.get("/albums/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // First try to fetch as a release-group
        let album = null;
        let otherReleases = [];
        let releaseGroupTypes = null;
        let coverArtUrl = null;

        
        try {
            const rgResponse = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/release-group/${id}?fmt=json&inc=releases`);

            if (rgResponse.ok) {
                const releaseGroup = await rgResponse.json();
                if (!releaseGroup.error) {
                    // Store release group type information
                    releaseGroupTypes = {
                        "primary-type": releaseGroup["primary-type"],
                        "secondary-types": releaseGroup["secondary-types"]
                    };
                    
                    // Get all releases in this release group
                    otherReleases = (releaseGroup.releases || []).map(rel => ({
                        id: rel.id,
                        title: rel.title,
                        date: rel.date,
                        country: rel.country,
                        status: rel.status
                    }));

                    // Fetch the first release to get track information
                    if (releaseGroup.releases && releaseGroup.releases.length > 0) {
                        const firstReleaseId = releaseGroup.releases[0].id;
                        const firstReleaseResponse = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/release/${firstReleaseId}?fmt=json&inc=artist-credits+recordings`);

                        if (firstReleaseResponse.ok) {
                            album = await firstReleaseResponse.json();
                            // Merge release group type information into album object
                            if (releaseGroupTypes) {
                                album["primary-type"] = releaseGroupTypes["primary-type"];
                                album["secondary-types"] = releaseGroupTypes["secondary-types"];
                            }
                            
                            // Try to fetch cover art using the Cover Art Archive API
                            // First try the direct front cover endpoint (faster, no JSON parsing)
                            try {
                                const directCoverResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${firstReleaseId}/front-500`);
                                if (directCoverResponse.ok) {
                                    // The response redirects to the actual image URL
                                    coverArtUrl = directCoverResponse.url;
                                } else {
                                    // Fallback to JSON API for more flexibility
                                    const coverArtResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${firstReleaseId}`);
                                    if (coverArtResponse.ok) {
                                        const coverArtData = await coverArtResponse.json();
                                        if (coverArtData.images && coverArtData.images.length > 0) {
                                            const frontCover = coverArtData.images.find(img => img.front) || coverArtData.images[0];
                                            coverArtUrl = frontCover.thumbnails?.large || frontCover.thumbnails?.[500] || frontCover.image;
                                        }
                                    }
                                }
                            } catch (coverError) {
                                console.error("Error fetching cover art:", coverError);
                            }
                        } else {
                            album = releaseGroup;
                        }
                    } else {
                        album = releaseGroup;
                    }
                    
                    return res.render("albumDetail", { title: album.title || "Album Details", album, otherReleases, links, coverArtUrl });
                }
            }
        } catch (error) {
            console.error("Error fetching as release-group:", error);
        }
        
        // If not a release-group, try to fetch as a regular release
        try {
            const response = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/release/${id}?fmt=json&inc=artist-credits+recordings+release-groups`);

            if (!response.ok) {
                throw new WebError(`Failed to fetch album: ${response.status}`, response.status);
            }
            
            album = await response.json();
            
            if (album.error) {
                throw new WebError(album.error, 404);
            }
            
            // Try to fetch cover art using the Cover Art Archive API
            // First try the direct front cover endpoint (faster, no JSON parsing)
            try {
                const directCoverResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${id}/front-500`);
                if (directCoverResponse.ok) {
                    // The response redirects to the actual image URL
                    coverArtUrl = directCoverResponse.url;
                } else {
                    // Fallback to JSON API for more flexibility
                    const coverArtResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${id}`);
                    if (coverArtResponse.ok) {
                        const coverArtData = await coverArtResponse.json();
                        if (coverArtData.images && coverArtData.images.length > 0) {
                            const frontCover = coverArtData.images.find(img => img.front) || coverArtData.images[0];
                            coverArtUrl = frontCover.thumbnails?.large || frontCover.thumbnails?.[500] || frontCover.image;
                        }
                    }
                }
            } catch (coverError) {
                console.error("Error fetching cover art:", coverError);
            }
            
            // Fetch all releases with the same title (release group)
            if (album["release-group"] && album["release-group"].id) {
                try {
                    const rgResponse = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/release-group/${album["release-group"].id}?fmt=json&inc=releases`);
                    
                    if (rgResponse.ok) {
                        const releaseGroup = await rgResponse.json();
                        // Add type information from release group to album
                        album["primary-type"] = releaseGroup["primary-type"];
                        album["secondary-types"] = releaseGroup["secondary-types"];
                        
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
                    console.error("Error fetching related releases:", error);
                }
            }
            
            res.render("albumDetail", { title: album.title || "Album Details", album, otherReleases, links, coverArtUrl });
        } catch (error) {
            next(error);
        }
    });
});

// Artist routes
router.get("/artists/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // Fetch artist details from MusicBrainz API
        const response = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/artist/${id}?fmt=json`);
        
        if (!response.ok) {
            throw new WebError(`Failed to fetch artist: ${response.status}`, response.status);
        }
        
        const artist = await response.json();
        
        if (artist.error) {
            throw new WebError(artist.error, 404);
        }
        
        // Fetch release groups (albums and EPs) for the artist
        let releaseGroups = [];
        try {
            const rgResponse = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/release-group?artist=${id}&type=album|ep&fmt=json`);
            
            if (rgResponse.ok) {
                const rgData = await rgResponse.json();
                releaseGroups = (rgData["release-groups"] || []).sort((a, b) => {
                    const dateA = a["first-release-date"] || "";
                    const dateB = b["first-release-date"] || "";
                    return dateA.localeCompare(dateB);
                });
            }
        } catch (error) {
            console.error("Error fetching release groups:", error);
        }
        
        res.render("artistDetail", { title: artist.name || "Artist Details", artist, releaseGroups, links });
    });
});

// Song routes
router.get("/songs/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const links = generateNavLinksReq(req);
        
        // Fetch song details from MusicBrainz API
        const response = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/recording/${id}?fmt=json&inc=artist-credits+releases`);
        
        if (!response.ok) {
            throw new WebError(`Failed to fetch song: ${response.status}`, response.status);
        }
        
        const song = await response.json();
        
        if (song.error) {
            throw new WebError(song.error, 404);
        }

        // Extract primary album information and fetch cover art
        let primaryAlbum = null;
        let coverArtUrl = null;
        
        if (song.releases && song.releases.length > 0) {
            // Use the first release as the primary album
            primaryAlbum = song.releases[0];
            
            // Try to fetch cover art for the primary album
            try {
                const directCoverResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${primaryAlbum.id}/front-500`);
                if (directCoverResponse.ok) {
                    coverArtUrl = directCoverResponse.url;
                } else {
                    // Fallback to JSON API for more flexibility
                    const coverArtResponse = await fetchWithUserAgent(`https://coverartarchive.org/release/${primaryAlbum.id}`);
                    if (coverArtResponse.ok) {
                        const coverArtData = await coverArtResponse.json();
                        if (coverArtData.images && coverArtData.images.length > 0) {
                            const frontCover = coverArtData.images.find(img => img.front) || coverArtData.images[0];
                            coverArtUrl = frontCover.thumbnails?.large || frontCover.thumbnails?.[500] || frontCover.image;
                        }
                    }
                }
            } catch (coverError) {
                console.error("Error fetching cover art for song:", coverError);
            }
        }
        
        // Fetch all versions of the same song by the same artist
        let otherVersions = [];
        if (song.title && song["artist-credit"] && song["artist-credit"].length > 0) {
            try {
                const artist = song["artist-credit"][0];
                const artistId = artist.artist ? artist.artist.id : null;
                
                if (artistId) {
                    // Search for recordings with the same title by the same artist
                    const searchQuery = `recording:"${song.title}" AND arid:${artistId}`;
                    const searchResponse = await fetchWithUserAgent(`https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(searchQuery)}&fmt=json`);
                    
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
                console.error("Error fetching other song versions:", error);
            }
        }
        
        song.artist = song["artist-credit"] && song["artist-credit"].length > 0
            ? song["artist-credit"].map(ac => ac.name).join(", ")
            : "N/A";

        res.render("songDetail", { title: song.title || "Song Details", song, otherVersions, links, user: req.session.user, primaryAlbum, coverArtUrl });
    });
});

export default router;
