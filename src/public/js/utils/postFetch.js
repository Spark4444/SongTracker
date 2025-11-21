// Function to make a POST request
async function postFetch(url, body = null) {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    // Check if the response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data = null;
    
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        // If not JSON, read as text (might be HTML error page)
        const text = await response.text();
        data = { message: response.ok ? "Success" : "Server error occurred" };
    }

    return { response, data };
}