import { Text, VStack } from "@expo/ui/swift-ui";
import { createWidget, WidgetBase } from "expo-widgets";
import { padding } from "@expo/ui/swift-ui/modifiers";

type NextWidgetProps = {
  task: string | null;
  taskId: string | null;
  isUrgent: boolean;
  emoji: string;
  tasksJson: string;
  createdAt: number | null;
  phrase: string | null;
};

const NextWidget = (props: WidgetBase<NextWidgetProps>) => {
  "widget";
  const { task, emoji, isUrgent, family, phrase } = props ?? {};
  const displayTask =
    task && String(task).trim()
      ? String(task)
      : phrase && String(phrase).trim()
        ? String(phrase)
        : "What is the next action?";
  const displayEmoji = emoji ?? "🌱";

  if (family === "accessoryInline" || family === "accessoryRectangular") {
    return (
      <VStack modifiers={[padding({ all: 8 })]}>
        <Text>NEXT</Text>
        <Text>
          {displayEmoji} {displayTask}
        </Text>
      </VStack>
    );
  }

  if (family === "systemSmall") {
    return (
      <VStack modifiers={[padding({ all: 12 })]}>
        <Text>NEXT</Text>
        <Text>{displayEmoji}</Text>
        <Text>{displayTask}</Text>
        {isUrgent && <Text>URGENT</Text>}
      </VStack>
    );
  }

  return (
    <VStack modifiers={[padding({ all: 12 })]}>
      <Text>NEXT</Text>
      <Text>
        {displayEmoji} {displayTask}
      </Text>
      {isUrgent && <Text>URGENT</Text>}
    </VStack>
  );
};

const Widget = createWidget("NextWidget", NextWidget);
export default Widget;
