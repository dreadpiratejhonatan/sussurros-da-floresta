<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$file = __DIR__ . '/../data/tickets.json';
if (!file_exists($file)) {
  if (!is_dir(dirname($file))) mkdir(dirname($file), 0755, true);
  file_put_contents($file, json_encode(['tickets' => []], JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $data = json_decode(file_get_contents($file), true) ?: ['tickets' => []];
  echo json_encode(['count' => count($data['tickets'])]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?: [];
  $data = json_decode(file_get_contents($file), true) ?: ['tickets' => []];
  $data['tickets'][] = [
    'text' => substr((string)($body['text'] ?? ''), 0, 2000),
    'at' => gmdate('c'),
  ];
  file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  echo json_encode(['ok' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method']);
