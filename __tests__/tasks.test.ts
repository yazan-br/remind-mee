import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addTask,
  completeTask,
  getAllTasks,
  getNextTask,
  snoozeTask,
} from "../src/services/tasks";

beforeEach(async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue("[]");
  (AsyncStorage.setItem as jest.Mock).mockClear();
});

describe("tasks", () => {
  it("addTask creates task and saves", async () => {
    await addTask("Buy milk");
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
    const json = JSON.parse(calls[0][1]);
    expect(json).toHaveLength(1);
    expect(json[0].instruction).toBe("Buy milk");
    expect(json[0].status).toBe("pending");
  });

  it("completeTask marks task done", async () => {
    const tasks = [
      {
        id: "1",
        instruction: "Task 1",
        status: "pending",
        snoozedUntil: null,
        createdAt: Date.now(),
        completedAt: null,
        urgent: false,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(tasks),
    );
    await completeTask("1");
    const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
    const json = JSON.parse(calls[0][1]);
    expect(json[0].status).toBe("completed");
    expect(json[0].completedAt).toBeDefined();
  });

  it("getNextTask returns first pending", async () => {
    const tasks = [
      {
        id: "1",
        instruction: "First",
        status: "pending",
        snoozedUntil: null,
        createdAt: 1,
        completedAt: null,
        urgent: false,
      },
      {
        id: "2",
        instruction: "Second",
        status: "pending",
        snoozedUntil: null,
        createdAt: 2,
        completedAt: null,
        urgent: false,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(tasks),
    );
    const next = await getNextTask();
    expect(next?.instruction).toBe("First");
  });
});
