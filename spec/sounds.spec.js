import supertest from "supertest";
import mongoose, { trusted } from "mongoose";
import app from "../app.js";
import { cleanUpDatabase, generateValidJwt } from "./utils.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Sound from "../models/Sound.js";

beforeEach(cleanUpDatabase);

//GET SOUNDS TEST
describe("GET /sounds", () => {
  let Jules, Nature, City, Sound1, Sound2, Sound3;
  beforeEach(async () => {
    await User.deleteMany();
    await Sound.deleteMany();
    await Category.deleteMany();
    Jules = await User.create({
      username: "Jules",
      email: "jules@sandoz.com",
      clearPassword: "Test1234",
    });
    Nature = await Category.create({
      name: "Nature",
      color: "#000000",
    });
    City = await Category.create({
      name: "City",
      color: "#000001",
    });
    [Sound1, Sound2, Sound3] = await Promise.all([
      Sound.create({
        user: Jules._id,
        category: Nature._id,
        location: { type: "Point", coordinates: [6.64731, 46.78123] },
        date: new Date("2020-01-01"),
        sound:
          "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
      }),
      Sound.create({
        user: Jules._id,
        category: City._id,
        location: { type: "Point", coordinates: [6.64731, 46.78123] },
        sound:
          "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
      }),
      Sound.create({
        user: Jules._id,
        category: Nature._id,
        location: { type: "Point", coordinates: [6.64731, 46.78123] },
        sound:
          "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
      }),
    ]);
  });
  test("should get all sounds", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get("/sounds")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toHaveProperty("user");
    expect(res.body[0]).toHaveProperty("category");
    expect(res.body[0]).toHaveProperty("location");
    expect(res.body[0]).toHaveProperty("comments");
    expect(res.body[0].user.username).toEqual(Jules.username);
  });
  test("should get all sounds within a radius", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get('/sounds?location={"lat":46.78123,"lng":6.64731,"radius":10000}')
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(3);
  });
  test("should get all sounds posted by a user", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?username=${Jules.username}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(3);
    expect(res.body[0].user.username).toEqual(Jules.username);
  });
  test("should get all sounds posted in a category", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?category=${Nature._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(2);
    expect(res.body[0].category.name).toEqual(Nature.name);
  });
  test("should get all sounds posted by a user in a category", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
        .get(`/sounds?username=${Jules.username}&category=${Nature._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(2);
  });
  test("should not return any sounds if none are in radius", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get('/sounds?location={"lat":48.78123,"lng":1.64731,"radius":5000}')
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(0);
  });
  test("should not return any sounds if user is not found", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?username=NotJules`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404)
      .expect("Content-Type", /text/)
      .expect("User not found");
  });
  test("should not return any sounds if category is not found", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?category=NotNature`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404)
      .expect("Content-Type", /text/)
      .expect("Category not found");
  });
  test("should not return any sounds if date is not valid", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?date=NotADate`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .expect("Content-Type", /text/)
      .expect("Invalid date");
  });
  test("should return sounds that were posted after given date", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?date=2022-01-01`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(2);
  });
  test("should adapt limit if given limit is too small", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?limit=0`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(1);
  });
  test("should skip the amount of sounds given in the offset", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?offset=1`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeArray();
    expect(res.body).toHaveLength(2);
  });
  test("should return error if user is not found but category is valid", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds?username=NotJules&category=${Nature._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404)
      .expect("Content-Type", /text/)
      .expect("User not found");
  });
});
// GET SOUND BY ID TEST
describe("GET /sounds/:id", () => {
  let Jules, Sound1, Nature;
  beforeEach(async () => {
    await Sound.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    Jules = await User.create({
      username: "Jules",
      email: "jules@sandoz.com",
      clearPassword: "Test1234",
    });
    Nature = await Category.create({
      name: "Nature",
      color: "#00FF00",
    });
    Sound1 = await Sound.create({
      user: Jules._id,
      category: Nature._id,
      location: { type: "Point", coordinates: [6.64731, 46.78123] },
      date: new Date("2020-01-01"),
      sound:
        "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
    });
});
  test("should get sound by id", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .get(`/sounds/${Sound1._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);
    expect(res.body).toBeObject();
    expect(res.body._id).toEqual(Sound1._id.toString());
  });
  test("should return error if sound is not found", async () => {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
        .get(`/sounds/5f9e1b9e1b9e1b9e1b9e1b9e`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404)
        .expect("Content-Type", /text/)
        .expect("Sound not found");
  });
});

