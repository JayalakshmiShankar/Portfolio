const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;


/* =====================================
   MIME TYPES
===================================== */

const contentTypes = {

    ".html": "text/html; charset=UTF-8",

    ".js":
        "application/javascript; charset=UTF-8",

    ".css":
        "text/css; charset=UTF-8",

    ".json":
        "application/json; charset=UTF-8",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg",

    ".svg":
        "image/svg+xml",

    ".ico":
        "image/x-icon",

    ".txt":
        "text/plain; charset=UTF-8"

};



/* =====================================
   SERVER
===================================== */

const server =
    http.createServer(
        (req, res) => {


            let requestPath =
                decodeURIComponent(
                    req.url.split("?")[0]
                );


            /*
               Homepage
            */

            if (
                requestPath === "/"
            ) {

                requestPath =
                    "/index.html";

            }


            /*
               Prevent path traversal.
            */

            const safePath =
                path.normalize(
                    requestPath
                ).replace(
                    /^(\.\.[\/\\])+/, ""
                );


            const filePath =
                path.join(
                    __dirname,
                    safePath
                );


            /*
               File extension
            */

            const extension =
                path.extname(
                    filePath
                );


            const contentType =
                contentTypes[
                    extension
                ]
                ||
                "application/octet-stream";



            /* =================================
               CONTROL.V

               IMPORTANT:

               Never cache control.v
               on the server.

               Browser / Service Worker
               must check the latest value.
            ================================= */

            let headers = {

                "Content-Type":
                    contentType

            };


            if (
                requestPath ===
                "/control.v"
            ) {

                headers[
                    "Cache-Control"
                ] =
                    "no-store, no-cache, must-revalidate";

                headers[
                    "Pragma"
                ] =
                    "no-cache";

                headers[
                    "Expires"
                ] =
                    "0";

            }


            /*
               Other files
            */

            else {

                headers[
                    "Cache-Control"
                ] =
                    "no-cache";

            }



            /* =================================
               READ FILE
            ================================= */

            fs.readFile(
                filePath,
                (error, data) => {


                    if (error) {


                        res.writeHead(
                            404,
                            {
                                "Content-Type":
                                    "text/html"
                            }
                        );


                        res.end(
                            `
                            <!DOCTYPE html>

                            <html>

                            <head>

                                <title>
                                    404
                                </title>

                            </head>

                            <body>

                                <h1>
                                    404 - File Not Found
                                </h1>

                                <p>
                                    ${requestPath}
                                </p>

                            </body>

                            </html>
                            `
                        );


                        return;

                    }



                    res.writeHead(
                        200,
                        headers
                    );


                    res.end(data);

                }
            );

        }
    );



/* =====================================
   START SERVER
===================================== */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "===================================="
        );

        console.log(
            "       JAYA PORTFOLIO SERVER"
        );

        console.log(
            "===================================="
        );

        console.log("");

        console.log(
            "Local:"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log("");

        console.log(
            "For another device on same Wi-Fi:"
        );

        console.log(
            `http://YOUR-IP:${PORT}`
        );

        console.log("");

        console.log(
            "Control file:"
        );

        console.log(
            "control.v = 0 OR 1"
        );

        console.log("");

        console.log(
            "Press CTRL + C to stop."
        );

        console.log("");

    }
);