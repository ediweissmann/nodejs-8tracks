#!/bin/bash

# Transforms m4a files to mp3 files
# Removes original m4a files
# requires 'brew install lame' and 'brew install mplayer'

set -e

[[ -n "$1" ]] || { echo "Usage: ./to-mp3.sh folder-with-m4a-files"; exit 0 ; }

echo "Processing .m4a files in folder: $1"
cd $1

for i in *.m4a
do
  name=`echo "$i" | sed -e 's/m4a/mp3/g'`
  echo "Processing: $name"
  mplayer -ao pcm:file="$i.wav" "$i"
  lame -h -b 192 "$i.wav" "$name"
  rm "$i.wav"
  rm "$i"
done

cd ..
