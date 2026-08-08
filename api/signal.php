<?php
// Solo v0 — stub for future optional co-op signaling (same HostGator layout as snow).
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
echo json_encode(['ok' => true, 'mode' => 'solo', 'message' => 'co-op not enabled in v0']);