// GET SOUND DATA TEST
describe("GET /sounds/data/:id", () => {
    let Jules, Sound1, Nature;
    beforeEach(async () => {
        await Sound.deleteMany({});
        await User.deleteMany({});
        await Category.deleteMany({});
        Jules = await User.create({
            username: "Jules",
            email: "jules@sandoz.com",
            clearPassword: "Test1234",
        });
        Nature = await Category.create({
            name: "Nature",
            color: "#00FF00",
        });
        Sound1 = await Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: { type: "Point", coordinates: [6.64731, 46.78123] },
            date: new Date("2020-01-01"),
            sound: "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
        });
    });
    test("should get sound data by id", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .get(`/sounds/data/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200)
            .expect("Content-Type", /octet-stream/)
    });
    test("should return error if sound is not found", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .get(`/sounds/data/5f9e1b9e1b9e1b9e1b9e1b9e`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404)
            .expect("Content-Type", /text/)
            .expect("Sound not found");
    });
});

// PATCH SOUND TEST
describe("PATCH /sounds/:id", () => {
    let Jules, Stephane, Sound1, Nature, City;
    beforeEach(async () => {
        await Sound.deleteMany({});
        await User.deleteMany({});
        await Category.deleteMany({});
        Jules = await User.create({
          username: "Jules",
          email: "jules@sandoz.com",
          clearPassword: "Test1234",
        });
        Stephane = await User.create({
            username: "Stephane",
            email: "stephane@gmail.com",
            clearPassword: "Test1234"
        });
        Nature = await Category.create({
          name: "Nature",
          color: "#00FF00",
        });
        City = await Category.create({
            name: "City",
            color: "#FF0000",
            });
        Sound1 = await Sound.create({
          user: Jules._id,
          category: Nature._id,
          location: { type: "Point", coordinates: [6.64731, 46.78123] },
          date: new Date("2020-01-01"),
          sound:
            "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
        });
    });
    test("should update sound", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .patch(`/sounds/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                category: City.name,
            })
            .expect(200)
            .expect("Content-Type", /text/)
            .expect('Sound updated successfully');
        });
    test("should return error if sound is not found", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .patch(`/sounds/5f9e1b9e1b9e1b9e1b9e1b9e`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                category: City.name,
            })
            .expect(404)
            .expect("Content-Type", /text/)
            .expect("Sound not found");
    });
    test("should return error if category is not found", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .patch(`/sounds/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                category: "Animal",
            })
            .expect(404)
            .expect("Content-Type", /text/)
            .expect("Category not found");
    });
    test("should return error if user is not the owner of the sound and is not admin", async () => {
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
            .patch(`/sounds/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                category: City.name,
            })
            .expect(401)
            .expect("Content-Type", /text/)
            .expect("You are not authorized to update this sound");
        });
});

