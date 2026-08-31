const CONTROL_FILE = "./control.v";

const CACHE_PREFIX = "portfolio-v";

const META_CACHE = "portfolio-meta";


/* =========================================
   READ 0 / 1
========================================= */

async function readControl() {

    try {

        const response =
            await fetch(
                CONTROL_FILE,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            return null;

        }


        const value =
            (await response.text()).trim();


        if (
            value === "0" ||
            value === "1"
        ) {

            return value;

        }


        return null;

    }

    catch (error) {

        return null;

    }

}



/* =========================================
   READ LAST VERSION
========================================= */

async function getLastVersion() {

    const cache =
        await caches.open(
            META_CACHE
        );


    const response =
        await cache.match(
            "./version"
        );


    if (!response) {

        return null;

    }


    const value =
        await response.text();


    if (
        value === "0" ||
        value === "1"
    ) {

        return value;

    }


    return null;

}



/* =========================================
   SAVE LAST VERSION
========================================= */

async function saveVersion(
    version
) {

    const cache =
        await caches.open(
            META_CACHE
        );


    await cache.put(

        "./version",

        new Response(
            version
        )

    );

}



/* =========================================
   DOWNLOAD AND CACHE PORTFOLIO
========================================= */

async function updateCache(
    version,
    request
) {

    const cacheName =
        CACHE_PREFIX + version;


    const cache =
        await caches.open(
            cacheName
        );


    const response =
        await fetch(
            request,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Could not download portfolio"
        );

    }


    /*
       Save the complete HTML page.
    */

    await cache.put(
        request,
        response.clone()
    );


    /*
       Also store ./index.html.
    */

    await cache.put(
        "./index.html",
        response.clone()
    );


    await saveVersion(
        version
    );


    /*
       Remove the other slot.
    */

    const oldVersion =
        version === "0"
            ? "1"
            : "0";


    await caches.delete(
        CACHE_PREFIX + oldVersion
    );


    return response;

}



/* =========================================
   INSTALL
========================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "Service Worker installed"
        );

        self.skipWaiting();

    }
);



/* =========================================
   ACTIVATE
========================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            self.clients.claim()
        );

    }
);



/* =========================================
   FETCH
========================================= */

self.addEventListener(
    "fetch",
    event => {


        /*
           Only handle page navigation.
        */

        if (
            event.request.mode !==
            "navigate"
        ) {

            return;

        }


        event.respondWith(

            handleRequest(
                event.request
            )

        );

    }
);



/* =========================================
   HANDLE PAGE
========================================= */

async function handleRequest(
    request
) {


    /*
       Try reading the online
       control file.
    */

    const onlineVersion =
        await readControl();


    /* =====================================
       ONLINE
    ===================================== */

    if (
        onlineVersion !== null
    ) {


        const savedVersion =
            await getLastVersion();


        /*
           New version
        */

        if (
            savedVersion !==
            onlineVersion
        ) {


            console.log(
                "Version changed:",
                savedVersion,
                "→",
                onlineVersion
            );


            try {

                return await updateCache(
                    onlineVersion,
                    request
                );

            }

            catch (error) {

                console.log(
                    "Update failed."
                );

            }

        }


        /*
           Same version
        */

        const cache =
            await caches.open(
                CACHE_PREFIX +
                onlineVersion
            );


        const cached =
            await cache.match(
                request
            );


        if (cached) {

            return cached;

        }


        const index =
            await cache.match(
                "./index.html"
            );


        if (index) {

            return index;

        }


        /*
           Cache does not exist yet.
        */

        try {

            return await updateCache(
                onlineVersion,
                request
            );

        }

        catch (error) {

            console.log(
                "Could not create cache"
            );

        }

    }



    /* =====================================
       OFFLINE
    ===================================== */

    const savedVersion =
        await getLastVersion();


    if (
        savedVersion !== null
    ) {


        console.log(
            "Offline — using version:",
            savedVersion
        );


        const cache =
            await caches.open(
                CACHE_PREFIX +
                savedVersion
            );


        const cached =
            await cache.match(
                request
            );


        if (cached) {

            return cached;

        }


        const index =
            await cache.match(
                "./index.html"
            );


        if (index) {

            return index;

        }

    }



    /* =====================================
       SEARCH BOTH CACHE SLOTS
    ===================================== */

    for (
        const version of ["0", "1"]
    ) {


        const cache =
            await caches.open(
                CACHE_PREFIX +
                version
            );


        const cached =
            await cache.match(
                "./index.html"
            );


        if (cached) {

            return cached;

        }

    }



    /* =====================================
       NO CACHE
    ===================================== */

    return new Response(

        `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Offline
            </title>

            <style>

                body {

                    background:
                        #0f172a;

                    color: white;

                    font-family:
                        Arial;

                    text-align: center;

                    padding:
                        100px 20px;
                }

                h1 {

                    color:
                        #38bdf8;
                }

            </style>

        </head>

        <body>

            <h1>
                Portfolio Offline
            </h1>

            <p>
                Connect to the internet once
                to cache this portfolio.
            </p>

        </body>

        </html>
        `,

        {
            status: 200,

            headers: {

                "Content-Type":
                    "text/html"

            }

        }

    );

}