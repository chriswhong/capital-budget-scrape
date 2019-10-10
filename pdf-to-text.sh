#!/bin/bash
mkdir -p txt
for file in pdf/*; do
  filename=$(basename "${file%.*}")
  echo "$filename"
  pdftotext -x 35 -y 20 -W 538 -H 1000 -fixed 4.08 -layout "$file" txt/$filename.txt
done