// DELETE SOUND TEST
describe("DELETE /sounds/:id", () => {
    let Jules, Stephane, Sound1, Nature;
    beforeEach(async () => {
        await Sound.deleteMany({});
        await User.deleteMany({});
        await Category.deleteMany({});
        Jules = await User.create({
            username: "Jules",
            email: "jules@sandoz.com",
            clearPassword: "Test1234",
        });
        Stephane = await User.create({
            username: "Stephane",
            email: "stephane@gmail.com",
            clearPassword: "Test1234"
        });
        Nature = await Category.create({
            name: "Nature",
            color: "#00FF00",
        });
        Sound1 = await Sound.create({
            user: Jules._id,
            category: Nature._id,
            location: { type: "Point", coordinates: [6.64731, 46.78123] },
            date: new Date("2020-01-01"),
            sound:
              "   ftypM4A     M4A isommp42   mdat      �< �@��=�M*+�BN/�e_���G���:�@���RhM�O�΁ Pj8�=���4�y�� 1{�1����^1��v�O������Ɲ���*eR����M$��eO�+��@��΂�|��Q�A�2sm",
          });
    });
    test("should delete sound", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .delete(`/sounds/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(204);
        });
    test("should return error if sound is not found", async () => {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
            .delete(`/sounds/5f9e1b9e1b9e1b9e1b9e1b9e`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404)
            .expect("Content-Type", /text/)
            .expect("Sound not found");
    });
    test("should return error if user is not the owner of the sound and is not admin", async () => {
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
            .delete(`/sounds/${Sound1._id}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(401)
            .expect("Content-Type", /text/)
            .expect("You are not authorized to delete this sound");
        });
});

// NEEDS TO GET FIXED

// POST SOUND TEST
// describe("POST /sounds", () => {
//     let Jules, Nature;
//     beforeEach(async () => {
//         await Sound.deleteMany({});
//         await User.deleteMany({});
//         await Category.deleteMany({});
//         Jules = await User.create({
//             username: "Jules",
//             email: "jules@sandoz.com",
//             clearPassword: "Test1234",
//         });
//         Nature = await Category.create({
//             name: "Nature",
//             color: "#00FF00",
//         });
//     });
//     test("should create sound", async () => {
//         const token = await generateValidJwt(Jules);
//         const res = await supertest(app)
//             .post(`/sounds`)
//             .set("Authorization", `Bearer ${token}`)
//             .field("category", Nature.name)
//             .field("location", JSON.stringify({"lat":48.78123,"lng":1.64731}))
//             .field("uploaded_audio", JSON.stringify({
//                 "fieldname": 'uploaded_audio',
//                 "originalname": 'Avenue des Sports 20.m4a',
//                 "encoding": '7bit',
//                 "mimetype": 'audio/mp4',
//                 "buffer": "<Buffer 00 00 00 1c 66 74 79 70 4d 34 41 20 00 00 00 00 4d 34 41 20 69 73 6f 6d 6d 70 34 32 00 00 00 01 6d 64 61 74 00 00 00 00 00 00 9f 3c 00 d0 40 07 01 02>",
//                 "size": 42809
//               }))
//             .expect(201)
//             .expect("Content-Type", /text/)
//             .expect('Sound saved successfully');
//         });
//     test("should return error if category is not found", async () => {
//         const token = await generateValidJwt(Jules);
//         const res = await supertest(app)
//             .post(`/sounds`)
//             .set("Authorization", `Bearer ${token}`)
//             .field("category", "Animal")
//             .field("location", JSON.stringify({"lat":48.78123,"lng":1.64731}))
//             .field("uploaded_audio", JSON.stringify({
//                 "fieldname": 'uploaded_audio',
//                 "originalname": 'Avenue des Sports 20.m4a',
//                 "encoding": '7bit',
//                 "mimetype": 'audio/mp4',
//                 "buffer": "<Buffer 00 00 00 1c 66 74 79 70 4d 34 41 20 00 00 00 00 4d 34 41 20 69 73 6f 6d 6d 70 34 32 00 00 00 01 6d 64 61 74 00 00 00 00 00 00 9f 3c 00 d0 40 07 01 02>",
//                 "size": 42809
//               }))
//             .expect(404)
//             .expect("Content-Type", /text/)
//             .expect("Category not found");
//     });

// });



afterAll(async () => {
  await mongoose.disconnect();
});
