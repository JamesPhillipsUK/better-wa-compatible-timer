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
        <form method="post" action="index.php">
            <input
                type="hidden"
                name="timing_start_token"
                value="<?php echo htmlspecialchars(
                    $_SESSION['timing_start_token'],
                    ENT_QUOTES,
                    'UTF-8'
                ); ?>">

            <button
                type="submit"
                style="background:#440046; color:white; border:0;
                       border-radius:6px; padding:12px 18px;
                       font-size:16px; cursor:pointer;">
                Start Everything
            </button>
        </form>

        <?php if ($startupMessage !== ''): ?>
            <p role="status">
                <?php echo htmlspecialchars(
                    $startupMessage,
                    ENT_QUOTES,
                    'UTF-8'
                ); ?>
            </p>
        <?php endif; ?>
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