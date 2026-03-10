import { expect, test, describe, beforeEach } from "vitest";
import { useAuthStore } from "./store/authStore";

describe("CI Frontend Core State", () => {
  beforeEach(() => {
    useAuthStore.getState().setUnauthenticated();
  });

  test("Initial store state should be unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.view).toBe("auth");
  });

  test("setAuthenticated should update state and switch view to dashboard", () => {
    const mockUser = {
      id: "123",
      username: "testuser",
      global_name: "Test User",
      avatar: null,
      discriminator: "0",
    };
    useAuthStore.getState().setAuthenticated(mockUser);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.view).toBe("dashboard");
  });
});
