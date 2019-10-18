#!/bin/bash
mkdir -p txt
for file in pdf/*; do
  filename=$(basename "${file%.*}")
  echo "$filename"
  pdftotext -fixed 4.08 -layout "$file" txt/$filename.txt
done
