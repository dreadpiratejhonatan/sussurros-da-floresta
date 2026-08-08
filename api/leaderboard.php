<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$file = __DIR__ . '/../data/leaderboard.json';
if (!file_exists($file)) {
  if (!is_dir(dirname($file))) mkdir(dirname($file), 0755, true);
  file_put_contents($file, json_encode(['entries' => []], JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  readfile($file);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $body = json_decode(file_get_contents('php://input'), true) ?: [];
  $data = json_decode(file_get_contents($file), true) ?: ['entries' => []];
  $name = substr(preg_replace('/[^\w\s\-À-ÿ]/u', '', (string)($body['name'] ?? 'Anon')), 0, 24);
  $time = (int)($body['timeSec'] ?? 0);
  if ($time > 0) {
    $data['entries'][] = [
      'name' => $name ?: 'Anon',
      'timeSec' => $time,
      'at' => gmdate('c'),
    ];
    usort($data['entries'], function ($a, $b) {
      return $a['timeSec'] <=> $b['timeSec'];
    });
    $data['entries'] = array_slice($data['entries'], 0, 50);
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
  }
  echo json_encode(['ok' => true, 'entries' => $data['entries']]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'method']);
