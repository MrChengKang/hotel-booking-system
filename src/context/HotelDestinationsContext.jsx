import { createContext, useContext } from "react";
import useResource from "../hooks/useResource";
import { getHotelDestinations } from "../services/hotelApi";

const HotelDestinationsContext = createContext(null);

export function HotelDestinationsProvider({ children }) {
  const resource = useResource("hotel-destinations", getHotelDestinations);
  return <HotelDestinationsContext.Provider value={resource}>{children}</HotelDestinationsContext.Provider>;
}

export function useHotelDestinations() {
  const shared = useContext(HotelDestinationsContext);
  const own = useResource(shared ? null : "hotel-destinations", getHotelDestinations);
  return shared || own;
}
