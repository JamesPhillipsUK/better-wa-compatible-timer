<?php
require_once(dirname(__DIR__, 3) . '/config.php');
require_once('Common/Fun_FormatText.inc.php');

// Keep a session token for startup requests.
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (empty($_SESSION['timing_start_token'])) {
    $_SESSION['timing_start_token'] = bin2hex(random_bytes(32));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['timing_start_token'] ?? '';

    if (!is_string($token) ||
        !hash_equals($_SESSION['timing_start_token'], $token)) {
        http_response_code(403);
        exit('Invalid startup request. Refresh the control page and try again.');
    }

    // Check whether the display server already responds.
    $context = stream_context_create(array(
        'http' => array(
            'timeout' => 2,
            'follow_location' => 0,
            'header' => "Accept: application/json\r\nConnection: close\r\n"
        )
    ));

    $response = @file_get_contents(
        'http://127.0.0.1:5500/api/display-settings',
        false,
        $context,
        0,
        4096
    );

    $settings = $response !== false
        ? json_decode($response, true)
        : null;

    $alreadyRunning =
        is_array($settings) &&
        isset($settings['twoDetailStyle']) &&
        in_array(
            $settings['twoDetailStyle'],
            array('ABCD', 'ABCDEF'),
            true
        );

    if ($alreadyRunning) {
        $resultMessage =
            'The display server is already responding. No startup requested.';
    } elseif (!function_exists('exec')) {
        $resultMessage =
            'Startup is unavailable: PHP command execution is disabled.';
    } else {
        $windowsDirectory = getenv('SystemRoot') ?: 'C:\\Windows';
        $taskCommand = $windowsDirectory . '\\System32\\schtasks.exe';

        if (!is_file($taskCommand)) {
            $resultMessage = 'Could not locate Windows Task Scheduler command.';
        } else {
            // The task name is fixed to a windows service (I know, yuck)
            $command = escapeshellarg($taskCommand)
                . ' /Run /TN "NEUAL-Timing-Start" 2>&1';

            $output = array();
            $exitCode = 1;

            exec($command, $output, $exitCode);

            if ($exitCode === 0) {
                $resultMessage =
                    'Startup requested. The controls will appear when the '
                    . 'display server responds. If it remains offline, check '
                    . 'Task Scheduler and that its Windows user is logged in.';
            } else {
                $resultMessage =
                    'Windows could not start the task: '
                    . implode(' ', $output);
            }
        }
    }

    $_SESSION['timing_start_result'] = $resultMessage;

    // Redirect so refreshing the page doesn't repeat the startup request.
    header('Location: index.php', true, 303);
    exit;
}

$startupMessage = $_SESSION['timing_start_result'] ?? '';
unset($_SESSION['timing_start_result']);

$PAGE_TITLE = 'Timing Control Hub';
include('Common/Templates/head.php');
?>

<style>
    #timing-control-module {
        width: 96%;
        max-width: 1500px;
        margin: 10px auto;
        color: #252025;
        font: 13px Arial, sans-serif;
    }

    #timing-control-module * {
        box-sizing: border-box;
    }

    #timing-control-module h1 {
        margin: 0;
        padding: 8px 12px;
        background: #440046;
        color: white;
        font-size: 16px;
        text-align: center;
    }

    #timing-control-module .timing-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 14px;
        padding: 8px 10px;
        background: #fcfcfe;
        border-bottom: 1px solid #cfc4d1;
    }

    #timing-start-form {
        margin: 0;
    }

    #timing-start-button {
        padding: 4px 10px;
        min-height: 28px;
        background: #440046;
        color: white;
        border: 1px solid #440046;
        border-radius: 2px;
        font: inherit;
        cursor: pointer;
    }

    #timing-start-button:disabled {
        opacity: 0.55;
        cursor: default;
    }

    #timing-control-help {
        flex: 1;
        margin: 0;
        min-width: 180px;
    }

    #timing-display-link,
    #timing-wa-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 4px 10px;
        background: #440046;
        color: white;
        border: 1px solid #440046;
        border-radius: 2px;
        font: inherit;
        text-decoration: none;
        white-space: nowrap;
    }

    #timing-display-link:hover,
    #timing-wa-link:hover {
        background: #602262;
    }

    #timing-display-link:focus-visible,
    #timing-wa-link:focus-visible {
        outline: 2px solid #804583;
        outline-offset: 2px;
    }

    #timing-start-result {
        margin: 0;
        padding: 8px 10px;
        background: #fff4d2;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    #timing-control-frame {
        display: block;
        width: 100%;
        height: 420px;
        border: 0;
        background: transparent;
    }

    #timing-control-module [hidden] {
        display: none !important;
    }

    @media (max-width: 550px) {
        #timing-control-module {
            width: 100%;
        }
    }
