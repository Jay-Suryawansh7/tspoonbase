#!/bin/bash
cd /Users/jay/Downloads/pocketbase-ts
rm -f pb_data/data.db
mkdir -p pb_data
nohup node dist/cli.js serve --dev > /tmp/tspoonbase.log 2>&1 &
sleep 6
echo "=== Server Log ===" 
head -8 /tmp/tspoonbase.log
echo ""
echo "=== Health Check ==="
curl -s http://localhost:8090/api/health