import supertest from "supertest"
import mongoose, { trusted } from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"

 beforeEach(cleanUpDatabase);

 // GET USERS ROUTE OPTIONS TEST
describe('OPTIONS /users', function() {
  test("should return a list of options", async function() {
    const res = await supertest(app)
      .options('/users')
      .expect(204)
      .expect('Allow', 'GET, POST, PATCH, DELETE, OPTIONS')
  });
});

// CREATE USER TEST
describe('POST /users', function() {
    test('should create a user', async function(){
        const res = await supertest(app)
  .post('/users')
  .send({
    username: 'Jules',
    email: 'jules@gmail.com',
    password: 'Test1234'
  })
  .expect(201)
  .expect('Content-Type', /text/)
    });
    test('should not create a user with an invalid email', async function(){
        const res = await supertest(app)
  .post('/users')
  .send({
    username: 'Jules1',
    email: 'julesgmail.com',
    password: 'Test1234'
  })
  .expect(500)
  .expect('Content-Type', /text/)
  .expect('User validation failed: email: Please enter a valid email address')
});
  }); 


//GET USER LIST TEST 
  describe('GET /users', function() {
    let Jules;
    let Stephane;
    beforeEach(async function() {
      // Create 2 users before retrieving the list.
        [Jules, Stephane]  = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        }),
        User.create({ 
            username: 'Stephane',
            email: 'stephane@gmail.com',
            clearPassword: 'Test1234'
        })
      ]);
    }); 
    test('should retrieve the list of users', async function() {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
          .get('/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /json/)
          expect(res.body).toBeArray();
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toBeObject();
          expect(res.body[0]._id).toEqual(Jules.id)
          expect(res.body[0].username).toEqual(Jules.username)
          expect(res.body[1]).toBeObject();
          expect(res.body[1]._id).toEqual(Stephane.id)
          expect(res.body[1].username).toEqual(Stephane.username)
        
        
    });
    test('should not retrieve the list of users without a token', async function() {
        const res = await supertest(app)
          .get('/users')
          .expect(401)
          .expect('Content-Type', /text/)
          .expect('Authorization header is missing')
    });
    test('should not retrieve the list of users with an invalid token', async function() {
        const res = await supertest(app)
          .get('/users')
          .set('Authorization', 'Bearer invalidtoken')
          .expect(401)
          .expect('Content-Type', /text/)
          .expect('Your token is invalid or has expired')
    });
    test('should not retrieve the list of users with a token that is not a bearer token', async function() {
        const res = await supertest(app)
          .get('/users')
          .set('Authorization', 'invalidtoken')
          .expect(401)
          .expect('Content-Type', /text/)
          .expect("Authorization header is not a bearer token")
    });
  });


  //GET USER BY USERNAME TEST
  describe('GET /users/:username', function() {
    let Jules;
    beforeEach(async function() {
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        })
      ]);
    }); 
    test('should return a user by name', async function() {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
          .get(`/users/${Jules.username}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', /json/)
          expect(res.body).toBeObject();
          expect(res.body._id).toEqual(Jules.id)
          expect(res.body.username).toEqual(Jules.username)
    });
    test('should return a 404 if the user does not exist', async function() {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
          .get('/users/Stephane')
          .set('Authorization', `Bearer ${token}`)
          .expect(404)
          .expect('Content-Type', /text/)
          .expect('User not found')
    });
  });


  //DELETE USER TEST  
  describe('DELETE /users/:username', function() {
    let Jules;
    let Stephane;
    beforeEach(async function() { 
        [Jules, Stephane] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        }),
        User.create({ 
          username: 'Stephane',
          email: 'stephane@gmail.com',
          clearPassword: 'Test1234',
      })
      ]);
    }); 
    test("should delete the user's account", async function() {
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
          .delete(`/users/${Stephane.username}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
    });
    test("should not find the user's account", async function() {
        const token = await generateValidJwt(Stephane);
        const res = await supertest(app)
          .delete(`/users/${Stephane.username}a`)
          .set('Authorization', `Bearer ${token}`)
          .expect(404)
          .expect('Content-Type', /text/)
          .expect('User not found')
    });
    test("should refuse to delete the user's account", async function() {
      const token = await generateValidJwt(Jules);
      const res = await supertest(app)
        .delete(`/users/${Stephane.username}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
    });
    test("should let admin delete other user's account", async function() {
      const token = await generateValidJwt(Jules, true);
      const res = await supertest(app)
        .delete(`/users/${Stephane.username}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /text/)
        .expect('User deleted successfully!')
    });
  });

  // MODIFY USER TEST
  describe('PATCH /users/:username', function() {
    let Jules;
    let Stephane;
    beforeEach(async function() { 
        [Jules, Stephane] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        }),
        User.create({ 
          username: 'Stephane',
          email: 'stephane@gmail.com',
          clearPassword: 'Test1234',
      })
      ]);
    });
    test("should modify the user's password and email", async function() {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
          .patch(`/users/${Jules.username}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            email: "jules@yahoo.com",
            password: "Test1234"
          })
          .expect(200)
          .expect('Content-Type', /text/)
    });
    test("should not find the user", async function() {
        const token = await generateValidJwt(Jules);
        const res = await supertest(app)
          .patch(`/users/${Jules.username}a`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            email: "jules@yahoo.com",
            password: "Test1234"
          })
          .expect(404)
          .expect('Content-Type', /text/)
          .expect('User not found')
  });
  test("should refuse to modify username", async function() {
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
      .patch(`/users/${Jules.username}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: "Jules",
        email: "jules.sandoz@gmail.com",
        password: "Test1234"
      })
      .expect(401)
      .expect('Content-Type', /text/)
      .expect('Username cannot be modified')
});
test("should refuse to modify other user's account", async function() {
  const token = await generateValidJwt(Jules);
  const res = await supertest(app)
    .patch(`/users/${Stephane.username}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      email: "stephanesordet@yahoo.fr",
      password: "Test1234"
    })
    .expect(401)
});
test("should let admin modify other user's account", async function() {
  const token = await generateValidJwt(Jules, true);
  const res = await supertest(app)
    .patch(`/users/${Stephane.username}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      email: "stephanesordet@gmail.com",
      password: "Test12345",
    })
    .expect(200)
    .expect('Content-Type', /text/)
    .expect('User successfully modified')
});
test("should get error from invalid email", async function() {
  const token = await generateValidJwt(Jules);
  const res = await supertest(app)
    .patch(`/users/${Jules.username}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      email: "jules",
      password: "Test1234"
    })
    .expect(500)
    .expect('Content-Type', /text/)
    .expect('User validation failed: email: Please enter a valid email address')
});
test("should get error from invalid password", async function() {
  const token = await generateValidJwt(Jules);
  const res = await supertest(app)
    .patch(`/users/${Jules.username}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      email: "jules.sandoz@gmail.com",
      password: "Test"
    })
    .expect(400)
    .expect('Content-Type', /text/)
    .expect('Password must be 8 characters or longer')
});

  afterAll(async () => {
    await mongoose.disconnect();
  });
});