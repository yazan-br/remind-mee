import { registerRootComponent } from "expo";

import App from "./App";
import { unregisterLocationReminderTask } from "./src/services/locationReminder";
unregisterLocationReminderTask();
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
