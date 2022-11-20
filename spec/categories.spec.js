import supertest from "supertest"
import mongoose, { trusted } from "mongoose"
import app from "../app.js"
import { cleanUpDatabase, generateValidJwt } from "./utils.js"
import User from "../models/User.js"
import Category from "../models/Category.js"

beforeEach(cleanUpDatabase);

// GET CATEGORIES ROUTE OPTIONS TEST
describe('OPTIONS /categories', function(){
  test('should return a list of allowed methods without needing a token', async function(){
    const res = await supertest(app)
    .options('/categories')
    .expect(204)
    .expect('Allow', 'GET, POST, DELETE, OPTIONS')
  });
});

// CREATE CATEGORY TEST
describe('POST /categories', function() {
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
    test('should create a category', async function(){
    const token = await generateValidJwt(Jules, true);// Must be an Admin 
    const res = await supertest(app)
  .post('/categories')
  .set('Authorization', `Bearer ${token}`)
  .send({
    name: 'Nature',
    color: '#0000'
  })
  .expect(201)
  .expect('Content-Type', /text/)
    });
    test('should not create a category if user is not admin', async function(){
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
  .post('/categories')
  .set('Authorization', `Bearer ${token}`)
  .send({
    name: 'Nature',
    color: '#0000'
  })
  .expect(401)
  .expect('Content-Type', /text/)
  .expect('Unauthorized')
});
  });
  
  
  // DELETE CATEGORY TEST
describe('DELETE /categories/:name', function() {
    let Jules;
    let Car;
    beforeEach(async function() {
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        })
      ]);
    }); 
    beforeEach(async function() {
        [Car] = await Promise.all([
            Category.create({ 
                name: 'Car',
                color: '#0000'
            })    
      ]);
    }); 
    test('should delete a category', async function(){
    const token = await generateValidJwt(Jules, true);// Must be an Admin 
    const res = await supertest(app)
  .delete(`/categories/${Car.name}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', /text/)
    });
    test('should not delete a category if user is not admin', async function(){
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
  .delete(`/categories/${Car.name}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(401)
  .expect('Content-Type', /text/)
  .expect('Unauthorized')
    });
  });


   // GET CATEGORIES TEST
describe('GET /categories', function() {
    let Jules;
    let Nature;
    let Car;
    beforeEach(async function() {
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        })
      ]);
    }); 
    beforeEach(async function() {
        [Car, Nature] = await Promise.all([
            Category.create({ 
                name: 'Car',
                color: '#0000'
            }),
            Category.create({ 
                name: 'Nature',
                color: '#0000'
            })    
      ]);
    }); 
    it('should list a categories', async function(){
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
  .get('/categories')
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', /json/)
  expect(res.body).toBeArray();
  expect(res.body).toHaveLength(2);
  expect(res.body[0]).toBeObject();
  expect(res.body[0]._id).toEqual(Car.id)
  expect(res.body[0].name).toEqual(Car.name)
  expect(res.body[1]).toBeObject();
  expect(res.body[1]._id).toEqual(Nature.id)
  expect(res.body[1].name).toEqual(Nature.name)
    });
  });  


     // FIND CATEGORY BY NAME
describe('GET /categories/:name', function() {
    let Jules;
    let Nature;
    let Car;
    beforeEach(async function() {
        [Jules] = await Promise.all([
        User.create({ 
            username: 'Jules',
            email: 'jules@gmail.com',
            clearPassword: 'Test1234'
        })
      ]);
    }); 
    beforeEach(async function() {
        [Car, Nature] = await Promise.all([
            Category.create({ 
                name: 'Car',
                color: '#0000'
            }),
            Category.create({ 
                name: 'Nature',
                color: '#0000'
            })    
      ]);
    }); 
    test('should find a categoriy by her name', async function(){
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
  .get(`/categories/${Car.name}`)
  .set('Authorization', `Bearer ${token}`)
  .expect(200)
  .expect('Content-Type', /json/)
  expect(res.body).toBeObject();
  expect(res.body._id).toEqual(Car.id)
  expect(res.body.name).toEqual(Car.name)
    });
    test('should return 404 if category not found', async function(){
    const token = await generateValidJwt(Jules);
    const res = await supertest(app)
  .get(`/categories/NotACategory`)
  .set('Authorization', `Bearer ${token}`)
  .expect(404)
  .expect('Content-Type', /text/)
  .expect('Category not found')
    });
  });


  afterAll(async () => {
    await mongoose.disconnect();
  });
