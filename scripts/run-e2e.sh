#!/bin/bash
set -e
cd "$(dirname "$0")/.."
export PATH="$PATH:$HOME/.maestro/bin"
adb shell am force-stop com.anonymous.remindme
adb shell am start -n com.anonymous.remindme/.MainActivity
sleep 4
maestro test .maestro/add-task-no-launch.yaml
adb shell am force-stop com.anonymous.remindme
sleep 2
adb shell am start -n com.anonymous.remindme/.MainActivity
sleep 4
maestro test .maestro/complete-task.yaml
adb shell am force-stop com.anonymous.remindme
sleep 2
adb shell am start -n com.anonymous.remindme/.MainActivity
sleep 4
maestro test .maestro/map-select-location.yaml
adb shell am force-stop com.anonymous.remindme
sleep 2
adb shell am start -n com.anonymous.remindme/.MainActivity
sleep 4
maestro test .maestro/task-with-location.yaml
echo "All E2E flows passed"
