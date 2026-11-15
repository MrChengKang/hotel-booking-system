import { apiBaseUrl } from "./apiClient";

test("production defaults to the same-origin API rather than the developer's computer",()=>{
  expect(apiBaseUrl(undefined,"production")).toBe("/api");
  expect(apiBaseUrl(" ","production")).toBe("/api");
});
test("development keeps its existing backend and explicit deployment URLs remain supported",()=>{
  expect(apiBaseUrl(undefined,"development")).toBe("http://localhost:8080/api");
  expect(apiBaseUrl(" https://api.stay.example/api/ ","production")).toBe("https://api.stay.example/api");
  expect(apiBaseUrl("/api/","production")).toBe("/api");
});
