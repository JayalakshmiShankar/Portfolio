const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const server = http.createServer((req, res) => {

    let filePath = "." + req.url;

    if (filePath === "./") {
        filePath = "./index.html";
    }

    const ext = path.extname(filePath);

    const contentTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon"
    };

    const contentType =
        contentTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {

        if (err) {

            res.writeHead(404, {
                "Content-Type": "text/html"
            });

            res.end(`
                <h1>404 - File Not Found</h1>
                <p>${filePath}</p>
            `);

            return;
        }

        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        });

        res.end(content);

    });

});

server.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("=================================");
    console.log("   PORTFOLIO SERVER RUNNING");
    console.log("=================================");
    console.log("");
    console.log(`Local:   http://localhost:${PORT}`);
    console.log("");
    console.log("Press CTRL + C to stop the server.");
    console.log("");

});