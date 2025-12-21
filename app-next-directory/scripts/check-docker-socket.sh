#!/usr/bin/env bash
# check-docker-socket.sh
# Quick diagnostics for Docker + socket paths inside WSL

echo "== docker context =="
docker context ls || true

echo "\n== DOCKER_HOST env =="
echo "DOCKER_HOST=$DOCKER_HOST"

echo "\n== socket files =="
ls -l /var/run/docker.sock /run/desktop/docker.sock /run/docker.sock /run/user/1000/docker.sock 2>/dev/null || true

echo "\n== try explicit desktop socket =="
DOCKER_HOST=unix:///var/run/docker.sock docker info || true

echo "\n== try desktop socket alternative =="
DOCKER_HOST=unix:///run/desktop/docker.sock docker info || true
