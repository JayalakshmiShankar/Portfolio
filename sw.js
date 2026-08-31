const CACHE_NAME = "jaya-portfolio-v1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/sw.js"
];


/* ================================
   INSTALL
================================ */

self.addEventListener("install", event => {

    console.log("Service Worker: Installing...");

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log("Caching portfolio files...");

                return cache.addAll(FILES_TO_CACHE);

            })

    );

    self.skipWaiting();

});


/* ================================
   ACTIVATE
================================ */

self.addEventListener("activate", event => {

    console.log("Service Worker: Activated");

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(name =>
                            name !== CACHE_NAME
                        )
                        .map(name =>
                            caches.delete(name)
                        )

                );

            })

    );

    self.clients.claim();

});


/* ================================
   FETCH
================================ */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                /*

                   CACHE FIRST

                   If file exists in cache:
                   return cached file.

                */

                if (cachedResponse) {

                    console.log(
                        "Loaded from cache:",
                        event.request.url
                    );

                    return cachedResponse;

                }


                /*
                   Otherwise try internet
                */

                return fetch(event.request)

                    .then(networkResponse => {

                        /*
                           Save the new resource
                           into cache.
                        */

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                        return networkResponse;

                    })

                    .catch(() => {

                        /*
                           Offline fallback
                        */

                        if (
                            event.request.mode === "navigate"
                        ) {

                            return caches.match(
                                "/index.html"
                            );

                        }

                    });

            })

    );

});