</style>

<div id="timing-control-module">
    <h1>Timing Control</h1>

    <div class="timing-toolbar">
        <form id="timing-start-form" method="post" action="index.php">
            <input
                type="hidden"
                name="timing_start_token"
                value="<?php echo htmlspecialchars(
                    $_SESSION['timing_start_token'],
                    ENT_QUOTES,
                    'UTF-8'
                ); ?>">

            <button id="timing-start-button" type="submit" disabled>
                Start Everything
            </button>
        </form>

        <p id="timing-control-help"
           role="status"
           aria-live="polite">
            Checking display server…
        </p>

        <a id="timing-display-link"
           target="_blank"
           rel="noopener"
           hidden>Open display ↗</a>

        <a id="timing-wa-link"
           target="_blank"
           rel="noopener">Open WA controls ↗</a>
    </div>

    <?php if ($startupMessage !== ''): ?>
        <p id="timing-start-result" role="status">
            <?php echo htmlspecialchars(
                $startupMessage,
                ENT_QUOTES,
                'UTF-8'
            ); ?>
        </p>
    <?php endif; ?>

    <iframe
        id="timing-control-frame"
        title="Timing display controls"
        hidden>
    </iframe>

    <noscript>
        Please enable JavaScript to use the timing controls.
    </noscript>
</div>

<script>
(function () {
    const frame = document.getElementById("timing-control-frame");
    const displayLink = document.getElementById("timing-display-link");
    const help = document.getElementById("timing-control-help");
    const startButton = document.getElementById("timing-start-button");
    const startForm = document.getElementById("timing-start-form");
    const startResult = document.getElementById("timing-start-result");

    const hubUrl = new URL("http://localhost:5500/control-hub.html");
    hubUrl.hostname = window.location.hostname;

    const displayUrl = new URL("/led-display/led-display.html", hubUrl);
    displayLink.href = displayUrl.href;
    const waControlUrl = new URL("http://localhost:5000/");
    waControlUrl.hostname = window.location.hostname;
    document.getElementById("timing-wa-link").href = waControlUrl.href;

    // The embedded version uses IANSEO's heading instead.
    hubUrl.searchParams.set("embedded", "1");

    const statusUrl = new URL("status.php", window.location.href);
    const usesHttps = window.location.protocol === "https:";
    let frameLoaded = false;
    let submitting = false;

    function showStatus(message) {
        if (help.textContent !== message) {
            help.textContent = message;
        }
    }

    window.addEventListener("message", function (event) {
        if (event.origin !== hubUrl.origin ||
            event.source !== frame.contentWindow) {
            return;
        }

        const data = event.data;

        if (!data || data.type !== "timing-hub-height" ||
            typeof data.height !== "number" ||
            !Number.isFinite(data.height) ||
            data.height < 100 || data.height > 10000) {
            return;
        }

        frame.style.height = Math.ceil(data.height) + "px";
    });

    function unloadControls() {
        frame.hidden = true;
        displayLink.hidden = true;

        if (frameLoaded) {
            frame.src = "about:blank";
            frameLoaded = false;
        }
    }

    startForm.addEventListener("submit", function () {
        submitting = true;
        startButton.disabled = true;
        showStatus("Requesting startup…");
    });

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

            if (submitting) return;

            if (!status.displayServerReachable) {
                unloadControls();
                startButton.disabled = false;
                showStatus("Display server: not responding.");
                help.title =
                    "Start the server or check its console. " +
                    "This page reconnects automatically.";
                return;
            }

            startButton.disabled = true;
            displayLink.hidden = false;

            if (startResult) {
                startResult.hidden = true;
            }

            help.title =
                "The display server answers requests. " +
                "This does not verify the WA timing feed.";

            if (usesHttps) {
                showStatus(
                    "Display server: responding. Embedded HTTP controls require opening IANSEO over HTTP."
                );
                return;
            }

            showStatus("Display server: responding.");

            if (!frameLoaded) {
                frame.src = hubUrl.href;
                frameLoaded = true;
            }

            frame.hidden = false;

        } catch (error) {
            if (!submitting) {
                startButton.disabled = true;
                showStatus("Server status unknown — retrying…");
                help.title = "Check your connection to IANSEO.";
            }
            console.warn("Timing server status check failed:", error);
        } finally {
            clearTimeout(timeout);
            setTimeout(checkServer, 3000);
        }
    }

    checkServer();
})();
</script>

<?php
include('Common/Templates/tail.php');