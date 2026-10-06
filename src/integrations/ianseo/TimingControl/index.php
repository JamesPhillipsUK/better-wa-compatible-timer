<?php
require_once(dirname(__DIR__, 3) . '/config.php');
require_once('Common/Fun_FormatText.inc.php');

$PAGE_TITLE = 'Timing Control Hub';

include('Common/Templates/head.php');
?>

<style>
    #timing-control-module {
        margin: 16px auto;
        width: 98%;
    }

    #timing-control-module .timing-heading {
        background: #440046;
        color: white;
        padding: 16px 20px;
        border-radius: 8px 8px 0 0;
    }

    #timing-control-module h1 {
        color: white;
        margin: 0;
        font-size: 24px;
    }

    #timing-control-module .timing-help {
        padding: 12px 20px;
        background: #f2f3f5;
        color: #222;
        line-height: 1.5;
    }

    #timing-control-module a {
        color: #440046;
        text-decoration: underline;
    }

    #timing-control-frame {
        display: block;
        width: 100%;
        height: 1150px;
        border: 1px solid #ddd;
        background: #eef0f4;
    }

    @media (max-width: 1000px) {
        #timing-control-frame {
            height: 1900px;
        }
    }

    #timing-control-frame[hidden] {
        display: none;
    }
</style>

<div id="timing-control-module">
    <div class="timing-heading">
        <h1>Timing Control Hub</h1>
    </div>

    <div class="timing-help">
        <p>
            <a id="timing-control-link"
               target="_blank"
               rel="noopener"
               hidden>Open controls in a separate tab ↗</a>
        </p>
        <p id="timing-control-help">
            The timing display server must be running on this
            IANSEO computer. If the controls below cannot load,
            start it using the usual launcher, then refresh this page.
        </p>
    </div>

    <iframe
        id="timing-control-frame"
        title="Timing display controls"
        hidden>
    </iframe>

    <noscript>
        Please enable JavaScript to load the timing controls.
    </noscript>
</div>

<script>
(function () {
    const frame = document.getElementById("timing-control-frame");
    const link = document.getElementById("timing-control-link");
    const help = document.getElementById("timing-control-help");

    const hubUrl = new URL("http://localhost:5500/control-hub.html");
    hubUrl.hostname = window.location.hostname;

    const statusUrl = new URL("status.php", window.location.href);
    const usesHttps = window.location.protocol === "https:";
    let frameLoaded = false;

    link.href = hubUrl.href;
    link.hidden = true;

    help.setAttribute("role", "status");
    help.setAttribute("aria-live", "polite");

    function showStatus(message) {
        if (help.textContent !== message) {
            help.textContent = message;
        }
    }

    function unloadControls() {
        frame.hidden = true;
        link.hidden = true;

        if (frameLoaded) {
            frame.src = "about:blank";
            frameLoaded = false;
        }
    }

    async function checkServer() {
        const controller = new AbortController();
        const timeout = setTimeout(function () {
            controller.abort();
        }, 5000);

        try {
            const response = await fetch(statusUrl, {
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("Status request failed.");
            }

            const status = await response.json();

            if (typeof status.displayServerReachable !== "boolean") {
                throw new Error("Invalid status response.");
            }

            if (!status.displayServerReachable) {
                unloadControls();
                showStatus(
                    "Display server is not responding. Start it using " +
                    "the usual launcher; this page will reconnect automatically."
                );
                return;
            }

            link.hidden = false;

            if (usesHttps) {
                showStatus(
                    "Display server is responding. Use the separate-tab " +
                    "link to open its HTTP controls from this HTTPS page."
                );
                return;
            }

            showStatus(
                "Display server is responding. " +
                "This does not confirm that WA timing data is arriving."
            );

            if (!frameLoaded) {
                frame.src = hubUrl.href;
                frameLoaded = true;
            }

            frame.hidden = false;

        } catch (error) {
            showStatus(
                "Unable to check server status. " +
                "Check your connection to IANSEO; retrying automatically."
            );
            console.warn("Timing server status check failed:", error);
        } finally {
            clearTimeout(timeout);
            setTimeout(checkServer, 3000);
        }
    }

    showStatus("Checking display server…");
    checkServer();
})();
</script>

<?php
include('Common/Templates/tail.php');