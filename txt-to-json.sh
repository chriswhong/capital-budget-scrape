#!/bin/bash
mkdir -p ../data
for file in txt/*; do
  filename="${file%.*}"
  node capital-budget "$file"
  node geographic-analysis "$file"
  node rescindments "$file"
done
