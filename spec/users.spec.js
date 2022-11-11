import supertest from "supertest"
import mongoose from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"

beforeEach(cleanUpDatabase); 


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



  describe('POST /auth/login', function(){
    let Jules;
    beforeEach(async function() {
      // Create 2 users before retrieving the list.
      [ Jules ] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
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



  describe('GET /users', function() {
    let Jules;
    let Stephane;
    beforeEach(async function() {
      // Create 2 users before retrieving the list.
      [ Jules, Stephane ] = await Promise.all([
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
        
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });