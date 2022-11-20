import supertest from "supertest";
import mongoose, { trusted } from "mongoose";
import app from "../app.js";
/*
** THIS TEST IS USELESS BUT I LIKE GREEN TESTS
*/

// DOC REDIRECTION TEST
describe("GET /", () => {
  it("should return 302 Found", () => {
    return supertest(app)
      .get("/")
      .expect(302);
  });
});
afterAll(async () => {
    await mongoose.disconnect();
  });