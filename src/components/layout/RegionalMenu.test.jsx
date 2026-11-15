import { fireEvent, render, screen } from "@testing-library/react";
import RegionalMenu from "./RegionalMenu";
import { PreferencesProvider, usePreferences } from "../../context/PreferencesContext";

function PreferencePreview() {
  const { formatPrice, formatDate } = usePreferences();
  return <><span aria-label="Example price">{formatPrice(250)}</span><span aria-label="Example date">{formatDate("2026-11-06")}</span></>;
}

function renderMenu() {
  return render(<PreferencesProvider><RegionalMenu /><PreferencePreview /></PreferencesProvider>);
}

afterEach(() => localStorage.removeItem("stay-preferences"));

test("shows the six language options and remembers the selected language", () => {
  const view = renderMenu();
  fireEvent.click(screen.getByRole("button", { name: "Language and currency", exact: true }));
  expect(screen.getByRole("tab", { name: "Language" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("group", { name: "Languages" }).children).toHaveLength(6);
  expect(screen.getByRole("button", { name: "English United States" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Français France" }));
  expect(screen.getByRole("button", { name: "Français France" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("Example date")).toHaveTextContent("nov.");
  view.unmount();
  renderMenu();
  fireEvent.click(screen.getByRole("button", { name: "Langue et devise", exact: true }));
  expect(screen.getByRole("button", { name: "Français France" })).toHaveAttribute("aria-pressed", "true");
});

test("switches currency and updates the visible price and trigger", () => {
  renderMenu();
  const trigger = screen.getByRole("button", { name: "Language and currency", exact: true });
  expect(screen.getByLabelText("Example price")).toHaveTextContent("$250");
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("tab", { name: "Currency" }));
  fireEvent.click(screen.getByRole("button", { name: "EUR Euro" }));
  expect(trigger).toHaveTextContent("EUR");
  expect(screen.getByLabelText("Example price")).toHaveTextContent("€230");
  expect(screen.getByRole("button", { name: "EUR Euro" })).toHaveAttribute("aria-pressed", "true");
  expect(JSON.parse(localStorage.getItem("stay-preferences")).currency).toBe("EUR");
});

test("supports tab arrow navigation, Escape, and outside-click dismissal", () => {
  renderMenu();
  const trigger = screen.getByRole("button", { name: "Language and currency", exact: true });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  const languageTab = screen.getByRole("tab", { name: "Language" });
  expect(languageTab).toHaveFocus();
  fireEvent.keyDown(languageTab, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Currency" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "Currency" })).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("falls back safely when saved settings are invalid", () => {
  localStorage.setItem("stay-preferences", JSON.stringify({ language: "invalid", currency: "invalid" }));
  renderMenu();
  expect(screen.getByLabelText("Example price")).toHaveTextContent("$250");
  expect(screen.getByLabelText("Example date")).toHaveTextContent("Nov 06");
});
