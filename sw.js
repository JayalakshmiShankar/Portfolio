/*
=================================================
 JAYA PORTFOLIO
 EXACT 0 / 1 ONLINE + OFFLINE VERSION CONTROL
=================================================
*/


const CONTROL_FILE =
    "./control.v";


const CACHE_PREFIX =
    "portfolio-v";


const META_CACHE =
    "portfolio-meta";


/*
=================================================
 READ ONLINE CONTROL

 Returns:
 "0"
 "1"
 null = cannot reach network
=================================================
*/

async function readOnlineControl() {

    try {

        const response =
            await fetch(
                CONTROL_FILE +
                "?t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            return null;

        }


        const value =
            (
                await response.text()
            ).trim();


        /*
         * ONLY ACCEPT 0 OR 1
         */

        if (
            value === "0" ||
            value === "1"
        ) {

            return value;

        }


        return null;

    }

    catch (error) {

        /*
         * No internet / network failed
         */

        return null;

    }

}



/*
=================================================
 GET LAST SUCCESSFULLY CACHED VERSION
=================================================
*/

async function getStoredVersion() {

    const cache =
        await caches.open(
            META_CACHE
        );


    const response =
        await cache.match(
            "./active-version"
        );


    if (!response) {

        return null;

    }


    const value =
        (
            await response.text()
        ).trim();


    if (
        value === "0" ||
        value === "1"
    ) {

        return value;

    }


    return null;

}



/*
=================================================
 SAVE ACTIVE VERSION
=================================================
*/

async function saveStoredVersion(
    version
) {

    const cache =
        await caches.open(
            META_CACHE
        );


    await cache.put(

        "./active-version",

        new Response(
            version
        )

    );

}



/*
=================================================
 DOWNLOAD NEW VERSION
=================================================
*/

async function downloadVersion(
    version,
    request
) {


    const cacheName =
        CACHE_PREFIX +
        version;


    const cache =
        await caches.open(
            cacheName
        );


    /*
     * ALWAYS GET THE NEW PAGE
     * FROM THE NETWORK.
     */

    const response =
        await fetch(
            request,
            {
                cache:
                    "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Could not download new version"
        );

    }


    /*
     * Store index.html
     */

    await cache.put(
        "./index.html",
        response.clone()
    );


    /*
     * Store navigation URL
     */

    await cache.put(
        request,
        response.clone()
    );


    /*
     * Save active version ONLY
     * AFTER successful download.
     */

    await saveStoredVersion(
        version
    );


    return response;

}



/*
=================================================
 DELETE THE OTHER SLOT
=================================================
*/

async function removeOldSlot(
    activeVersion
) {

    const oldVersion =
        activeVersion === "0"
            ? "1"
            : "0";


    await caches.delete(

        CACHE_PREFIX +
        oldVersion

    );

}



/*
=================================================
 INSTALL
=================================================
*/

self.addEventListener(
    "install",
    event => {

        console.log(
            "Service Worker installed"
        );


        self.skipWaiting();

    }
);



/*
=================================================
 ACTIVATE
=================================================
*/

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            self.clients.claim()

        );

    }
);



/*
=================================================
 FETCH
=================================================
*/

self.addEventListener(
    "fetch",
    event => {


        /*
         * ONLY CONTROL PAGE NAVIGATION.
         */

        if (
            event.request.mode !==
            "navigate"
        ) {

            return;

        }


        event.respondWith(

            handlePage(
                event.request
            )

        );

    }
);



/*
=================================================
 PAGE HANDLER
=================================================
*/

async function handlePage(
    request
) {


    /*
    =================================================
       STEP 1

       TRY NETWORK CONTROL FILE.

       If it succeeds → ONLINE.
       If it fails → OFFLINE.
    =================================================
    */


    const onlineVersion =
        await readOnlineControl();



    /*
    =================================================
       ONLINE
    =================================================
    */

    if (
        onlineVersion !== null
    ) {


        console.log(
            "ONLINE"
        );


        console.log(
            "Server version:",
            onlineVersion
        );


        const storedVersion =
            await getStoredVersion();


        console.log(
            "Cached version:",
            storedVersion
        );



        /*
        =============================================
           NEW VERSION
        =============================================
        */

        if (
            storedVersion !==
            onlineVersion
        ) {


            console.log(
                "VERSION CHANGED"
            );


            console.log(
                "Updating to:",
                onlineVersion
            );


            try {


                /*
                 * Download new version.
                 */

                const response =
                    await downloadVersion(
                        onlineVersion,
                        request
                    );


                /*
                 * Delete old version.
                 */

                await removeOldSlot(
                    onlineVersion
                );


                /*
                 * IMPORTANT:

                 * Return the NEW response
                 * immediately.

                 * The user sees the new
                 * portfolio now.
                 */

                return response;

            }

            catch (error) {


                console.log(
                    "Update failed:",
                    error
                );


                /*
                 * If update failed,
                 * safely use old cache.
                 */

            }

        }



        /*
        =============================================
           SAME VERSION
        =============================================
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
         * First visit / cache missing.
         */

        try {

            return await downloadVersion(
                onlineVersion,
                request
            );

        }

        catch (error) {

            console.log(
                "Initial download failed"
            );

        }

    }



    /*
    =================================================
       OFFLINE
    =================================================

       IMPORTANT:

       We do NOT read control.v here.

       We do NOT check for updates.

       We do NOT display update messages.

       We simply use the last successfully
       cached version.
    =================================================
    */


    console.log(
        "OFFLINE - CACHE ONLY"
    );


    const storedVersion =
        await getStoredVersion();


    if (
        storedVersion !== null
    ) {


        const cache =
            await caches.open(

                CACHE_PREFIX +
                storedVersion

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



    /*
    =================================================
       LAST RESORT

       Check either A/B cache.
    =================================================
    */

    for (
        const version
        of ["0", "1"]
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



    /*
    =================================================
       NOTHING CACHED
    =================================================
    */

    return new Response(

        `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Portfolio Offline
            </title>

            <style>

                body {

                    background:
                        #0f172a;

                    color:
                        white;

                    font-family:
                        Arial;

                    text-align:
                        center;

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
                to load the portfolio.
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



/*
=================================================
 MESSAGE API

 index.html asks:

 "What version am I using?"
=================================================
*/

self.addEventListener(
    "message",
    event => {


        if (
            event.data &&
            event.data.type ===
            "GET_VERSION"
        ) {


            getStoredVersion()
                .then(
                    version => {


                        if (
                            event.ports &&
                            event.ports[0]
                        ) {


                            event.ports[0]
                                .postMessage({

                                    version:
                                        version

                                });

                        }

                    }
                );

        }

    }
);