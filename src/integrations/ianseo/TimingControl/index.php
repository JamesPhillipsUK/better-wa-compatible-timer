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
        title="Timing display controls">
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

    link.href = hubUrl.href;
    link.hidden = false;

    if (window.location.protocol === "https:") {
        frame.hidden = true;
        help.textContent =
            "This IANSEO page uses HTTPS. Use the separate-tab link " +
            "to open the HTTP timing controls.";
        return;
    }

    frame.src = hubUrl.href;
})();
</script>

<?php
include('Common/Templates/tail.php');