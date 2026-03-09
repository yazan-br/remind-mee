#!/bin/bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

if ! adb devices 2>/dev/null | grep -q emulator; then
  emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &
  echo "Starting emulator (wait ~30s)..."
  for i in $(seq 1 45); do
    sleep 2
    if adb devices 2>/dev/null | grep -q emulator; then
      adb wait-for-device
      sleep 5
      echo "Emulator ready."
      break
    fi
  done
fi

cd "$(dirname "$0")/.." && npx expo run:android
