<?php
require_once(dirname(__DIR__, 3) . '/config.php');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Release the session lock so this check does not hold up other pages.
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

$context = stream_context_create(array(
    'http' => array(
        'method' => 'GET',
        'timeout' => 2,
        'ignore_errors' => true,
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

$statusLine = $http_response_header[0] ?? '';
$httpOk = preg_match('/^HTTP\/\S+\s+200\b/', $statusLine) === 1;

$reachable =
    $httpOk &&
    is_array($settings) &&
    isset($settings['twoDetailStyle']) &&
    in_array(
        $settings['twoDetailStyle'],
        array('ABCD', 'ABCDEF'),
        true
    );

echo json_encode(array(
    'displayServerReachable' => $reachable
));