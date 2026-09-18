const listeners = new Set();

function addSubscriber(res) {
  try {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*'
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
  } catch {}
  listeners.add(res);
  const cleanup = () => listeners.delete(res);
  res.on('close', cleanup);
  res.on('error', cleanup);
}

function broadcast(chunk) {
  if (!chunk) return;
  for (const res of [...listeners]) {
    try {
      if (res.destroyed || res.writableEnded) {
        listeners.delete(res);
        continue;
      }
      res.write(chunk);
    } catch {
      listeners.delete(res);
      try { res.end(); } catch {}
    }
  }
}

function closeAll() {
  for (const res of [...listeners]) {
    try { res.end(); } catch {}
    listeners.delete(res);
  }
}

module.exports = { addSubscriber, broadcast, closeAll, size: () => listeners.size };
