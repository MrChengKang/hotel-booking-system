import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FavoritesProvider, useFavorites } from "./FavoritesContext";
import { useAuth } from "./AuthContext";
import * as api from "../services/accountApi";
jest.mock("./AuthContext"); jest.mock("../services/accountApi");
const saved = { hotelId: 7, hotel: { id: 7, name: "Private favorite" } };
function View() { const favorites = useFavorites(); return <><p>{favorites.ready ? "Ready" : "Loading"}</p><p>{favorites.items.map(item => item.hotel?.name).join(",") || "No favorites"}</p><button onClick={() => favorites.setSaved(7, true)}>Save</button></>; }
test("switching accounts immediately hides old favorites and ignores late mutations", async () => {
  let user = { id: 1 }, finish;
  useAuth.mockImplementation(() => ({ user })); api.getFavorites.mockResolvedValue([]); api.saveFavorite.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<FavoritesProvider><View /></FavoritesProvider>); await screen.findByText("Ready"); fireEvent.click(screen.getByText("Save"));
  user = { id: 2 }; view.rerender(<FavoritesProvider><View /></FavoritesProvider>);
  await waitFor(() => expect(api.getFavorites).toHaveBeenCalledTimes(2));
  await act(async () => { finish(saved); }); expect(screen.queryByText("Private favorite")).not.toBeInTheDocument(); expect(screen.getByText("No favorites")).toBeInTheDocument();
  user = null; view.rerender(<FavoritesProvider><View /></FavoritesProvider>); expect(screen.getByText("No favorites")).toBeInTheDocument();
});
test("restored favorites clear immediately on logout", async () => {
  let user = { id: 1 }; useAuth.mockImplementation(() => ({ user })); api.getFavorites.mockResolvedValue([saved]);
  const view = render(<FavoritesProvider><View /></FavoritesProvider>); await screen.findByText("Private favorite");
  user = null; view.rerender(<FavoritesProvider><View /></FavoritesProvider>); expect(screen.queryByText("Private favorite")).not.toBeInTheDocument();
});
