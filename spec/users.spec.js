import supertest from "supertest"
import mongoose, { trusted } from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"

beforeEach(cleanUpDatabase); 

// CREATE USER TEST
describe('POST /users', function() {
    it('should create a user', async function(){
        const res = await supertest(app)
  .post('/users')
  .send({
    username: 'Jules',
    email: 'jules@gmail.com',
    password: 'Test1234'
  })
  .expect(201)
  .expect('Content-Type', /json/)
    });
  }); 


//LOGIN USER TEST
  describe('POST /auth/login', function(){
    let Jules;
    beforeEach(async function() {
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234',
            admin: true
        })
      ]);
    }); 
    it('should connect the user', async function(){
        const res = await supertest(app)
    .post('/auth/login')
    .send({
        email: 'jules@gmail.com',
        password: 'Test1234'
    })
    .expect(200)
    .expect('Content-Type', /json/)
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
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toBeObject();
          expect(res.body[0]._id).toEqual(Jules.id)
          expect(res.body[0].username).toEqual(Jules.username)
          expect(res.body[1]).toBeObject();
          expect(res.body[1].username).toEqual(Stephane.username)
        
        
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
  });


  
  describe('DELETE /users/:username', function() {
    let Jules;
    let Stephane;
    beforeEach(async function() { 
        [Jules, Stephane] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234',
            admin: true
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
  });


  describe('PATCH /users/:username', function() {
    let Jules;
    beforeEach(async function() { 
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@yahoo.com',
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
            email: "jules@gmail.com",
            password: "Test1234"
          })
          .expect(200)
          .expect('Content-Type', /json/)
          expect(res.body).toBeObject();
          expect(res.body.email).not.toEqual(Jules.email)
    });
  });


  afterAll(async () => {
    await mongoose.disconnect();
  });