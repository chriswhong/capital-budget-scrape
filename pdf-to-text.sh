#!/bin/bash
cd $1
mkdir -p ../txt
for file in *; do
  filename="${file%.*}"
  pdftotext -x 35 -y 20 -W 538 -H 1000 -fixed 4.08 -layout $file ../txt/$filename.txt
done
