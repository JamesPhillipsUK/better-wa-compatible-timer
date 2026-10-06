<?php

if (!isset($ret['TIMING_CONTROL'])) {
    $ret['TIMING_CONTROL'][] = 'Timing Control';
}

$ret['TIMING_CONTROL'][] =
    'Control hub|' .
    $CFG->ROOT_DIR .
    'Modules/Custom/TimingControl/';