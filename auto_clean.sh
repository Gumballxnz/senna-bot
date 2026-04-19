#!/bin/bash
CACHE_DIR="/home/ubuntu/.cache"
SIZE=$(du -sm $CACHE_DIR 2>/dev/null | cut -f1)
if [ ! -z "$SIZE" ] && [ "$SIZE" -gt 1024 ]; then
  npm cache clean --force
  rm -rf /home/ubuntu/.cache/*
  echo "Cache cleaned on $(date)" >> /home/ubuntu/cache_clean.log
fi
