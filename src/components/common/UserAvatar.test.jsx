import { fireEvent, render, screen } from "@testing-library/react";
import UserAvatar from "./UserAvatar";
test("broken avatar falls back to initial and retries when the revision changes", () => {
  const user = { name: "Alex", avatarUrl: "/api/account/avatar/11111111-1111-4111-8111-111111111111" };
  const view = render(<UserAvatar user={user} label="Avatar" />); fireEvent.error(screen.getByRole("img", { name: "Avatar" }).querySelector("img")); expect(screen.getByRole("img", { name: "Avatar" })).toHaveTextContent("A");
  view.rerender(<UserAvatar user={{ ...user, avatarUrl: "/api/account/avatar/22222222-2222-4222-8222-222222222222" }} label="Avatar" />); expect(screen.getByRole("img", { name: "Avatar" }).querySelector("img")).not.toBeNull();
});
