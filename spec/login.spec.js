import supertest from "supertest"
import mongoose, { trusted } from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"

beforeEach(cleanUpDatabase);

//LOGIN USER TEST
describe('POST /auth/login', function(){
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
    test('should connect the user', async function(){
        const res = await supertest(app)
    .post('/auth/login')
    .send({
        email: 'jules@gmail.com',
        password: 'Test1234'
    })
    .expect(200)
    .expect('Content-Type', /json/)
    });
    test('should not find the user', async function(){
        const res = await supertest(app)
    .post('/auth/login')
    .send({
        email: 'jule@gmail.com',
        password: 'Test1234'
    })
    .expect(401)
});
test('should not connect user with wrong password', async function(){
    const res = await supertest(app)
.post('/auth/login')
.send({
    email: 'jules@gmail.com',
    password: 'Test123'
})
.expect(401)
});
});
afterAll(async () => {
    await mongoose.disconnect();
  });